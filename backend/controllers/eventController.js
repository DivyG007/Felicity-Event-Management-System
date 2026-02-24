const Event = require('../models/Event');
const Organizer = require('../models/Organizer');
const Registration = require('../models/Registration');
const Feedback = require('../models/Feedback');
const axios = require('axios');
const Fuse = require('fuse.js');

// Helper function to compute event status based on current time
const computeEventStatus = (event) => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    if (now < startDate) return 'published';
    if (now >= startDate && now <= endDate) return 'ongoing';
    return 'completed';
};

// GET /api/events
exports.getEvents = async (req, res, next) => {
    try {
        const { search, type, eligibility, dateFrom, dateTo, followedOnly, status, organizerOnly } = req.query;
        const query = {};

        // Organizers can see their own events (all statuses), participants see only published+
        if (organizerOnly && req.user.role === 'organizer') {
            const org = await Organizer.findOne({ userId: req.user._id });
            if (org) query.organizerId = org._id;
            if (status) query.status = status;
        } else {
            query.status = { $in: ['published', 'ongoing', 'completed'] };
        }

        // Don't use MongoDB $text for search - will use fuzzy matching
        if (type) query.type = type;
        if (eligibility) query.eligibility = eligibility;
        if (dateFrom || dateTo) {
            query.startDate = {};
            if (dateFrom) query.startDate.$gte = new Date(dateFrom);
            if (dateTo) query.startDate.$lte = new Date(dateTo);
        }

        // Filter by followed organizers
        if (followedOnly && req.user) {
            const user = await require('../models/User').findById(req.user._id);
            if (user?.followedOrganizers?.length) {
                query.organizerId = { $in: user.followedOrganizers };
            }
        }

        let events = await Event.find(query)
            .populate('organizerId', 'name category')
            .sort({ startDate: -1 });

        // Apply fuzzy search if search term provided
        if (search) {
            const fuse = new Fuse(events, {
                keys: ['name', 'description', 'organizerId.name'],
                threshold: 0.3, // Allow fuzzy matching
                includeScore: true,
            });
            const fuzzyResults = fuse.search(search);
            events = fuzzyResults.map(result => result.item);
        }

        // Apply auto-status computation for display
        events = events.map(event => {
            const eventObj = event.toObject ? event.toObject() : event;
            eventObj.displayStatus = computeEventStatus(event);
            return eventObj;
        });

        res.json({ events });
    } catch (error) { next(error); }
};

// GET /api/events/trending
exports.getTrendingEvents = async (req, res, next) => {
    try {
        let events = await Event.find({ status: { $in: ['published', 'ongoing'] } })
            .sort({ registrationCount: -1 })
            .limit(5)
            .populate('organizerId', 'name');
        
        // Apply auto-status computation for display
        events = events.map(event => {
            const eventObj = event.toObject ? event.toObject() : event;
            eventObj.displayStatus = computeEventStatus(event);
            return eventObj;
        });
        
        res.json(events);
    } catch (error) { next(error); }
};

// GET /api/events/:id
exports.getEventById = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizerId', 'name category contactEmail');
        if (!event) return res.status(404).json({ message: 'Event not found' });
        
        // Apply auto-status computation for display
        const eventObj = event.toObject ? event.toObject() : event;
        eventObj.displayStatus = computeEventStatus(event);
        
        res.json(eventObj);
    } catch (error) { next(error); }
};

// POST /api/events
exports.createEvent = async (req, res, next) => {
    try {
        const org = await Organizer.findOne({ userId: req.user._id });
        if (!org) return res.status(403).json({ message: 'Organizer profile not found' });

        const event = await Event.create({ ...req.body, organizerId: org._id });

        // Discord webhook notification
        if (org.discordWebhook && event.status === 'published') {
            try {
                await axios.post(org.discordWebhook, {
                    content: `🎪 **New Event Published!**\n**${event.name}**\n${event.description?.substring(0, 200) || ''}\n📅 ${new Date(event.startDate).toLocaleDateString()}`,
                });
            } catch (e) { console.log('Discord webhook failed:', e.message); }
        }

        res.status(201).json(event);
    } catch (error) { next(error); }
};

// PUT /api/events/:id
exports.updateEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const org = await Organizer.findOne({ userId: req.user._id });
        if (!org || event.organizerId.toString() !== org._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Editing rules
        if (event.status === 'completed' || event.status === 'closed') {
            return res.status(400).json({ message: 'Cannot edit completed/closed events' });
        }

        // Lock form if any registrations exist
        if (event.registrationCount > 0 && req.body.customForm) {
            return res.status(400).json({ message: 'Cannot modify form after registrations exist' });
        }

        Object.assign(event, req.body);
        await event.save();
        res.json(event);
    } catch (error) { next(error); }
};

// PUT /api/events/:id/status
exports.changeStatus = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const org = await Organizer.findOne({ userId: req.user._id });
        if (!org || event.organizerId.toString() !== org._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const allowed = {
            draft: ['published'],
            published: ['ongoing', 'closed'],
            ongoing: ['completed', 'closed'],
        };

        if (!allowed[event.status]?.includes(req.body.status)) {
            return res.status(400).json({ message: `Cannot change from ${event.status} to ${req.body.status}` });
        }

        event.status = req.body.status;

        // If publishing and Discord webhook is set
        if (req.body.status === 'published' && org.discordWebhook) {
            try {
                await axios.post(org.discordWebhook, {
                    content: `🎪 **New Event Published!**\n**${event.name}**\n${event.description?.substring(0, 200) || ''}\n📅 ${new Date(event.startDate).toLocaleDateString()}`,
                });
            } catch (e) { console.log('Discord webhook failed:', e.message); }
        }

        await event.save();
        res.json(event);
    } catch (error) { next(error); }
};

// GET /api/events/:id/participants
exports.getParticipants = async (req, res, next) => {
    try {
        const registrations = await Registration.find({ eventId: req.params.id })
            .populate('participantId', 'firstName lastName email contactNumber')
            .sort({ createdAt: -1 });
        // Remap field name for frontend compatibility
        const mapped = registrations.map(r => ({
            ...r.toObject(),
            userId: r.participantId,
        }));
        res.json(mapped);
    } catch (error) { next(error); }
};

// GET /api/events/:id/analytics
exports.getAnalytics = async (req, res, next) => {
    try {
        const registrations = await Registration.find({ eventId: req.params.id });
        const event = await Event.findById(req.params.id);
        const feedback = await Feedback.find({ eventId: req.params.id });

        const totalRegistrations = registrations.length;
        const attended = registrations.filter(r => r.status === 'attended').length;
        const revenue = totalRegistrations * (event?.registrationFee || 0);
        
        // Merchandise sales
        const merchandiseUnits = registrations.reduce((sum, r) => sum + (r.quantity || 0), 0);
        const merchandiseRevenue = registrations.reduce((sum, r) => sum + ((r.quantity || 0) * (event?.merchandiseDetails?.price || 0)), 0);

        // Team completion stats (derived from registration form responses)
        const teamIdKeys = ['teamid', 'team_id', 'teamname', 'team_name', 'team', 'groupname', 'group_name', 'group'];
        const teamSizeKeys = ['teamsize', 'team_size', 'memberscount', 'membercount', 'teammembers', 'members'];
        const teams = new Map();

        for (const reg of registrations) {
            const responses = reg.formResponses;
            if (!responses || typeof responses !== 'object' || Array.isArray(responses)) continue;

            const normalized = Object.entries(responses).reduce((acc, [key, value]) => {
                acc[String(key).toLowerCase()] = value;
                return acc;
            }, {});

            const rawTeamId = teamIdKeys.map((k) => normalized[k]).find((value) => value !== undefined && value !== null && String(value).trim());
            if (!rawTeamId) continue;

            const teamId = String(rawTeamId).trim().toLowerCase();
            const rawTeamSize = teamSizeKeys.map((k) => normalized[k]).find((value) => value !== undefined && value !== null && String(value).trim());
            const parsedSize = Number.parseInt(rawTeamSize, 10);
            const expectedSize = Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : null;

            const existing = teams.get(teamId) || { registrations: 0, attended: 0, expectedSize: null };
            existing.registrations += 1;
            if (reg.status === 'attended') existing.attended += 1;
            if (expectedSize) existing.expectedSize = Math.max(existing.expectedSize || 0, expectedSize);
            teams.set(teamId, existing);
        }

        const totalTeams = teams.size;
        const completedTeams = Array.from(teams.values()).filter((team) => team.expectedSize && team.registrations >= team.expectedSize).length;
        const attendedTeams = Array.from(teams.values()).filter((team) => team.registrations > 0 && team.attended === team.registrations).length;
        const incompleteTeams = Math.max(totalTeams - completedTeams, 0);
        const teamCompletionRate = totalTeams ? Number(((completedTeams / totalTeams) * 100).toFixed(1)) : 0;
        
        const ratings = feedback.map(f => f.rating).filter(Boolean);
        const averageRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

        res.json({ 
            totalRegistrations, 
            attended, 
            revenue, 
            merchandiseUnits,
            merchandiseRevenue,
            totalRevenue: revenue + merchandiseRevenue,
            totalTeams,
            completedTeams,
            incompleteTeams,
            attendedTeams,
            teamCompletionRate,
            averageRating, 
            feedbackCount: feedback.length 
        });
    } catch (error) { next(error); }
};

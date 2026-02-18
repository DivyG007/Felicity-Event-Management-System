const Event = require('../models/Event');
const Organizer = require('../models/Organizer');
const Registration = require('../models/Registration');
const Feedback = require('../models/Feedback');
const axios = require('axios');

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

        if (search) query.$text = { $search: search };
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

        const events = await Event.find(query)
            .populate('organizerId', 'name category')
            .sort({ startDate: -1 });

        res.json({ events });
    } catch (error) { next(error); }
};

// GET /api/events/trending
exports.getTrendingEvents = async (req, res, next) => {
    try {
        const events = await Event.find({ status: { $in: ['published', 'ongoing'] } })
            .sort({ registrationCount: -1 })
            .limit(5)
            .populate('organizerId', 'name');
        res.json(events);
    } catch (error) { next(error); }
};

// GET /api/events/:id
exports.getEventById = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizerId', 'name category contactEmail');
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
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
        const ratings = feedback.map(f => f.rating).filter(Boolean);
        const averageRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

        res.json({ totalRegistrations, attended, revenue, averageRating, feedbackCount: feedback.length });
    } catch (error) { next(error); }
};

const User = require('../models/User');
const Organizer = require('../models/Organizer');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Feedback = require('../models/Feedback');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const { sendPasswordResetEmail } = require('../utils/emailTemplates');

// POST /api/admin/organizers — Create new organizer
exports.createOrganizer = async (req, res, next) => {
    try {
        const { name, category, contactEmail, description } = req.body;

        // Auto-generate email and password
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const email = `${slug}@felicity.iiit.ac.in`;
        const password = crypto.randomBytes(6).toString('hex'); // 12-char random password

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'An organizer with this email already exists' });

        // Create user account
        const user = await User.create({
            firstName: name,
            lastName: 'Club',
            email,
            password,
            role: 'organizer',
        });

        // Create organizer profile
        const organizer = await Organizer.create({
            userId: user._id,
            name,
            category: category || 'General',
            description: description || '',
            contactEmail: contactEmail || email,
            loginEmail: email,
            active: true,
        });

        res.status(201).json({ email, password, organizer });
    } catch (error) { next(error); }
};

// GET /api/admin/organizers
exports.listOrganizers = async (req, res, next) => {
    try {
        const organizers = await Organizer.find().populate('userId', 'email');
        // Add event count
        const withCounts = await Promise.all(organizers.map(async (org) => {
            const eventCount = await Event.countDocuments({ organizerId: org._id });
            return { ...org.toObject(), eventCount };
        }));
        res.json(withCounts);
    } catch (error) { next(error); }
};

// DELETE /api/admin/organizers/:id
// Query param action supports: disable, enable, archive, unarchive, delete
exports.removeOrganizer = async (req, res, next) => {
    try {
        const org = await Organizer.findById(req.params.id);
        if (!org) return res.status(404).json({ message: 'Organizer not found' });
        
        const { action = '' } = req.query;
        
        if (action === 'delete') {
            // Permanent deletion with cascade
            const events = await Event.find({ organizerId: org._id });
            const eventIds = events.map(e => e._id);
            
            // Delete all registrations for these events
            await Registration.deleteMany({ eventId: { $in: eventIds } });
            
            // Delete all feedback for these events
            await Feedback.deleteMany({ eventId: { $in: eventIds } });
            
            // Delete all events
            await Event.deleteMany({ organizerId: org._id });
            
            // Delete the organizer
            await Organizer.findByIdAndDelete(req.params.id);
            
            // Delete associated user
            await User.findByIdAndDelete(org.userId);
            
            res.json({ message: 'Organizer and all associated data permanently deleted' });
        } else if (action === 'archive') {
            org.active = false;
            org.archived = true;
            org.archivedAt = new Date();
            await org.save();
            res.json({ message: 'Organizer archived', organizer: org });
        } else if (action === 'unarchive') {
            org.archived = false;
            org.archivedAt = null;
            org.active = true;
            await org.save();
            res.json({ message: 'Organizer unarchived and enabled', organizer: org });
        } else if (action === 'disable') {
            org.active = false;
            await org.save();
            res.json({ message: 'Organizer disabled', organizer: org });
        } else if (action === 'enable') {
            if (org.archived) {
                return res.status(400).json({ message: 'Cannot enable an archived organizer. Unarchive first.' });
            }
            org.active = true;
            await org.save();
            res.json({ message: 'Organizer enabled', organizer: org });
        } else {
            // Backward compatibility: toggle active status
            org.active = !org.active;
            await org.save();
            res.json({ message: `Organizer ${org.active ? 'enabled' : 'disabled'}`, organizer: org });
        }
    } catch (error) { next(error); }
};

// GET /api/admin/password-reset-requests
exports.getPasswordResetRequests = async (req, res, next) => {
    try {
        const requests = await PasswordResetRequest.find()
            .populate('userId', 'email')
            .populate('organizerId', 'name')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) { next(error); }
};

// PUT /api/admin/password-reset-requests/:id
exports.handlePasswordResetRequest = async (req, res, next) => {
    try {
        const request = await PasswordResetRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending requests can be processed' });
        }

        const { action } = req.body; // 'approve' or 'reject'
        if (action === 'approve') {
            const user = await User.findById(request.userId);
            if (!user) return res.status(404).json({ message: 'User not found' });
            if (!request.newPassword) {
                return res.status(400).json({ message: 'Requested new password not found on this request' });
            }

            user.password = request.newPassword;
            await user.save();

            request.status = 'approved';
            request.approvedAt = new Date();
            request.selfResetUsed = true;
            request.selfResetUsedAt = new Date();
            request.resolvedAt = new Date();
            await request.save();

            // Send approval notification (non-blocking)
            const org = await Organizer.findById(request.organizerId);
            sendPasswordResetEmail(user.email, org?.name || 'Organizer');

            res.json({ message: 'Password reset approved and applied successfully.' });
        } else {
            request.status = 'rejected';
            request.resolvedAt = new Date();
            await request.save();
            res.json({ message: 'Password reset rejected' });
        }
    } catch (error) { next(error); }
};

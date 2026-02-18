const User = require('../models/User');
const Organizer = require('../models/Organizer');
const Event = require('../models/Event');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const crypto = require('crypto');
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
exports.removeOrganizer = async (req, res, next) => {
    try {
        const org = await Organizer.findById(req.params.id);
        if (!org) return res.status(404).json({ message: 'Organizer not found' });
        org.active = !org.active;
        await org.save();
        res.json({ message: `Organizer ${org.active ? 'enabled' : 'disabled'}`, organizer: org });
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

        const { action } = req.body; // 'approve' or 'reject'
        if (action === 'approve') {
            const newPassword = crypto.randomBytes(6).toString('hex');
            const user = await User.findById(request.userId);
            user.password = newPassword;
            await user.save();
            request.status = 'approved';
            request.newPassword = newPassword;
            await request.save();

            // Send email notification (non-blocking)
            const org = await Organizer.findById(request.organizerId);
            sendPasswordResetEmail(user.email, org?.name || 'Organizer', newPassword);

            res.json({ message: 'Password reset approved', newPassword });
        } else {
            request.status = 'rejected';
            await request.save();
            res.json({ message: 'Password reset rejected' });
        }
    } catch (error) { next(error); }
};

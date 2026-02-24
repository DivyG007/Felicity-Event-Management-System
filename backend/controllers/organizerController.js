const Organizer = require('../models/Organizer');
const Event = require('../models/Event');
const User = require('../models/User');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const axios = require('axios');

// GET /api/organizers
exports.getAllOrganizers = async (req, res, next) => {
    try {
        const organizers = await Organizer.find({ active: true }).select('name category description contactEmail');
        res.json(organizers);
    } catch (error) { next(error); }
};

// GET /api/organizers/:id
exports.getOrganizerById = async (req, res, next) => {
    try {
        let organizer;
        if (req.params.id === 'me') {
            organizer = await Organizer.findOne({ userId: req.user._id });
        } else {
            organizer = await Organizer.findById(req.params.id);
        }
        if (!organizer) return res.status(404).json({ message: 'Organizer not found' });
        const events = await Event.find({ organizerId: organizer._id, status: { $in: ['published', 'ongoing', 'completed'] } }).sort({ startDate: -1 });
        res.json({ organizer, events });
    } catch (error) { next(error); }
};

// PUT /api/organizers/profile
exports.updateProfile = async (req, res, next) => {
    try {
        const { name, category, description, contactEmail, contactNumber, discordWebhook } = req.body;
        const normalizedWebhook = (discordWebhook || '').trim();

        if (normalizedWebhook && !/^https:\/\/discord\.com\/api\/webhooks\/.+/i.test(normalizedWebhook)) {
            return res.status(400).json({ message: 'Invalid Discord webhook URL format' });
        }

        const org = await Organizer.findOneAndUpdate(
            { userId: req.user._id },
            { name, category, description, contactEmail, contactNumber, discordWebhook: normalizedWebhook },
            { new: true }
        );
        if (!org) return res.status(404).json({ message: 'Organizer profile not found' });
        res.json(org);
    } catch (error) { next(error); }
};

// POST /api/organizers/test-webhook
exports.testWebhook = async (req, res, next) => {
    try {
        const org = await Organizer.findOne({ userId: req.user._id });
        if (!org) return res.status(404).json({ message: 'Organizer profile not found' });

        const webhook = (org.discordWebhook || '').trim();
        if (!webhook) return res.status(400).json({ message: 'Please save a Discord webhook URL first' });
        if (!/^https:\/\/discord\.com\/api\/webhooks\/.+/i.test(webhook)) {
            return res.status(400).json({ message: 'Saved Discord webhook URL is invalid' });
        }

        await axios.post(webhook, {
            content: `✅ Test message from ${org.name || 'Organizer'}\nDiscord webhook is configured correctly.`,
        }, { timeout: 10000 });

        res.json({ message: 'Webhook test successful' });
    } catch (error) {
        const detail = error.response?.data?.message || error.response?.data || error.message;
        res.status(400).json({ message: `Webhook test failed: ${detail}` });
    }
};

// POST /api/organizers/follow/:id
exports.followOrganizer = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.user._id,
            { $addToSet: { followedOrganizers: req.params.id } },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (error) { next(error); }
};

// DELETE /api/organizers/follow/:id
exports.unfollowOrganizer = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.user._id,
            { $pull: { followedOrganizers: req.params.id } },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (error) { next(error); }
};

// POST /api/organizers/password-reset-request
exports.requestPasswordReset = async (req, res, next) => {
    try {
        const { reason, newPassword, confirmPassword } = req.body;
        if (!newPassword || String(newPassword).length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const org = await Organizer.findOne({ userId: req.user._id });
        if (!org) return res.status(404).json({ message: 'Organizer not found' });

        const existing = await PasswordResetRequest.findOne({ userId: req.user._id, status: 'pending' });
        if (existing) return res.status(400).json({ message: 'You already have a pending reset request' });

        const request = await PasswordResetRequest.create({
            userId: req.user._id,
            organizerId: org._id,
            reason: (reason || '').trim() || 'No reason provided',
            newPassword,
        });
        res.status(201).json(request);
    } catch (error) { next(error); }
};

// GET /api/organizers/password-reset-status
exports.getPasswordResetStatus = async (req, res, next) => {
    try {
        const latestRequest = await PasswordResetRequest.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
        if (!latestRequest) {
            return res.json({ hasRequest: false });
        }

        res.json({
            hasRequest: true,
            status: latestRequest.status,
            reason: latestRequest.reason,
            createdAt: latestRequest.createdAt,
            approvedAt: latestRequest.approvedAt,
            resolvedAt: latestRequest.resolvedAt,
            selfResetUsed: !!latestRequest.selfResetUsed,
            selfResetUsedAt: latestRequest.selfResetUsedAt,
            canResetOnce: false,
        });
    } catch (error) { next(error); }
};

// POST /api/organizers/password-reset-complete
exports.completeApprovedPasswordReset = async (req, res, next) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        if (!newPassword || String(newPassword).length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }
        if (confirmPassword !== undefined && newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const request = await PasswordResetRequest.findOne({
            userId: req.user._id,
            status: 'approved',
            selfResetUsed: false,
        }).sort({ createdAt: -1 });

        if (!request) {
            return res.status(400).json({ message: 'No approved one-time reset permission found' });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.password = newPassword;
        await user.save();

        request.selfResetUsed = true;
        request.selfResetUsedAt = new Date();
        request.status = 'completed';
        request.resolvedAt = new Date();
        await request.save();

        res.json({ message: 'Password reset completed successfully' });
    } catch (error) { next(error); }
};

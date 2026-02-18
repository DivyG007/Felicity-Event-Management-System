const Organizer = require('../models/Organizer');
const Event = require('../models/Event');
const User = require('../models/User');
const PasswordResetRequest = require('../models/PasswordResetRequest');

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
        const org = await Organizer.findOneAndUpdate(
            { userId: req.user._id },
            { name, category, description, contactEmail, contactNumber, discordWebhook },
            { new: true }
        );
        if (!org) return res.status(404).json({ message: 'Organizer profile not found' });
        res.json(org);
    } catch (error) { next(error); }
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
        const org = await Organizer.findOne({ userId: req.user._id });
        if (!org) return res.status(404).json({ message: 'Organizer not found' });
        const existing = await PasswordResetRequest.findOne({ userId: req.user._id, status: 'pending' });
        if (existing) return res.status(400).json({ message: 'You already have a pending reset request' });
        const request = await PasswordResetRequest.create({
            userId: req.user._id,
            organizerId: org._id,
            reason: req.body.reason || '',
        });
        res.status(201).json(request);
    } catch (error) { next(error); }
};

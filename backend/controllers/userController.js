const User = require('../models/User');
const Organizer = require('../models/Organizer');

// GET /api/users/profile
exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) { next(error); }
};

// PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
    try {
        const { firstName, lastName, contactNumber, college, interests } = req.body;
        const user = await User.findByIdAndUpdate(req.user._id,
            { firstName, lastName, contactNumber, college, interests },
            { new: true, runValidators: true }
        ).select('-password');
        res.json(user);
    } catch (error) { next(error); }
};

// PUT /api/users/onboarding
exports.completeOnboarding = async (req, res, next) => {
    try {
        const { interests, followedOrganizers } = req.body;
        const user = await User.findByIdAndUpdate(req.user._id,
            { interests: interests || [], followedOrganizers: followedOrganizers || [], onboardingCompleted: true },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (error) { next(error); }
};

// PUT /api/users/password
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
        if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password changed successfully' });
    } catch (error) { next(error); }
};

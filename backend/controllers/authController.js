const User = require('../models/User');
const Organizer = require('../models/Organizer');
const jwt = require('jsonwebtoken');

// Helper: generate JWT
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// IIIT email domain validation — accepts name@<anyrole>.iiit.ac.in
const isIIITEmail = (email) => {
    return /^[^@]+@[^@]+\.iiit\.ac\.in$/i.test(email);
};

// POST /api/auth/register
exports.register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, participantType, college, contactNumber } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Validate IIIT email
        if (participantType === 'iiit') {
            if (!isIIITEmail(email)) {
                return res.status(400).json({ message: 'IIIT participants must use an IIIT-issued email address' });
            }
        }

        // Create participant user
        const user = await User.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password,
            role: 'participant',
            participantType,
            college: college || '',
            contactNumber: contactNumber || '',
        });

        const token = generateToken(user);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                participantType: user.participantType,
                onboardingCompleted: user.onboardingCompleted,
                contactNumber: user.contactNumber,
                college: user.college,
                interests: user.interests,
                followedOrganizers: (user.followedOrganizers || []).map(id => id.toString()),
            },
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // For organizers, check if their organizer profile is active
        if (user.role === 'organizer') {
            const organizer = await Organizer.findOne({ userId: user._id });
            if (!organizer || !organizer.active) {
                if (organizer?.archived) {
                    return res.status(401).json({ message: 'This organizer account is archived' });
                }
                return res.status(401).json({ message: 'This organizer account has been disabled' });
            }
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user);

        // Build response user object
        const userData = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            contactNumber: user.contactNumber,
            college: user.college,
            interests: user.interests,
            followedOrganizers: (user.followedOrganizers || []).map(id => id.toString()),
        };

        if (user.role === 'participant') {
            userData.participantType = user.participantType;
            userData.onboardingCompleted = user.onboardingCompleted;
        }

        // If organizer, attach organizer profile
        if (user.role === 'organizer') {
            const organizer = await Organizer.findOne({ userId: user._id });
            userData.organizerProfile = organizer;
        }

        res.json({ token, user: userData });
    } catch (error) {
        next(error);
    }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
    // JWT is stateless; client clears token
    res.json({ message: 'Logged out successfully' });
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return consistent shape matching login response
        const userData = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            contactNumber: user.contactNumber,
            college: user.college,
            interests: user.interests,
            followedOrganizers: (user.followedOrganizers || []).map(id => id.toString()),
        };

        if (user.role === 'participant') {
            userData.participantType = user.participantType;
            userData.onboardingCompleted = user.onboardingCompleted;
        }

        // If organizer, attach organizer profile
        if (user.role === 'organizer') {
            const organizer = await Organizer.findOne({ userId: user._id });
            userData.organizerProfile = organizer;
        }

        res.json(userData);
    } catch (error) {
        next(error);
    }
};

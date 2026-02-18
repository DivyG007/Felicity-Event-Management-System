const Feedback = require('../models/Feedback');
const Registration = require('../models/Registration');

// POST /api/feedback
exports.submitFeedback = async (req, res, next) => {
    try {
        const { eventId, rating, comment } = req.body;

        // Verify participant attended the event
        const reg = await Registration.findOne({ participantId: req.user._id, eventId });
        if (!reg) return res.status(400).json({ message: 'You are not registered for this event' });

        // Check duplicate
        const existing = await Feedback.findOne({ participantId: req.user._id, eventId });
        if (existing) return res.status(400).json({ message: 'Feedback already submitted' });

        const feedback = await Feedback.create({
            participantId: req.user._id,
            eventId,
            rating,
            comment,
            isAnonymous: req.body.isAnonymous || false,
        });
        res.status(201).json(feedback);
    } catch (error) { next(error); }
};

// GET /api/feedback/event/:eventId
exports.getEventFeedback = async (req, res, next) => {
    try {
        const feedback = await Feedback.find({ eventId: req.params.eventId })
            .populate('participantId', 'firstName lastName')
            .sort({ createdAt: -1 });

        // Hide participant info for anonymous feedback
        const sanitized = feedback.map(f => {
            const obj = f.toObject();
            if (obj.isAnonymous) {
                obj.participantId = { firstName: 'Anonymous', lastName: '' };
            }
            return obj;
        });

        res.json(sanitized);
    } catch (error) { next(error); }
};

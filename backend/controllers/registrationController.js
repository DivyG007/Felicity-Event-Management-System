const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { sendRegistrationEmail } = require('../utils/emailTemplates');

// POST /api/registrations
exports.register = async (req, res, next) => {
    try {
        const { eventId, formResponses, selectedSize, selectedColor, selectedVariant, quantity } = req.body;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.status !== 'published' && event.status !== 'ongoing') {
            return res.status(400).json({ message: 'Event is not open for registration' });
        }
        if (new Date(event.registrationDeadline) < new Date()) {
            return res.status(400).json({ message: 'Registration deadline has passed' });
        }
        if (event.registrationLimit && event.registrationCount >= event.registrationLimit) {
            return res.status(400).json({ message: 'Registration limit reached' });
        }

        // Check eligibility
        const user = req.user;
        if (event.eligibility === 'iiit-only' && user.participantType !== 'iiit') {
            return res.status(403).json({ message: 'This event is restricted to IIIT students' });
        }
        if (event.eligibility === 'non-iiit-only' && user.participantType === 'iiit') {
            return res.status(403).json({ message: 'This event is restricted to non-IIIT participants' });
        }

        // Check duplicate
        const existing = await Registration.findOne({ participantId: user._id, eventId });
        if (existing) return res.status(400).json({ message: 'Already registered for this event' });

        // Merchandise stock check
        if (event.type === 'merchandise') {
            const qty = quantity || 1;
            if (event.merchandiseDetails.stockQuantity < qty) {
                return res.status(400).json({ message: 'Insufficient stock' });
            }
            // Check purchase limit
            const existingPurchases = await Registration.countDocuments({ participantId: user._id, eventId });
            if (existingPurchases + qty > event.merchandiseDetails.purchaseLimitPerUser) {
                return res.status(400).json({ message: `Purchase limit is ${event.merchandiseDetails.purchaseLimitPerUser} per user` });
            }
            // Decrement stock
            event.merchandiseDetails.stockQuantity -= qty;
        }

        // Generate ticket
        const ticketId = `FEL-${Date.now().toString(36).toUpperCase()}-${uuidv4().substring(0, 4).toUpperCase()}`;
        const qrCode = await QRCode.toDataURL(JSON.stringify({ ticketId, eventId, participantId: user._id.toString() }));

        // Determine initial status based on event type and payment requirement
        let initialStatus = 'registered';
        let initialPaymentStatus = 'none';
        
        if (event.type === 'merchandise') {
            initialStatus = 'pending-payment';
            initialPaymentStatus = 'pending';
        } else if (event.registrationFee > 0) {
            // Normal event with fee - require payment proof
            initialStatus = 'pending-payment';
            initialPaymentStatus = 'pending';
        }

        const registration = await Registration.create({
            participantId: user._id,
            eventId,
            ticketId,
            qrCode,
            formResponses: formResponses || {},
            selectedSize,
            selectedColor,
            selectedVariant,
            quantity: quantity || 1,
            status: initialStatus,
            paymentStatus: initialPaymentStatus,
        });

        // Increment count
        event.registrationCount += 1;
        if (event.registrationCount > 0) event.formLocked = true;
        await event.save();

        // Send confirmation email (non-blocking)
        sendRegistrationEmail(user, event, registration);

        res.status(201).json(registration);
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'Already registered for this event' });
        next(error);
    }
};

// GET /api/registrations/my
exports.getMyRegistrations = async (req, res, next) => {
    try {
        const registrations = await Registration.find({ participantId: req.user._id })
            .populate({
                path: 'eventId',
                populate: { path: 'organizerId', select: 'name' },
            })
            .sort({ createdAt: -1 });
        res.json(registrations);
    } catch (error) { next(error); }
};

// GET /api/registrations/:id/ticket
exports.getTicket = async (req, res, next) => {
    try {
        const reg = await Registration.findById(req.params.id)
            .populate('eventId', 'name startDate endDate type organizerId')
            .populate('participantId', 'firstName lastName email');
        if (!reg) return res.status(404).json({ message: 'Registration not found' });
        if (reg.participantId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        res.json(reg);
    } catch (error) { next(error); }
};

// POST /api/registrations/:id/payment-proof
exports.uploadPaymentProof = async (req, res, next) => {
    try {
        const reg = await Registration.findById(req.params.id);
        if (!reg) return res.status(404).json({ message: 'Registration not found' });
        if (reg.participantId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (!req.file) return res.status(400).json({ message: 'Payment proof file required' });
        reg.paymentProof = req.file.path || req.file.filename;
        reg.paymentStatus = 'pending';
        await reg.save();
        res.json(reg);
    } catch (error) { next(error); }
};

// PUT /api/registrations/:id/payment-status
exports.updatePaymentStatus = async (req, res, next) => {
    try {
        const reg = await Registration.findById(req.params.id).populate('eventId');
        if (!reg) return res.status(404).json({ message: 'Registration not found' });
        const { status } = req.body; // 'approved' or 'rejected'
        reg.paymentStatus = status;
        reg.status = status === 'approved' ? 'approved' : 'rejected';
        if (status === 'rejected' && reg.eventId.type === 'merchandise') {
            // Restore stock
            await Event.findByIdAndUpdate(reg.eventId._id, {
                $inc: { 'merchandiseDetails.stockQuantity': reg.quantity || 1 },
            });
        }
        await reg.save();
        res.json(reg);
    } catch (error) { next(error); }
};

// POST /api/registrations/:id/attendance
exports.markAttendance = async (req, res, next) => {
    try {
        const reg = await Registration.findById(req.params.id).populate('eventId');
        if (!reg) return res.status(404).json({ message: 'Registration not found' });
        if (reg.status === 'attended') return res.status(400).json({ message: 'Already marked as attended' });
        
        // Check if payment is required and approved
        if (reg.eventId.registrationFee > 0 || reg.eventId.type === 'merchandise') {
            if (reg.paymentStatus !== 'approved') {
                return res.status(400).json({ message: 'Payment must be approved before marking attendance' });
            }
        }
        
        reg.status = 'attended';
        reg.attendedAt = new Date();
        reg.attendanceMarkedBy = req.user._id;
        await reg.save();
        res.json(reg);
    } catch (error) { next(error); }
};

// GET /api/registrations/event/:eventId/attendance
exports.getAttendanceReport = async (req, res, next) => {
    try {
        const registrations = await Registration.find({ eventId: req.params.eventId })
            .populate('participantId', 'firstName lastName email')
            .select('ticketId status attendedAt participantId');
        const total = registrations.length;
        const attended = registrations.filter(r => r.status === 'attended').length;
        res.json({ total, attended, rate: total ? ((attended / total) * 100).toFixed(1) : 0, registrations });
    } catch (error) { next(error); }
};

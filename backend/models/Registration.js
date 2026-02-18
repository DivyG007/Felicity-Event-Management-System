const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    ticketId: { type: String, unique: true, required: true },
    qrCode: { type: String },           // Base64 or URL of QR image
    status: {
        type: String,
        enum: ['registered', 'pending-payment', 'approved', 'rejected', 'cancelled', 'attended'],
        default: 'registered',
    },

    // Custom form responses (for normal events)
    formResponses: { type: mongoose.Schema.Types.Mixed },

    // Merchandise-specific
    selectedSize: { type: String },
    selectedColor: { type: String },
    selectedVariant: { type: String },
    quantity: { type: Number, default: 1 },

    // Payment (Tier A: Payment Approval Workflow)
    paymentProof: { type: String },      // URL/path to uploaded proof image
    paymentStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },

    // Attendance (Tier A: QR Scanner)
    attendedAt: { type: Date },
    attendanceMarkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Compound index to prevent duplicate registrations
registrationSchema.index({ participantId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);

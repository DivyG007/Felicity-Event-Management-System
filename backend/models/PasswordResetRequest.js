const mongoose = require('mongoose');

const passwordResetRequestSchema = new mongoose.Schema({
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizer', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
    adminComment: { type: String, trim: true },
    newPassword: { type: String }, // Organizer-requested new password, applied on admin approval
    approvedAt: { type: Date },
    selfResetUsed: { type: Boolean, default: false },
    selfResetUsedAt: { type: Date },
    resolvedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('PasswordResetRequest', passwordResetRequestSchema);

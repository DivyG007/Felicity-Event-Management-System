const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    contactEmail: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    loginEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    discordWebhook: { type: String, trim: true },
    active: { type: Boolean, default: true },
    archived: { type: Boolean, default: false },
    archivedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Organizer', organizerSchema);

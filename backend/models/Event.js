const mongoose = require('mongoose');

// Sub-schema for custom form fields (Form Builder)
const formFieldSchema = new mongoose.Schema({
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'textarea', 'dropdown', 'checkbox', 'file', 'number', 'email'], required: true },
    options: [{ type: String }],       // For dropdown/checkbox
    required: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
}, { _id: true });

// Sub-schema for merchandise details
const merchandiseDetailSchema = new mongoose.Schema({
    sizes: [{ type: String }],          // e.g. ['S', 'M', 'L', 'XL']
    colors: [{ type: String }],         // e.g. ['Red', 'Blue', 'Black']
    variants: { type: [String], default: ['Regular Fit', 'Oversized'] },  // e.g. ['Regular Fit', 'Oversized']
    price: { type: Number, required: true, min: 0 },  // Price per unit
    stockQuantity: { type: Number, required: true, min: 0 },
    purchaseLimitPerUser: { type: Number, default: 1 },
}, { _id: false });

const eventSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: { type: String, enum: ['normal', 'merchandise'], required: true },
    eligibility: { type: String, enum: ['all', 'iiit-only', 'non-iiit-only'], default: 'all' },
    registrationDeadline: { type: Date, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    registrationLimit: { type: Number, default: null },
    registrationFee: { type: Number, default: 0 },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizer', required: true },
    tags: [{ type: String }],
    status: { type: String, enum: ['draft', 'published', 'ongoing', 'completed', 'closed'], default: 'draft' },

    // Normal event: custom form fields
    customForm: [formFieldSchema],
    formLocked: { type: Boolean, default: false },

    // Merchandise event: item details
    merchandiseDetails: merchandiseDetailSchema,

    // Tracking
    registrationCount: { type: Number, default: 0 },
}, { timestamps: true });

// Index for search
eventSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Event', eventSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['participant', 'organizer', 'admin'], required: true },
    participantType: { type: String, enum: ['iiit', 'non-iiit'], required: function () { return this.role === 'participant'; } },
    college: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    interests: [{ type: String }],
    followedOrganizers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organizer' }],
    onboardingCompleted: { type: Boolean, default: false },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

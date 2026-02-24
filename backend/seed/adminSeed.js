const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            // Update existing admin with new credentials from .env
            existingAdmin.email = process.env.ADMIN_EMAIL;
            existingAdmin.password = process.env.ADMIN_PASSWORD; // Will be re-hashed by pre-save hook
            existingAdmin.isModified('password'); // Ensure password gets re-hashed
            await existingAdmin.save();
            console.log('Admin updated successfully:', existingAdmin.email);
            process.exit(0);
        }

        // Create admin user
        const admin = await User.create({
            firstName: 'System',
            lastName: 'Admin',
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,  // Will be hashed by pre-save hook
            role: 'admin',
        });

        console.log('Admin created successfully:', admin.email);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error.message);
        process.exit(1);
    }
};

seedAdmin();

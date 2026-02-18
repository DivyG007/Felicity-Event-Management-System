const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register - Participant registration
router.post('/register', authController.register);

// POST /api/auth/login - All roles login
router.post('/login', authController.login);

// POST /api/auth/logout - Logout
router.post('/logout', authController.logout);

// GET /api/auth/me - Get current user
router.get('/me', require('../middleware/auth'), authController.getMe);

module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const userController = require('../controllers/userController');

// GET /api/users/profile - Get own profile
router.get('/profile', auth, userController.getProfile);

// PUT /api/users/profile - Update own profile
router.put('/profile', auth, userController.updateProfile);

// PUT /api/users/onboarding - Complete onboarding preferences
router.put('/onboarding', auth, authorize('participant'), userController.completeOnboarding);

// PUT /api/users/password - Change password
router.put('/password', auth, userController.changePassword);

module.exports = router;

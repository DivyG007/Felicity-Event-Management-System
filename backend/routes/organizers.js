const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const organizerController = require('../controllers/organizerController');

// GET /api/organizers - List all organizers (public for participants)
router.get('/', auth, organizerController.getAllOrganizers);

// PUT /api/organizers/profile - Update organizer profile (MUST be before /:id)
router.put('/profile', auth, authorize('organizer'), organizerController.updateProfile);

// POST /api/organizers/test-webhook - Send test webhook message
router.post('/test-webhook', auth, authorize('organizer'), organizerController.testWebhook);

// POST /api/organizers/follow/:id - Follow organizer
router.post('/follow/:id', auth, authorize('participant'), organizerController.followOrganizer);

// DELETE /api/organizers/follow/:id - Unfollow organizer
router.delete('/follow/:id', auth, authorize('participant'), organizerController.unfollowOrganizer);

// POST /api/organizers/password-reset-request - Request password reset (Tier B)
router.post('/password-reset-request', auth, authorize('organizer'), organizerController.requestPasswordReset);

// GET /api/organizers/password-reset-status - Get latest reset request status
router.get('/password-reset-status', auth, authorize('organizer'), organizerController.getPasswordResetStatus);

// POST /api/organizers/password-reset-complete - Complete one-time password reset after admin approval
router.post('/password-reset-complete', auth, authorize('organizer'), organizerController.completeApprovedPasswordReset);

// GET /api/organizers/:id - Get organizer detail (MUST be last due to param catch-all)
router.get('/:id', auth, organizerController.getOrganizerById);

module.exports = router;

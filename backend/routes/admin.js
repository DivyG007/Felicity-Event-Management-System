const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const adminController = require('../controllers/adminController');

// POST /api/admin/organizers - Create new organizer account
router.post('/organizers', auth, authorize('admin'), adminController.createOrganizer);

// GET /api/admin/organizers - List all organizers
router.get('/organizers', auth, authorize('admin'), adminController.listOrganizers);

// DELETE /api/admin/organizers/:id - Remove/disable organizer
router.delete('/organizers/:id', auth, authorize('admin'), adminController.removeOrganizer);

// GET /api/admin/password-reset-requests - View all password reset requests (Tier B)
router.get('/password-reset-requests', auth, authorize('admin'), adminController.getPasswordResetRequests);

// PUT /api/admin/password-reset-requests/:id - Approve/reject password reset (Tier B)
router.put('/password-reset-requests/:id', auth, authorize('admin'), adminController.handlePasswordResetRequest);

module.exports = router;

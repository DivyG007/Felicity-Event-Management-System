const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const registrationController = require('../controllers/registrationController');

// POST /api/registrations - Register for an event
router.post('/', auth, authorize('participant'), registrationController.register);

// GET /api/registrations/my - Get participant's registrations
router.get('/my', auth, authorize('participant'), registrationController.getMyRegistrations);

// GET /api/registrations/:id/ticket - Get ticket details
router.get('/:id/ticket', auth, registrationController.getTicket);

// POST /api/registrations/:id/payment-proof - Upload payment proof (Tier A)
router.post('/:id/payment-proof', auth, authorize('participant'), registrationController.uploadPaymentProof);

// PUT /api/registrations/:id/payment-status - Approve/reject payment (Tier A, organizer)
router.put('/:id/payment-status', auth, authorize('organizer'), registrationController.updatePaymentStatus);

// POST /api/registrations/:id/attendance - Mark attendance via QR scan (Tier A, organizer)
router.post('/:id/attendance', auth, authorize('organizer'), registrationController.markAttendance);

// GET /api/registrations/event/:eventId/attendance - Attendance report (Tier A, organizer)
router.get('/event/:eventId/attendance', auth, authorize('organizer'), registrationController.getAttendanceReport);

module.exports = router;

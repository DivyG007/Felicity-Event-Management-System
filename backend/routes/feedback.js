const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const feedbackController = require('../controllers/feedbackController');

// POST /api/feedback - Submit feedback for a completed event
router.post('/', auth, authorize('participant'), feedbackController.submitFeedback);

// GET /api/feedback/event/:eventId - Get feedback for an event (organizer)
router.get('/event/:eventId', auth, feedbackController.getEventFeedback);

module.exports = router;

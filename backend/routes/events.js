const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const eventController = require('../controllers/eventController');

// GET /api/events - Browse/search events (participants)
router.get('/', auth, eventController.getEvents);

// GET /api/events/trending - Top 5 trending events (24h)
router.get('/trending', auth, eventController.getTrendingEvents);

// GET /api/events/:id - Event details
router.get('/:id', auth, eventController.getEventById);

// POST /api/events - Create event (organizer only)
router.post('/', auth, authorize('organizer'), eventController.createEvent);

// PUT /api/events/:id - Update event (organizer only)
router.put('/:id', auth, authorize('organizer'), eventController.updateEvent);

// PUT /api/events/:id/status - Change event status (organizer only)
router.put('/:id/status', auth, authorize('organizer'), eventController.changeStatus);

// GET /api/events/:id/participants - Get participant list (organizer only)
router.get('/:id/participants', auth, authorize('organizer'), eventController.getParticipants);

// GET /api/events/:id/analytics - Event analytics (organizer only)
router.get('/:id/analytics', auth, authorize('organizer'), eventController.getAnalytics);

module.exports = router;

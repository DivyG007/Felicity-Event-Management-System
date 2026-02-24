# Event Display Troubleshooting

## Quick Diagnostic Tests

### Browser Console Tests:
```javascript
const token = localStorage.getItem('token');

// Test organizer events
fetch('http://localhost:5000/api/events?organizerOnly=true', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log('Events:', d))

// Test participant registrations  
fetch('http://localhost:5000/api/registrations/my', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log('Registrations:', d))
```

### MongoDB Checks:
```javascript
db.events.find({}).pretty()           // All events
db.organizers.find({}).pretty()       // All organizers  
db.registrations.find({}).pretty()   // All registrations
```

## Common Issues

**Issue:** Events not showing in organizer dashboard
- Check if organizer profile exists: `db.organizers.findOne({ userId: ObjectId("user-id") })`
- Verify event has organizerId: `db.events.findOne({ _id: ObjectId("event-id") })`

**Issue:** Registrations not showing in participant dashboard
- Check event status: must be 'published', 'ongoing', or 'completed'
- Verify registration has eventId populated

**Solution:** Check Network tab in DevTools:
1. Create event → POST /api/events → Response should contain _id and organizerId
2. Fetch events → GET /api/events?organizerOnly=true → Response should be { events: [...] }

---

## Test Organizer Credentials
Email: hack@felicity.iiit.ac.in
Password: ad611051d214


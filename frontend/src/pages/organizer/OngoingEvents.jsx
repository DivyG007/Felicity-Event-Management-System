import { useState, useEffect } from 'react';
import { getEvents } from '../../api/eventApi';
import { Link } from 'react-router-dom';

export default function OngoingEvents() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getEvents({ organizerOnly: true, status: 'ongoing' })
            .then(res => setEvents(res.data?.events || res.data || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <div className="page-header"><h1>Ongoing Events 🔴</h1><p>Currently active events</p></div>
            {loading ? (
                <div className="empty-state"><div className="spinner"></div></div>
            ) : events.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">🎭</div><p>No ongoing events</p></div>
            ) : (
                <div className="grid-2">
                    {events.map(event => (
                        <Link key={event._id} to={`/organizer/events/${event._id}`}>
                            <div className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1rem' }}>{event.name}</h3>
                                    <span className="badge badge-ongoing">ongoing</span>
                                </div>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{event.registrationCount || 0} registrations</p>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Ends: {new Date(event.endDate).toLocaleString()}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

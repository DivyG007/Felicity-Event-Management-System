import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getEvents, getEventAnalytics } from '../../api/eventApi';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState({ totalRegs: 0, totalRevenue: 0, totalEvents: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getEvents({ organizerOnly: true })
            .then(res => {
                const evts = res.data?.events || res.data || [];
                setEvents(evts);
                const totalRegs = evts.reduce((sum, e) => sum + (e.registrationCount || 0), 0);
                const totalRevenue = evts.reduce((sum, e) => sum + ((e.registrationCount || 0) * (e.registrationFee || 0)), 0);
                setStats({ totalRegs, totalRevenue, totalEvents: evts.length });
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <div className="page-header"><h1>Organizer Dashboard 📊</h1><p>Manage your events</p></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="stat-card"><div className="stat-value">{stats.totalEvents}</div><div className="stat-label">Total Events</div></div>
                <div className="stat-card"><div className="stat-value">{stats.totalRegs}</div><div className="stat-label">Total Registrations</div></div>
                <div className="stat-card"><div className="stat-value">₹{stats.totalRevenue}</div><div className="stat-label">Total Revenue</div></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem' }}>Your Events</h2>
                <Link to="/organizer/create-event" className="btn btn-primary">+ Create Event</Link>
            </div>
            {loading ? (
                <div className="empty-state"><div className="spinner"></div></div>
            ) : events.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">🎭</div><p>No events yet. Create your first event!</p></div>
            ) : (
                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {events.map(event => (
                        <Link key={event._id} to={`/organizer/events/${event._id}`} style={{ minWidth: '280px' }}>
                            <div className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span className={`badge badge-${event.status}`}>{event.status}</span>
                                    <span className="badge" style={{ background: 'rgba(102,126,234,0.15)', color: '#667eea' }}>{event.type}</span>
                                </div>
                                <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>{event.name}</h3>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{event.registrationCount || 0} registrations</p>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>📅 {new Date(event.startDate).toLocaleDateString()}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

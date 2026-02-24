import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getEvents, getEventAnalytics } from '../../api/eventApi';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState({
        totalRegs: 0,
        totalRevenue: 0,
        totalEvents: 0,
        registrationRevenue: 0,
        merchandiseRevenue: 0,
        merchandiseUnits: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getEvents({ organizerOnly: true })
            .then(async (res) => {
                const evts = res.data?.events || res.data || [];
                setEvents(evts);
                const totalRegs = evts.reduce((sum, e) => sum + (e.registrationCount || 0), 0);

                const analyticsResults = await Promise.all(
                    evts.map((event) => getEventAnalytics(event._id).catch(() => ({ data: null })))
                );

                const registrationRevenue = analyticsResults.reduce(
                    (sum, result) => sum + (result?.data?.revenue || 0),
                    0
                );
                const merchandiseRevenue = analyticsResults.reduce(
                    (sum, result) => sum + (result?.data?.merchandiseRevenue || 0),
                    0
                );
                const merchandiseUnits = analyticsResults.reduce(
                    (sum, result) => sum + (result?.data?.merchandiseUnits || 0),
                    0
                );
                const totalRevenue = registrationRevenue + merchandiseRevenue;

                setStats({
                    totalRegs,
                    totalRevenue,
                    totalEvents: evts.length,
                    registrationRevenue,
                    merchandiseRevenue,
                    merchandiseUnits,
                });
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <div className="page-header"><h1>Organizer Dashboard 📊</h1><p>Manage your events</p></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div className="stat-card"><div className="stat-value">{stats.totalEvents}</div><div className="stat-label">Total Events</div></div>
                <div className="stat-card"><div className="stat-value">{stats.totalRegs}</div><div className="stat-label">Total Registrations</div></div>
                <div className="stat-card"><div className="stat-value">₹{stats.totalRevenue}</div><div className="stat-label">Total Revenue</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="stat-card"><div className="stat-value">₹{stats.registrationRevenue}</div><div className="stat-label">Registration Revenue</div></div>
                <div className="stat-card"><div className="stat-value">₹{stats.merchandiseRevenue}</div><div className="stat-label">Merchandise Revenue</div></div>
                <div className="stat-card"><div className="stat-value">{stats.merchandiseUnits}</div><div className="stat-label">Units Sold</div></div>
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

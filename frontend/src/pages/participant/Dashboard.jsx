import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getMyRegistrations } from '../../api/registrationApi';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { user } = useAuth();
    const [registrations, setRegistrations] = useState([]);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMyRegistrations()
            .then(res => setRegistrations(res.data || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const now = new Date();
    const upcoming = registrations.filter(r => r.eventId && new Date(r.eventId.startDate) > now && r.status !== 'cancelled');
    const normal = registrations.filter(r => r.eventId?.type === 'normal');
    const merchandise = registrations.filter(r => r.eventId?.type === 'merchandise');
    const completed = registrations.filter(r => r.eventId && new Date(r.eventId.endDate) < now);
    const cancelled = registrations.filter(r => r.status === 'cancelled' || r.status === 'rejected');

    const tabData = { upcoming, normal, merchandise, completed, cancelled };
    const currentList = tabData[activeTab] || [];

    return (
        <div>
            <div className="page-header">
                <h1>Welcome, {user?.firstName || 'Participant'}! 👋</h1>
                <p>Your events dashboard</p>
            </div>

            <div className="tabs">
                {['upcoming', 'normal', 'merchandise', 'completed', 'cancelled'].map(tab => (
                    <button
                        key={tab}
                        className={`tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="empty-state"><div className="spinner"></div></div>
            ) : currentList.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <p>No events in this category</p>
                    <Link to="/participant/events" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                        Browse Events
                    </Link>
                </div>
            ) : (
                <div className="grid-2">
                    {currentList.map(reg => (
                        <div key={reg._id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{reg.eventId?.name || 'Event'}</h3>
                                <span className={`badge badge-${reg.eventId?.status || 'draft'}`}>
                                    {reg.eventId?.type || 'event'}
                                </span>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                                {reg.eventId?.organizerId?.name || 'Organizer'}
                            </p>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                                📅 {reg.eventId?.startDate ? new Date(reg.eventId.startDate).toLocaleDateString() : 'TBD'}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>🎫 {reg.ticketId}</span>
                                <span className={`badge ${reg.status === 'registered' ? 'badge-published' : reg.status === 'attended' ? 'badge-completed' : 'badge-closed'}`}>
                                    {reg.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

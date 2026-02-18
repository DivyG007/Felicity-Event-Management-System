import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrganizerById } from '../../api/organizerApi';

export default function OrganizerDetail() {
    const { id } = useParams();
    const [org, setOrg] = useState(null);
    const [events, setEvents] = useState([]);
    const [tab, setTab] = useState('upcoming');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getOrganizerById(id).then(res => {
            setOrg(res.data?.organizer || res.data);
            setEvents(res.data?.events || []);
        }).catch(() => { }).finally(() => setLoading(false));
    }, [id]);

    const now = new Date();
    const upcoming = events.filter(e => new Date(e.startDate) > now);
    const past = events.filter(e => new Date(e.endDate) < now);

    if (loading) return <div className="empty-state"><div className="spinner"></div></div>;
    if (!org) return <div className="empty-state"><p>Organizer not found</p></div>;

    return (
        <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{org.name}</h1>
                <span className="badge" style={{ background: 'rgba(102,126,234,0.15)', color: '#667eea' }}>{org.category}</span>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '1rem' }}>{org.description}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem', fontSize: '0.85rem' }}>📧 {org.contactEmail}</p>
            </div>
            <div className="tabs">
                <button className={`tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>Upcoming ({upcoming.length})</button>
                <button className={`tab ${tab === 'past' ? 'active' : ''}`} onClick={() => setTab('past')}>Past ({past.length})</button>
            </div>
            <div className="grid-3">
                {(tab === 'upcoming' ? upcoming : past).map(event => (
                    <Link key={event._id} to={`/participant/events/${event._id}`}>
                        <div className="card">
                            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>{event.name}</h3>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>📅 {new Date(event.startDate).toLocaleDateString()}</p>
                        </div>
                    </Link>
                ))}
                {((tab === 'upcoming' ? upcoming : past).length === 0) && <div className="empty-state"><p>No {tab} events</p></div>}
            </div>
        </div>
    );
}

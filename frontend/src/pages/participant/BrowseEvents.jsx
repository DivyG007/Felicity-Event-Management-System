import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getEvents, getTrendingEvents } from '../../api/eventApi';
import { Link } from 'react-router-dom';

export default function BrowseEvents() {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [trending, setTrending] = useState([]);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ type: '', eligibility: '', dateFrom: '', dateTo: '', followedOnly: false });
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const params = { search };
            if (filters.type) params.type = filters.type;
            if (filters.eligibility) params.eligibility = filters.eligibility;
            if (filters.dateFrom) params.dateFrom = filters.dateFrom;
            if (filters.dateTo) params.dateTo = filters.dateTo;
            if (filters.followedOnly) params.followedOnly = true;

            const res = await getEvents(params);
            setEvents(res.data?.events || res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEvents(); }, [search, filters]);

    useEffect(() => {
        getTrendingEvents()
            .then(res => setTrending(res.data || []))
            .catch(() => { });
    }, []);

    return (
        <div>
            <div className="page-header">
                <h1>Browse Events 🔍</h1>
                <p>Discover and register for exciting events</p>
            </div>

            {trending.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'rgba(255,255,255,0.8)' }}>🔥 Trending Now</h3>
                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {trending.map(event => (
                            <Link key={event._id} to={`/participant/events/${event._id}`} style={{ minWidth: '220px' }}>
                                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.15), rgba(118,75,162,0.15))' }}>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>{event.name}</h4>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{event.registrationCount || 0} registrations</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <input
                    className="search-bar"
                    style={{ flex: 2, minWidth: '250px' }}
                    placeholder="Search events or organizers..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <select
                    className="search-bar"
                    style={{ flex: 1, minWidth: '140px', cursor: 'pointer' }}
                    value={filters.type}
                    onChange={e => setFilters({ ...filters, type: e.target.value })}
                >
                    <option value="">All Types</option>
                    <option value="normal">Normal</option>
                    <option value="merchandise">Merchandise</option>
                </select>
                <select
                    className="search-bar"
                    style={{ flex: 1, minWidth: '140px', cursor: 'pointer' }}
                    value={filters.eligibility}
                    onChange={e => setFilters({ ...filters, eligibility: e.target.value })}
                >
                    <option value="">All Eligibility</option>
                    <option value="all">Open to All</option>
                    <option value="iiit-only">IIIT Only</option>
                </select>
                <button
                    className={`btn ${filters.followedOnly ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilters({ ...filters, followedOnly: !filters.followedOnly })}
                >
                    {filters.followedOnly ? '★ Followed' : '☆ Followed'}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <input
                    type="date"
                    className="search-bar"
                    style={{ flex: 1 }}
                    value={filters.dateFrom}
                    onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
                    placeholder="From"
                />
                <input
                    type="date"
                    className="search-bar"
                    style={{ flex: 1 }}
                    value={filters.dateTo}
                    onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
                    placeholder="To"
                />
            </div>

            {loading ? (
                <div className="empty-state"><div className="spinner"></div></div>
            ) : events.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🎭</div>
                    <p>No events found</p>
                </div>
            ) : (
                <div className="grid-3">
                    {events.map(event => (
                        <Link key={event._id} to={`/participant/events/${event._id}`}>
                            <div className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span className={`badge badge-${event.status}`}>{event.status}</span>
                                    <span className="badge" style={{ background: 'rgba(102,126,234,0.15)', color: '#667eea' }}>
                                        {event.type}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{event.name}</h3>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {event.description}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                                    <span>📅 {new Date(event.startDate).toLocaleDateString()}</span>
                                    <span>₹{event.registrationFee || 'Free'}</span>
                                </div>
                                {event.tags?.length > 0 && (
                                    <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                        {event.tags.slice(0, 3).map(tag => (
                                            <span key={tag} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

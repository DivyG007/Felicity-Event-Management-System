import { useState, useEffect } from 'react';
import { getAllOrganizers } from '../../api/organizerApi';
import { followOrganizer, unfollowOrganizer } from '../../api/organizerApi';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

export default function Organizers() {
    const { user, updateUser } = useAuth();
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllOrganizers().then(res => setOrganizers(res.data || [])).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const isFollowing = (orgId) => (user?.followedOrganizers || []).includes(orgId);

    const handleToggleFollow = async (orgId) => {
        try {
            if (isFollowing(orgId)) {
                await unfollowOrganizer(orgId);
                updateUser({ followedOrganizers: user.followedOrganizers.filter(id => id !== orgId) });
            } else {
                await followOrganizer(orgId);
                updateUser({ followedOrganizers: [...(user?.followedOrganizers || []), orgId] });
            }
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="empty-state"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header"><h1>Clubs & Organizers 🏛️</h1><p>Discover and follow clubs</p></div>
            {organizers.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">🏛️</div><p>No organizers yet</p></div>
            ) : (
                <div className="grid-3">
                    {organizers.map(org => (
                        <div key={org._id} className="card">
                            <Link to={`/participant/organizers/${org._id}`}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{org.name}</h3>
                                <span className="badge" style={{ background: 'rgba(102,126,234,0.15)', color: '#667eea', marginBottom: '0.5rem', display: 'inline-block' }}>{org.category}</span>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{org.description || 'No description'}</p>
                            </Link>
                            <button onClick={() => handleToggleFollow(org._id)} className={`btn ${isFollowing(org._id) ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%' }}>
                                {isFollowing(org._id) ? '✓ Following' : '+ Follow'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

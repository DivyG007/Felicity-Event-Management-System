import { useState, useEffect } from 'react';
import { listOrganizers, createOrganizer, removeOrganizer } from '../../api/adminApi';

export default function Dashboard() {
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        listOrganizers().then(res => setOrganizers(res.data || [])).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const activeCount = organizers.filter(o => o.active).length;
    const totalEvents = organizers.reduce((sum, o) => sum + (o.eventCount || 0), 0);

    return (
        <div>
            <div className="page-header"><h1>Admin Dashboard 🛡️</h1><p>System overview</p></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="stat-card"><div className="stat-value">{organizers.length}</div><div className="stat-label">Total Clubs</div></div>
                <div className="stat-card"><div className="stat-value">{activeCount}</div><div className="stat-label">Active Clubs</div></div>
                <div className="stat-card"><div className="stat-value">{totalEvents}</div><div className="stat-label">Total Events</div></div>
            </div>
            {loading ? <div className="empty-state"><div className="spinner"></div></div> : (
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Recent Clubs</h3>
                    <table className="data-table">
                        <thead><tr><th>Name</th><th>Category</th><th>Status</th><th>Events</th></tr></thead>
                        <tbody>
                            {organizers.slice(0, 10).map(o => (
                                <tr key={o._id}>
                                    <td>{o.name}</td>
                                    <td>{o.category}</td>
                                    <td><span className={`badge ${o.active ? 'badge-published' : 'badge-closed'}`}>{o.active ? 'Active' : 'Disabled'}</span></td>
                                    <td>{o.eventCount || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

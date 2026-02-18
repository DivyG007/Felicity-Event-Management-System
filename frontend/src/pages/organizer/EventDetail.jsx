import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById, updateEvent, changeEventStatus, getEventParticipants, getEventAnalytics } from '../../api/eventApi';

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [activeTab, setActiveTab] = useState('details');
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        Promise.all([
            getEventById(id),
            getEventParticipants(id).catch(() => ({ data: [] })),
            getEventAnalytics(id).catch(() => ({ data: null })),
        ]).then(([eventRes, partRes, analyticsRes]) => {
            setEvent(eventRes.data);
            setEditForm(eventRes.data);
            setParticipants(partRes.data || []);
            setAnalytics(analyticsRes.data);
        }).finally(() => setLoading(false));
    }, [id]);

    const handleStatusChange = async (newStatus) => {
        try {
            await changeEventStatus(id, { status: newStatus });
            setEvent(prev => ({ ...prev, status: newStatus }));
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const handleSaveEdit = async () => {
        try {
            await updateEvent(id, editForm);
            setEvent(editForm);
            setEditing(false);
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const downloadCSV = () => {
        const headers = ['Name', 'Email', 'Ticket ID', 'Status', 'Registered At'];
        const rows = participants.map(p => [
            `${p.userId?.firstName || ''} ${p.userId?.lastName || ''}`, p.userId?.email || '', p.ticketId, p.status, new Date(p.createdAt).toLocaleString()
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${event?.name || 'event'}_participants.csv`; a.click();
    };

    if (loading) return <div className="empty-state"><div className="spinner"></div></div>;
    if (!event) return <div className="empty-state"><p>Event not found</p></div>;

    const statusFlow = { draft: ['published'], published: ['ongoing', 'closed'], ongoing: ['completed', 'closed'] };
    const canEdit = event.status === 'draft' || (event.status !== 'completed' && event.status !== 'closed');

    return (
        <div>
            <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '1rem' }}>← Back</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div><h1 style={{ fontSize: '1.5rem' }}>{event.name}</h1><span className={`badge badge-${event.status}`}>{event.status}</span></div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(statusFlow[event.status] || []).map(s => (
                        <button key={s} className="btn btn-primary" onClick={() => handleStatusChange(s)}>{s === 'published' ? 'Publish' : s === 'ongoing' ? 'Start' : s === 'completed' ? 'Complete' : 'Close'}</button>
                    ))}
                    {canEdit && <button className="btn btn-secondary" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</button>}
                </div>
            </div>

            <div className="tabs">
                {['details', 'participants', 'analytics'].map(tab => (
                    <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
                ))}
            </div>

            {activeTab === 'details' && (
                editing ? (
                    <div className="card">
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}><label>Name</label><input className="search-bar" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}><label>Description</label><textarea className="search-bar" style={{ minHeight: '80px' }} value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div className="form-group" style={{ flex: 1 }}><label>Start</label><input type="datetime-local" className="search-bar" value={editForm.startDate?.slice(0, 16) || ''} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} /></div>
                            <div className="form-group" style={{ flex: 1 }}><label>End</label><input type="datetime-local" className="search-bar" value={editForm.endDate?.slice(0, 16) || ''} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} /></div>
                        </div>
                        <button className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
                    </div>
                ) : (
                    <div className="card">
                        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>{event.description}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            <div className="stat-card"><div className="stat-label">Start</div><div style={{ color: '#fff' }}>{new Date(event.startDate).toLocaleString()}</div></div>
                            <div className="stat-card"><div className="stat-label">End</div><div style={{ color: '#fff' }}>{new Date(event.endDate).toLocaleString()}</div></div>
                            <div className="stat-card"><div className="stat-label">Fee</div><div style={{ color: '#fff' }}>₹{event.registrationFee || 'Free'}</div></div>
                            <div className="stat-card"><div className="stat-label">Registrations</div><div style={{ color: '#fff' }}>{event.registrationCount || 0}{event.registrationLimit ? ` / ${event.registrationLimit}` : ''}</div></div>
                            <div className="stat-card"><div className="stat-label">Type</div><div style={{ color: '#fff' }}>{event.type}</div></div>
                            <div className="stat-card"><div className="stat-label">Eligibility</div><div style={{ color: '#fff' }}>{event.eligibility}</div></div>
                        </div>
                    </div>
                )
            )}

            {activeTab === 'participants' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3>Participants ({participants.length})</h3>
                        <button className="btn btn-secondary" onClick={downloadCSV}>📥 Export CSV</button>
                    </div>
                    {participants.length === 0 ? <p style={{ color: 'rgba(255,255,255,0.5)' }}>No participants yet</p> : (
                        <table className="data-table">
                            <thead><tr><th>Name</th><th>Email</th><th>Ticket ID</th><th>Status</th><th>Date</th></tr></thead>
                            <tbody>
                                {participants.map(p => (
                                    <tr key={p._id}>
                                        <td>{p.userId?.firstName} {p.userId?.lastName}</td>
                                        <td>{p.userId?.email}</td>
                                        <td>{p.ticketId}</td>
                                        <td><span className={`badge badge-${p.status === 'registered' ? 'published' : p.status === 'attended' ? 'completed' : 'closed'}`}>{p.status}</span></td>
                                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {activeTab === 'analytics' && (
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Analytics</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        <div className="stat-card"><div className="stat-value">{analytics?.totalRegistrations || 0}</div><div className="stat-label">Total Registrations</div></div>
                        <div className="stat-card"><div className="stat-value">{analytics?.attended || 0}</div><div className="stat-label">Attended</div></div>
                        <div className="stat-card"><div className="stat-value">₹{analytics?.revenue || 0}</div><div className="stat-label">Revenue</div></div>
                        <div className="stat-card"><div className="stat-value">{analytics?.averageRating?.toFixed(1) || 'N/A'}</div><div className="stat-label">Avg Rating</div></div>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from 'react';
import { getPasswordResetRequests, handlePasswordResetRequest } from '../../api/adminApi';

export default function PasswordResets() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = () => {
        setLoading(true);
        getPasswordResetRequests().then(res => setRequests(res.data || [])).catch(() => { }).finally(() => setLoading(false));
    };

    useEffect(fetchRequests, []);

    const handleAction = async (id, action) => {
        try { await handlePasswordResetRequest(id, { action }); fetchRequests(); }
        catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    return (
        <div>
            <div className="page-header"><h1>Password Reset Requests 🔑</h1></div>
            {loading ? <div className="empty-state"><div className="spinner"></div></div> : requests.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">🔑</div><p>No pending requests</p></div>
            ) : (
                <div className="card">
                    <table className="data-table">
                        <thead><tr><th>Organizer</th><th>Email</th><th>Reason</th><th>Requested</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req._id}>
                                    <td style={{ fontWeight: 600 }}>{req.organizerId?.name || 'Unknown'}</td>
                                    <td>{req.userId?.email}</td>
                                    <td>{req.reason || '—'}</td>
                                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                                    <td><span className={`badge ${req.status === 'pending' ? 'badge-ongoing' : req.status === 'approved' ? 'badge-published' : req.status === 'completed' ? 'badge-completed' : 'badge-closed'}`}>{req.status}</span></td>
                                    <td>
                                        {req.status === 'pending' && (
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button className="btn btn-success" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => handleAction(req._id, 'approve')}>Approve</button>
                                                <button className="btn btn-danger" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => handleAction(req._id, 'reject')}>Reject</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

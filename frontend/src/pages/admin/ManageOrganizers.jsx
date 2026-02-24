import { useState, useEffect } from 'react';
import { listOrganizers, createOrganizer, manageOrganizerAction } from '../../api/adminApi';

export default function ManageOrganizers() {
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', category: '', contactEmail: '', description: '' });
    const [creating, setCreating] = useState(false);
    const [createdCreds, setCreatedCreds] = useState(null);
    const [message, setMessage] = useState('');

    const fetchOrgs = () => {
        setLoading(true);
        listOrganizers().then(res => setOrganizers(res.data || [])).catch(() => { }).finally(() => setLoading(false));
    };

    useEffect(fetchOrgs, []);

    const handleCreate = async () => {
        setCreating(true); setMessage('');
        try {
            const res = await createOrganizer(form);
            setCreatedCreds(res.data);
            setForm({ name: '', category: '', contactEmail: '', description: '' });
            fetchOrgs();
        } catch (err) { setMessage(err.response?.data?.message || 'Failed'); }
        finally { setCreating(false); }
    };

    const handleAction = async (id, action) => {
        const confirmations = {
            disable: 'Disable this organizer account? They will not be able to log in.',
            enable: 'Enable this organizer account?',
            archive: 'Archive this organizer? Archived organizers cannot log in until unarchived.',
            unarchive: 'Unarchive and enable this organizer?',
            delete: 'Permanently delete this organizer and all associated events/registrations/feedback? This cannot be undone.',
        };

        if (!confirm(confirmations[action] || 'Proceed?')) return;
        try {
            await manageOrganizerAction(id, action);
            fetchOrgs();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed');
        }
    };

    return (
        <div>
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><h1>Manage Clubs/Organizers 🏛️</h1><p>Add, remove, or disable organizers</p></div>
                    <button className="btn btn-primary" onClick={() => { setShowCreate(!showCreate); setCreatedCreds(null); }}>
                        {showCreate ? 'Cancel' : '+ Add New'}
                    </button>
                </div>
            </div>

            {showCreate && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Create New Organizer</h3>
                    {message && <div className="auth-error" style={{ marginBottom: '0.75rem' }}>{message}</div>}
                    {createdCreds && (
                        <div style={{ background: 'rgba(46,213,115,0.1)', border: '1px solid rgba(46,213,115,0.3)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                            <p style={{ fontWeight: 600, color: '#2ed573', marginBottom: '0.5rem' }}>✓ Organizer Created!</p>
                            <p style={{ fontSize: '0.85rem' }}>Email: <strong>{createdCreds.email}</strong></p>
                            <p style={{ fontSize: '0.85rem' }}>Password: <strong>{createdCreds.password}</strong></p>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Share these credentials with the organizer securely.</p>
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group"><label>Name *</label><input className="search-bar" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                        <div className="form-group"><label>Category</label><input className="search-bar" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g., Cultural, Technical" /></div>
                        <div className="form-group"><label>Contact Email</label><input type="email" className="search-bar" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} /></div>
                        <div className="form-group"><label>Description</label><input className="search-bar" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                    </div>
                    <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleCreate} disabled={creating || !form.name}>
                        {creating ? 'Creating...' : 'Create Organizer'}
                    </button>
                </div>
            )}

            {loading ? <div className="empty-state"><div className="spinner"></div></div> : (
                <div className="card">
                    <table className="data-table">
                        <thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {organizers.map(o => (
                                <tr key={o._id}>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{o._id}</td>
                                    <td style={{ fontWeight: 600 }}>{o.name}</td>
                                    <td>{o.category}</td>
                                    <td>{o.userId?.email || o.contactEmail}</td>
                                    <td>
                                        <span className={`badge ${o.archived ? 'badge-completed' : o.active ? 'badge-published' : 'badge-closed'}`}>
                                            {o.archived ? 'Archived' : o.active ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                            {!o.archived && (
                                                <button className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.55rem' }} onClick={() => handleAction(o._id, o.active ? 'disable' : 'enable')}>
                                                    {o.active ? 'Disable' : 'Enable'}
                                                </button>
                                            )}
                                            <button className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.55rem' }} onClick={() => handleAction(o._id, o.archived ? 'unarchive' : 'archive')}>
                                                {o.archived ? 'Unarchive' : 'Archive'}
                                            </button>
                                            <button className="btn btn-danger" style={{ fontSize: '0.72rem', padding: '0.3rem 0.55rem' }} onClick={() => handleAction(o._id, 'delete')}>
                                                Delete
                                            </button>
                                        </div>
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

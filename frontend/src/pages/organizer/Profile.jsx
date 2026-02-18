import { useState, useEffect } from 'react';
import { getOrganizerById, updateOrganizerProfile } from '../../api/organizerApi';
import { useAuth } from '../../hooks/useAuth';
import { changePassword } from '../../api/userApi';

export default function Profile() {
    const { user } = useAuth();
    const [org, setOrg] = useState(null);
    const [form, setForm] = useState({ name: '', category: '', description: '', contactEmail: '', contactNumber: '', discordWebhook: '' });
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [pwMessage, setPwMessage] = useState('');

    useEffect(() => {
        getOrganizerById('me').then(res => {
            const o = res.data?.organizer || res.data;
            setOrg(o);
            setForm({ name: o.name || '', category: o.category || '', description: o.description || '', contactEmail: o.contactEmail || '', contactNumber: o.contactNumber || '', discordWebhook: o.discordWebhook || '' });
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try { await updateOrganizerProfile(form); setMessage('Profile updated!'); setTimeout(() => setMessage(''), 3000); }
        catch (err) { setMessage(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const handlePasswordChange = async () => {
        if (pwForm.newPassword !== pwForm.confirmPassword) { setPwMessage('Passwords do not match'); return; }
        try { await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }); setPwMessage('Password changed!'); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }
        catch (err) { setPwMessage(err.response?.data?.message || 'Failed'); }
    };

    if (loading) return <div className="empty-state"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header"><h1>Organizer Profile 👤</h1></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Organization Info</h3>
                    {message && <div style={{ color: message.includes('!') ? '#2ed573' : '#ff6b7a', marginBottom: '0.5rem', fontSize: '0.85rem' }}>{message}</div>}
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}><label>Login Email (non-editable)</label><input className="search-bar" value={user?.email || ''} disabled /></div>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}><label>Name</label><input className="search-bar" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}><label>Category</label><input className="search-bar" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}><label>Description</label><textarea className="search-bar" style={{ minHeight: '80px' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}><label>Contact Email</label><input className="search-bar" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} /></div>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}><label>Contact Number</label><input className="search-bar" value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })} /></div>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card">
                        <h3 style={{ marginBottom: '0.75rem' }}>Discord Webhook</h3>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>New events auto-post to Discord</p>
                        <div className="form-group"><label>Webhook URL</label><input className="search-bar" value={form.discordWebhook} onChange={e => setForm({ ...form, discordWebhook: e.target.value })} placeholder="https://discord.com/api/webhooks/..." /></div>
                    </div>
                    <div className="card">
                        <h3 style={{ marginBottom: '0.75rem' }}>Change Password</h3>
                        {pwMessage && <div style={{ color: pwMessage.includes('!') ? '#2ed573' : '#ff6b7a', marginBottom: '0.5rem', fontSize: '0.85rem' }}>{pwMessage}</div>}
                        <div className="form-group" style={{ marginBottom: '0.5rem' }}><label>Current Password</label><input type="password" className="search-bar" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: '0.5rem' }}><label>New Password</label><input type="password" className="search-bar" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}><label>Confirm</label><input type="password" className="search-bar" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} /></div>
                        <button className="btn btn-secondary" onClick={handlePasswordChange}>Change Password</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

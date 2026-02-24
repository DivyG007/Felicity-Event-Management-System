import { useState, useEffect } from 'react';
import {
    getOrganizerById,
    updateOrganizerProfile,
    requestPasswordReset,
    getPasswordResetStatus,
    testDiscordWebhook,
} from '../../api/organizerApi';
import { useAuth } from '../../hooks/useAuth';

export default function Profile() {
    const { user } = useAuth();
    const [org, setOrg] = useState(null);
    const [form, setForm] = useState({ name: '', category: '', description: '', contactEmail: '', contactNumber: '', discordWebhook: '' });
    const [resetReason, setResetReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const [resetStatus, setResetStatus] = useState(null);
    const [requestPasswordForm, setRequestPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
    const [webhookMessage, setWebhookMessage] = useState('');
    const [testingWebhook, setTestingWebhook] = useState(false);

    const fetchResetStatus = async () => {
        try {
            const res = await getPasswordResetStatus();
            setResetStatus(res.data || null);
        } catch {
            setResetStatus(null);
        }
    };

    useEffect(() => {
        Promise.all([getOrganizerById('me'), getPasswordResetStatus().catch(() => ({ data: null }))])
            .then(([orgRes, resetRes]) => {
                const o = orgRes.data?.organizer || orgRes.data;
                setOrg(o);
                setForm({ name: o.name || '', category: o.category || '', description: o.description || '', contactEmail: o.contactEmail || '', contactNumber: o.contactNumber || '', discordWebhook: o.discordWebhook || '' });
                setResetStatus(resetRes.data || null);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try { await updateOrganizerProfile(form); setMessage('Profile updated!'); setTimeout(() => setMessage(''), 3000); }
        catch (err) { setMessage(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const handlePasswordResetRequest = async () => {
        setResetMessage('');
        if (!requestPasswordForm.newPassword || requestPasswordForm.newPassword.length < 6) {
            setResetMessage('New password must be at least 6 characters');
            return;
        }
        if (requestPasswordForm.newPassword !== requestPasswordForm.confirmPassword) {
            setResetMessage('Passwords do not match');
            return;
        }
        try {
            await requestPasswordReset({
                reason: resetReason.trim(),
                newPassword: requestPasswordForm.newPassword,
                confirmPassword: requestPasswordForm.confirmPassword,
            });
            setResetMessage('Password reset request submitted. Status is now pending admin approval.');
            setResetReason('');
            setRequestPasswordForm({ newPassword: '', confirmPassword: '' });
            fetchResetStatus();
        } catch (err) {
            setResetMessage(err.response?.data?.message || 'Failed to submit reset request');
        }
    };

    const handleTestWebhook = async () => {
        setWebhookMessage('');
        setTestingWebhook(true);
        try {
            const res = await testDiscordWebhook();
            setWebhookMessage(res.data?.message || 'Webhook test successful');
        } catch (err) {
            setWebhookMessage(err.response?.data?.message || 'Webhook test failed');
        } finally {
            setTestingWebhook(false);
        }
    };

    if (loading) return <div className="empty-state"><div className="spinner"></div></div>;

    const resetStage = resetStatus?.status || 'none';
    const canRequestReset = !resetStatus?.hasRequest || resetStage === 'rejected' || resetStage === 'approved' || resetStage === 'completed';
    const isAwaitingApproval = resetStage === 'pending';
    const isApprovedAndApplied = resetStage === 'approved';

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
                        {webhookMessage && (
                            <p style={{ color: webhookMessage.toLowerCase().includes('successful') ? '#2ed573' : '#ff6b7a', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                {webhookMessage}
                            </p>
                        )}
                        <div style={{ marginTop: '0.75rem' }}>
                            <button className="btn btn-secondary" onClick={handleTestWebhook} disabled={testingWebhook}>
                                {testingWebhook ? 'Testing...' : 'Test Webhook'}
                            </button>
                        </div>
                    </div>
                    <div className="card">
                        <h3 style={{ marginBottom: '0.75rem' }}>Password Reset (Admin Approval)</h3>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                            Enter your new password and submit a reset request. Admin approval will apply that password.
                        </p>
                        {resetStatus?.hasRequest && (
                            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                                Latest Request Status: <strong>{resetStatus.status}</strong>
                            </p>
                        )}
                        {resetMessage && (
                            <div style={{ color: (resetMessage.toLowerCase().includes('submitted') || resetMessage.toLowerCase().includes('completed')) ? '#2ed573' : '#ff6b7a', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                {resetMessage}
                            </div>
                        )}

                        {isAwaitingApproval && (
                            <div style={{ color: '#ffb86b', fontSize: '0.85rem' }}>
                                Reset request sent. Waiting for admin approval.
                            </div>
                        )}

                        {isApprovedAndApplied && (
                            <div style={{ color: '#2ed573', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                Request approved. Your password has been updated.
                            </div>
                        )}

                        {canRequestReset && (
                            <>
                                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                    <label>Reason (optional)</label>
                                    <textarea
                                        className="search-bar"
                                        style={{ minHeight: '80px' }}
                                        value={resetReason}
                                        onChange={e => setResetReason(e.target.value)}
                                        placeholder="Example: I forgot my organizer password"
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        className="search-bar"
                                        value={requestPasswordForm.newPassword}
                                        onChange={(e) => setRequestPasswordForm({ ...requestPasswordForm, newPassword: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                    <label>Confirm Password</label>
                                    <input
                                        type="password"
                                        className="search-bar"
                                        value={requestPasswordForm.confirmPassword}
                                        onChange={(e) => setRequestPasswordForm({ ...requestPasswordForm, confirmPassword: e.target.value })}
                                    />
                                </div>
                                <button className="btn btn-secondary" onClick={handlePasswordResetRequest}>Request Password Reset</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

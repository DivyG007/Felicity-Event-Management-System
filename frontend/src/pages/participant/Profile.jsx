import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getProfile, updateProfile, changePassword } from '../../api/userApi';
import { INTEREST_OPTIONS } from '../../utils/constants';

export default function Profile() {
    const { user, updateUser } = useAuth();
    const [form, setForm] = useState({ firstName: '', lastName: '', contactNumber: '', college: '', interests: [] });
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [pwMessage, setPwMessage] = useState('');

    useEffect(() => {
        getProfile().then(res => {
            const p = res.data;
            setForm({ firstName: p.firstName || '', lastName: p.lastName || '', contactNumber: p.contactNumber || '', college: p.college || '', interests: p.interests || [] });
        }).catch(() => { });
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateProfile(form);
            updateUser(form);
            setMessage('Profile updated!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Update failed');
        } finally { setLoading(false); }
    };

    const toggleInterest = (i) => {
        setForm(prev => ({ ...prev, interests: prev.interests.includes(i) ? prev.interests.filter(x => x !== i) : [...prev.interests, i] }));
    };

    const handlePasswordChange = async () => {
        if (pwForm.newPassword !== pwForm.confirmPassword) { setPwMessage('Passwords do not match'); return; }
        setPwLoading(true);
        try {
            await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
            setPwMessage('Password changed!');
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPwMessage(err.response?.data?.message || 'Failed');
        } finally { setPwLoading(false); }
    };

    return (
        <div>
            <div className="page-header"><h1>Profile 👤</h1></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Personal Info</h3>
                    {message && <div style={{ color: message.includes('!') ? '#2ed573' : '#ff6b7a', marginBottom: '0.75rem', fontSize: '0.85rem' }}>{message}</div>}
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label>Email (non-editable)</label>
                        <input className="search-bar" value={user?.email || ''} disabled />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label>Participant Type</label>
                        <input className="search-bar" value={user?.participantType || ''} disabled />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>First Name</label>
                            <input className="search-bar" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Last Name</label>
                            <input className="search-bar" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label>Contact Number</label>
                        <input className="search-bar" value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>College / Organization</label>
                        <input className="search-bar" value={form.college} onChange={e => setForm({ ...form, college: e.target.value })} />
                    </div>
                    <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card">
                        <h3 style={{ marginBottom: '0.75rem' }}>Interests</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {INTEREST_OPTIONS.map(i => (
                                <button key={i} onClick={() => toggleInterest(i)} className={`btn ${form.interests.includes(i) ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>{i}</button>
                            ))}
                        </div>
                    </div>
                    <div className="card">
                        <h3 style={{ marginBottom: '0.75rem' }}>Change Password</h3>
                        {pwMessage && <div style={{ color: pwMessage.includes('!') ? '#2ed573' : '#ff6b7a', marginBottom: '0.5rem', fontSize: '0.85rem' }}>{pwMessage}</div>}
                        <div className="form-group" style={{ marginBottom: '0.5rem' }}><label>Current Password</label><input type="password" className="search-bar" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: '0.5rem' }}><label>New Password</label><input type="password" className="search-bar" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} /></div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}><label>Confirm New Password</label><input type="password" className="search-bar" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} /></div>
                        <button className="btn btn-secondary" onClick={handlePasswordChange} disabled={pwLoading}>{pwLoading ? 'Changing...' : 'Change Password'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../../api/eventApi';

export default function CreateEvent() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '', description: '', type: 'normal', eligibility: 'all',
        registrationDeadline: '', startDate: '', endDate: '',
        registrationLimit: '', registrationFee: 0, tags: '',
    });
    const [merchDetails, setMerchDetails] = useState({ sizes: '', colors: '', stockQuantity: 0, purchaseLimitPerUser: 1 });
    const [customForm, setCustomForm] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const addField = () => {
        setCustomForm([...customForm, { label: '', type: 'text', options: '', required: false, order: customForm.length }]);
    };

    const updateField = (index, key, value) => {
        const updated = [...customForm];
        updated[index] = { ...updated[index], [key]: value };
        setCustomForm(updated);
    };

    const removeField = (index) => {
        setCustomForm(customForm.filter((_, i) => i !== index));
    };

    const moveField = (index, direction) => {
        if ((direction === -1 && index === 0) || (direction === 1 && index === customForm.length - 1)) return;
        const updated = [...customForm];
        [updated[index], updated[index + direction]] = [updated[index + direction], updated[index]];
        updated.forEach((f, i) => f.order = i);
        setCustomForm(updated);
    };

    const handleSubmit = async (status = 'draft') => {
        setLoading(true); setError('');
        try {
            const payload = {
                ...form, status, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
                registrationLimit: form.registrationLimit ? Number(form.registrationLimit) : null,
                registrationFee: Number(form.registrationFee),
            };
            if (form.type === 'normal') {
                payload.customForm = customForm.map(f => ({ ...f, options: f.options ? f.options.split(',').map(o => o.trim()) : [] }));
            }
            if (form.type === 'merchandise') {
                payload.merchandiseDetails = {
                    sizes: merchDetails.sizes.split(',').map(s => s.trim()).filter(Boolean),
                    colors: merchDetails.colors.split(',').map(c => c.trim()).filter(Boolean),
                    stockQuantity: Number(merchDetails.stockQuantity),
                    purchaseLimitPerUser: Number(merchDetails.purchaseLimitPerUser),
                };
            }
            await createEvent(payload);
            navigate('/organizer/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create event');
        } finally { setLoading(false); }
    };

    return (
        <div>
            <div className="page-header"><h1>Create Event ➕</h1></div>
            {error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Event Details</h3>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}><label>Event Name *</label><input className="search-bar" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}><label>Description</label><textarea className="search-bar" style={{ minHeight: '80px' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div className="form-group" style={{ flex: 1 }}><label>Type</label><select className="search-bar" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="normal">Normal</option><option value="merchandise">Merchandise</option></select></div>
                        <div className="form-group" style={{ flex: 1 }}><label>Eligibility</label><select className="search-bar" value={form.eligibility} onChange={e => setForm({ ...form, eligibility: e.target.value })}><option value="all">All</option><option value="iiit-only">IIIT Only</option><option value="non-iiit-only">Non-IIIT Only</option></select></div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div className="form-group" style={{ flex: 1 }}><label>Start Date *</label><input type="datetime-local" className="search-bar" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
                        <div className="form-group" style={{ flex: 1 }}><label>End Date *</label><input type="datetime-local" className="search-bar" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}><label>Registration Deadline *</label><input type="datetime-local" className="search-bar" value={form.registrationDeadline} onChange={e => setForm({ ...form, registrationDeadline: e.target.value })} /></div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div className="form-group" style={{ flex: 1 }}><label>Registration Limit</label><input type="number" className="search-bar" value={form.registrationLimit} onChange={e => setForm({ ...form, registrationLimit: e.target.value })} placeholder="Unlimited" /></div>
                        <div className="form-group" style={{ flex: 1 }}><label>Fee (₹)</label><input type="number" className="search-bar" value={form.registrationFee} onChange={e => setForm({ ...form, registrationFee: e.target.value })} /></div>
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}><label>Tags (comma-separated)</label><input className="search-bar" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="tech, workshop, coding" /></div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {form.type === 'merchandise' && (
                        <div className="card">
                            <h3 style={{ marginBottom: '1rem' }}>Merchandise Details</h3>
                            <div className="form-group" style={{ marginBottom: '0.75rem' }}><label>Sizes (comma-separated)</label><input className="search-bar" value={merchDetails.sizes} onChange={e => setMerchDetails({ ...merchDetails, sizes: e.target.value })} placeholder="S, M, L, XL" /></div>
                            <div className="form-group" style={{ marginBottom: '0.75rem' }}><label>Colors (comma-separated)</label><input className="search-bar" value={merchDetails.colors} onChange={e => setMerchDetails({ ...merchDetails, colors: e.target.value })} placeholder="Red, Blue, Black" /></div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <div className="form-group" style={{ flex: 1 }}><label>Stock Quantity *</label><input type="number" className="search-bar" value={merchDetails.stockQuantity} onChange={e => setMerchDetails({ ...merchDetails, stockQuantity: e.target.value })} /></div>
                                <div className="form-group" style={{ flex: 1 }}><label>Purchase Limit/User</label><input type="number" className="search-bar" value={merchDetails.purchaseLimitPerUser} onChange={e => setMerchDetails({ ...merchDetails, purchaseLimitPerUser: e.target.value })} /></div>
                            </div>
                        </div>
                    )}

                    {form.type === 'normal' && (
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3>Registration Form Builder</h3>
                                <button className="btn btn-secondary" onClick={addField}>+ Add Field</button>
                            </div>
                            {customForm.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>No custom fields yet</p>}
                            {customForm.map((field, i) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input className="search-bar" style={{ flex: 2 }} placeholder="Field label" value={field.label} onChange={e => updateField(i, 'label', e.target.value)} />
                                        <select className="search-bar" style={{ flex: 1 }} value={field.type} onChange={e => updateField(i, 'type', e.target.value)}>
                                            <option value="text">Text</option><option value="textarea">Textarea</option><option value="number">Number</option><option value="email">Email</option><option value="dropdown">Dropdown</option><option value="checkbox">Checkbox</option><option value="file">File</option>
                                        </select>
                                    </div>
                                    {(field.type === 'dropdown' || field.type === 'checkbox') && (
                                        <input className="search-bar" style={{ marginBottom: '0.5rem', width: '100%' }} placeholder="Options (comma-separated)" value={field.options} onChange={e => updateField(i, 'options', e.target.value)} />
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={field.required} onChange={e => updateField(i, 'required', e.target.checked)} /> <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Required</span>
                                        </label>
                                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                                            <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => moveField(i, -1)}>↑</button>
                                            <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => moveField(i, 1)}>↓</button>
                                            <button className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => removeField(i)}>✕</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => handleSubmit('draft')} disabled={loading}>Save as Draft</button>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleSubmit('published')} disabled={loading}>{loading ? 'Creating...' : 'Publish Event'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

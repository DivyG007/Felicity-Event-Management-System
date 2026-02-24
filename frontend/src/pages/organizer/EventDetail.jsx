import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById, updateEvent, changeEventStatus, getEventParticipants, getEventAnalytics } from '../../api/eventApi';

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const VARIANT_OPTIONS = ['Regular Fit', 'Oversized', 'Slim Fit', 'Skinny', 'Relaxed Fit'];
const COLOR_OPTIONS = ['Red', 'Blue', 'Black', 'White', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Gray'];
const FIELD_TYPES = ['text', 'textarea', 'number', 'email', 'dropdown', 'checkbox', 'file'];

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
    const [participantSearch, setParticipantSearch] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [attendanceFilter, setAttendanceFilter] = useState('all');
    const [teamFilter, setTeamFilter] = useState('all');

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
            let payload = {};

            if (event.status === 'draft') {
                payload = {
                    name: editForm.name,
                    description: editForm.description,
                    type: editForm.type,
                    eligibility: editForm.eligibility,
                    registrationDeadline: editForm.registrationDeadline,
                    startDate: editForm.startDate,
                    endDate: editForm.endDate,
                    registrationLimit: editForm.registrationLimit === '' ? null : Number(editForm.registrationLimit),
                    registrationFee: Number(editForm.registrationFee || 0),
                    tags: Array.isArray(editForm.tags)
                        ? editForm.tags
                        : String(editForm.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
                };

                if (editForm.type === 'normal') {
                    payload.customForm = (editForm.customForm || []).map((field, index) => ({
                        label: field.label,
                        type: field.type,
                        required: !!field.required,
                        order: index,
                        options: ['dropdown', 'checkbox'].includes(field.type)
                            ? (Array.isArray(field.options)
                                ? field.options
                                : String(field.options || '').split(',').map((o) => o.trim()).filter(Boolean))
                            : [],
                    }));
                }

                if (editForm.type === 'merchandise') {
                    const merch = editForm.merchandiseDetails || {};
                    payload.merchandiseDetails = {
                        sizes: Array.isArray(merch.sizes) ? merch.sizes : (merch.sizes ? [merch.sizes] : []),
                        colors: Array.isArray(merch.colors) ? merch.colors : (merch.colors ? [merch.colors] : []),
                        variants: Array.isArray(merch.variants) ? merch.variants : (merch.variants ? [merch.variants] : ['Regular Fit', 'Oversized']),
                        price: Number(merch.price || 0),
                        stockQuantity: Number(merch.stockQuantity || 0),
                        purchaseLimitPerUser: Number(merch.purchaseLimitPerUser || 1),
                    };
                }
            } else if (event.status === 'published') {
                payload = {
                    description: editForm.description,
                    registrationDeadline: editForm.registrationDeadline,
                    registrationLimit: editForm.registrationLimit === '' ? null : Number(editForm.registrationLimit),
                };
            }

            const res = await updateEvent(id, payload);
            setEvent(res.data);
            setEditForm(res.data);
            setEditing(false);
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const addFormField = () => {
        const existingFields = editForm.customForm || [];
        const updatedFields = [
            ...existingFields,
            { label: '', type: 'text', options: '', required: false, order: existingFields.length },
        ];
        setEditForm((prev) => ({ ...prev, customForm: updatedFields }));
    };

    const updateFormField = (index, key, value) => {
        const updatedFields = [...(editForm.customForm || [])];
        updatedFields[index] = { ...updatedFields[index], [key]: value };
        setEditForm((prev) => ({ ...prev, customForm: updatedFields }));
    };

    const removeFormField = (index) => {
        const updatedFields = (editForm.customForm || []).filter((_, i) => i !== index)
            .map((field, i) => ({ ...field, order: i }));
        setEditForm((prev) => ({ ...prev, customForm: updatedFields }));
    };

    const moveFormField = (index, direction) => {
        const currentFields = [...(editForm.customForm || [])];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= currentFields.length) return;
        [currentFields[index], currentFields[targetIndex]] = [currentFields[targetIndex], currentFields[index]];
        const normalized = currentFields.map((field, i) => ({ ...field, order: i }));
        setEditForm((prev) => ({ ...prev, customForm: normalized }));
    };

    const getTeamValue = (participant) => {
        const responses = participant?.formResponses;
        if (!responses || typeof responses !== 'object' || Array.isArray(responses)) return '—';
        const entries = Object.entries(responses);
        const teamEntry = entries.find(([key, value]) => {
            const normalizedKey = String(key).toLowerCase();
            return (
                ['team', 'teamname', 'team_name', 'teamid', 'team_id', 'group', 'groupname', 'group_name'].includes(normalizedKey) &&
                value !== undefined &&
                value !== null &&
                String(value).trim()
            );
        });
        return teamEntry ? String(teamEntry[1]).trim() : '—';
    };

    const filteredParticipants = participants.filter((participant) => {
        const fullName = `${participant.userId?.firstName || ''} ${participant.userId?.lastName || ''}`.trim().toLowerCase();
        const email = (participant.userId?.email || '').toLowerCase();
        const searchValue = participantSearch.trim().toLowerCase();
        const teamValue = getTeamValue(participant);
        const attendanceValue = participant.status === 'attended' ? 'attended' : 'not-attended';

        const matchesSearch = !searchValue || fullName.includes(searchValue) || email.includes(searchValue);
        const matchesPayment = paymentFilter === 'all' || (participant.paymentStatus || 'none') === paymentFilter;
        const matchesAttendance = attendanceFilter === 'all' || attendanceValue === attendanceFilter;
        const matchesTeam =
            teamFilter === 'all' ||
            (teamFilter === 'with-team' && teamValue !== '—') ||
            (teamFilter === 'without-team' && teamValue === '—');

        return matchesSearch && matchesPayment && matchesAttendance && matchesTeam;
    });

    const downloadCSV = () => {
        const headers = ['Name', 'Email', 'Reg Date', 'Payment', 'Team', 'Attendance'];
        const rows = filteredParticipants.map(p => [
            `${p.userId?.firstName || ''} ${p.userId?.lastName || ''}`,
            p.userId?.email || '',
            new Date(p.createdAt).toLocaleString(),
            p.paymentStatus || 'none',
            getTeamValue(p),
            p.status === 'attended' ? 'attended' : 'not-attended',
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${event?.name || 'event'}_participants.csv`; a.click();
    };

    if (loading) return <div className="empty-state"><div className="spinner"></div></div>;
    if (!event) return <div className="empty-state"><p>Event not found</p></div>;

    const statusFlow = { draft: ['published'], published: ['ongoing', 'closed'], ongoing: ['completed', 'closed'], completed: ['closed'] };
    const canEdit = ['draft', 'published'].includes(event.status);
    const isDraftEdit = event.status === 'draft';
    const isPublishedEdit = event.status === 'published';
    const isFormLocked = (event.registrationCount || 0) > 0 || event.formLocked;

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
                        {isDraftEdit && (
                            <>
                                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.75rem' }}>Draft mode: full editing enabled. You can publish when ready.</p>
                                <div className="form-group" style={{ marginBottom: '0.75rem' }}><label>Name</label><input className="search-bar" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                                <div className="form-group" style={{ marginBottom: '0.75rem' }}><label>Description</label><textarea className="search-bar" style={{ minHeight: '80px' }} value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>

                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Type</label>
                                        <select className="search-bar" value={editForm.type || 'normal'} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                                            <option value="normal">Normal</option>
                                            <option value="merchandise">Merchandise</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Eligibility</label>
                                        <select className="search-bar" value={editForm.eligibility || 'all'} onChange={e => setEditForm({ ...editForm, eligibility: e.target.value })}>
                                            <option value="all">All</option>
                                            <option value="iiit-only">IIIT Only</option>
                                            <option value="non-iiit-only">Non-IIIT Only</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div className="form-group" style={{ flex: 1 }}><label>Start</label><input type="datetime-local" className="search-bar" value={editForm.startDate?.slice(0, 16) || ''} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} /></div>
                                    <div className="form-group" style={{ flex: 1 }}><label>End</label><input type="datetime-local" className="search-bar" value={editForm.endDate?.slice(0, 16) || ''} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} /></div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div className="form-group" style={{ flex: 1 }}><label>Registration Deadline</label><input type="datetime-local" className="search-bar" value={editForm.registrationDeadline?.slice(0, 16) || ''} onChange={e => setEditForm({ ...editForm, registrationDeadline: e.target.value })} /></div>
                                    <div className="form-group" style={{ flex: 1 }}><label>Registration Limit</label><input type="number" className="search-bar" value={editForm.registrationLimit ?? ''} onChange={e => setEditForm({ ...editForm, registrationLimit: e.target.value })} /></div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div className="form-group" style={{ flex: 1 }}><label>Fee (₹)</label><input type="number" className="search-bar" value={editForm.registrationFee ?? 0} onChange={e => setEditForm({ ...editForm, registrationFee: e.target.value })} /></div>
                                    <div className="form-group" style={{ flex: 1 }}><label>Tags (comma separated)</label><input className="search-bar" value={Array.isArray(editForm.tags) ? editForm.tags.join(', ') : (editForm.tags || '')} onChange={e => setEditForm({ ...editForm, tags: e.target.value })} /></div>
                                </div>

                                {editForm.type === 'normal' && (
                                    <div style={{ marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <h4 style={{ margin: 0 }}>Registration Form Builder</h4>
                                            <button className="btn btn-secondary" onClick={addFormField} disabled={isFormLocked}>+ Add Field</button>
                                        </div>
                                        {isFormLocked && <p style={{ color: '#ffb86b', marginBottom: '0.75rem', fontSize: '0.85rem' }}>Form is locked after first registration.</p>}
                                        {(editForm.customForm || []).length === 0 && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>No custom fields yet.</p>}

                                        {(editForm.customForm || []).map((field, index) => (
                                            <div key={index} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.75rem', marginBottom: '0.6rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    <input className="search-bar" style={{ flex: 2 }} placeholder="Field label" value={field.label || ''} onChange={(e) => updateFormField(index, 'label', e.target.value)} disabled={isFormLocked} />
                                                    <select className="search-bar" style={{ flex: 1 }} value={field.type || 'text'} onChange={(e) => updateFormField(index, 'type', e.target.value)} disabled={isFormLocked}>
                                                        {FIELD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                                                    </select>
                                                </div>

                                                {(field.type === 'dropdown' || field.type === 'checkbox') && (
                                                    <input
                                                        className="search-bar"
                                                        style={{ width: '100%', marginBottom: '0.5rem' }}
                                                        placeholder="Options (comma-separated)"
                                                        value={Array.isArray(field.options) ? field.options.join(', ') : (field.options || '')}
                                                        onChange={(e) => updateFormField(index, 'options', e.target.value)}
                                                        disabled={isFormLocked}
                                                    />
                                                )}

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', cursor: isFormLocked ? 'not-allowed' : 'pointer' }}>
                                                        <input type="checkbox" checked={!!field.required} onChange={(e) => updateFormField(index, 'required', e.target.checked)} disabled={isFormLocked} />
                                                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)' }}>{field.required ? 'Required' : 'Flexible (Optional)'}</span>
                                                    </label>

                                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                        <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => moveFormField(index, -1)} disabled={isFormLocked}>↑</button>
                                                        <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => moveFormField(index, 1)} disabled={isFormLocked}>↓</button>
                                                        <button className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => removeFormField(index)} disabled={isFormLocked}>✕</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {editForm.type === 'merchandise' && (
                                    <div style={{ marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem' }}>
                                        <h4 style={{ marginBottom: '0.75rem' }}>Merchandise Details</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                            <div className="form-group"><label>Size</label><select className="search-bar" value={editForm.merchandiseDetails?.sizes?.[0] || ''} onChange={e => setEditForm({ ...editForm, merchandiseDetails: { ...editForm.merchandiseDetails, sizes: e.target.value ? [e.target.value] : [] } })}><option value="">Select size</option>{SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                            <div className="form-group"><label>Variant</label><select className="search-bar" value={editForm.merchandiseDetails?.variants?.[0] || ''} onChange={e => setEditForm({ ...editForm, merchandiseDetails: { ...editForm.merchandiseDetails, variants: e.target.value ? [e.target.value] : [] } })}><option value="">Select variant</option>{VARIANT_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                                            <div className="form-group"><label>Color</label><select className="search-bar" value={editForm.merchandiseDetails?.colors?.[0] || ''} onChange={e => setEditForm({ ...editForm, merchandiseDetails: { ...editForm.merchandiseDetails, colors: e.target.value ? [e.target.value] : [] } })}><option value="">Select color</option>{COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                            <div className="form-group"><label>Price</label><input type="number" className="search-bar" value={editForm.merchandiseDetails?.price ?? 0} onChange={e => setEditForm({ ...editForm, merchandiseDetails: { ...editForm.merchandiseDetails, price: e.target.value } })} /></div>
                                            <div className="form-group"><label>Stock</label><input type="number" className="search-bar" value={editForm.merchandiseDetails?.stockQuantity ?? 0} onChange={e => setEditForm({ ...editForm, merchandiseDetails: { ...editForm.merchandiseDetails, stockQuantity: e.target.value } })} /></div>
                                            <div className="form-group"><label>Limit/User</label><input type="number" className="search-bar" value={editForm.merchandiseDetails?.purchaseLimitPerUser ?? 1} onChange={e => setEditForm({ ...editForm, merchandiseDetails: { ...editForm.merchandiseDetails, purchaseLimitPerUser: e.target.value } })} /></div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {isPublishedEdit && (
                            <>
                                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.75rem' }}>Published mode: only description update, deadline extension, and registration limit increase are allowed.</p>
                                <div className="form-group" style={{ marginBottom: '0.75rem' }}><label>Description</label><textarea className="search-bar" style={{ minHeight: '80px' }} value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>
                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div className="form-group" style={{ flex: 1 }}><label>Registration Deadline (extend only)</label><input type="datetime-local" className="search-bar" value={editForm.registrationDeadline?.slice(0, 16) || ''} onChange={e => setEditForm({ ...editForm, registrationDeadline: e.target.value })} /></div>
                                    <div className="form-group" style={{ flex: 1 }}><label>Registration Limit (increase only)</label><input type="number" className="search-bar" value={editForm.registrationLimit ?? ''} onChange={e => setEditForm({ ...editForm, registrationLimit: e.target.value })} /></div>
                                </div>
                            </>
                        )}

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
                            <button className="btn btn-secondary" onClick={() => { setEditing(false); setEditForm(event); }}>Cancel</button>
                        </div>
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
                        <h3>Participants ({filteredParticipants.length})</h3>
                        <button className="btn btn-secondary" onClick={downloadCSV}>📥 Export CSV</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                        <input
                            className="search-bar"
                            placeholder="Search by name or email"
                            value={participantSearch}
                            onChange={(e) => setParticipantSearch(e.target.value)}
                        />
                        <select className="search-bar" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                            <option value="all">All Payments</option>
                            <option value="none">None</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <select className="search-bar" value={attendanceFilter} onChange={(e) => setAttendanceFilter(e.target.value)}>
                            <option value="all">All Attendance</option>
                            <option value="attended">Attended</option>
                            <option value="not-attended">Not Attended</option>
                        </select>
                        <select className="search-bar" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
                            <option value="all">All Teams</option>
                            <option value="with-team">With Team</option>
                            <option value="without-team">Without Team</option>
                        </select>
                    </div>

                    {filteredParticipants.length === 0 ? <p style={{ color: 'rgba(255,255,255,0.5)' }}>No participants match the current filters</p> : (
                        <table className="data-table">
                            <thead><tr><th>Name</th><th>Email</th><th>Reg Date</th><th>Payment</th><th>Team</th><th>Attendance</th></tr></thead>
                            <tbody>
                                {filteredParticipants.map(p => (
                                    <tr key={p._id}>
                                        <td>{p.userId?.firstName} {p.userId?.lastName}</td>
                                        <td>{p.userId?.email}</td>
                                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                                        <td><span className={`badge badge-${p.paymentStatus === 'approved' ? 'completed' : p.paymentStatus === 'pending' ? 'ongoing' : p.paymentStatus === 'rejected' ? 'closed' : 'published'}`}>{p.paymentStatus || 'none'}</span></td>
                                        <td>{getTeamValue(p)}</td>
                                        <td><span className={`badge badge-${p.status === 'attended' ? 'completed' : 'published'}`}>{p.status === 'attended' ? 'attended' : 'not-attended'}</span></td>
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="stat-card"><div className="stat-value">{analytics?.totalRegistrations || 0}</div><div className="stat-label">Total Registrations</div></div>
                        <div className="stat-card"><div className="stat-value">{analytics?.attended || 0}</div><div className="stat-label">Attended</div></div>
                        <div className="stat-card"><div className="stat-value">₹{analytics?.totalRevenue || 0}</div><div className="stat-label">Total Revenue</div></div>
                    </div>
                    
                    {analytics && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ marginBottom: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>📦 Merchandise Sales</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                <div className="stat-card"><div className="stat-value">{analytics?.merchandiseUnits || 0}</div><div className="stat-label">Units Sold</div></div>
                                <div className="stat-card"><div className="stat-value">₹{analytics?.merchandiseRevenue || 0}</div><div className="stat-label">Merchandise Revenue</div></div>
                                <div className="stat-card"><div className="stat-value">₹{event?.merchandiseDetails?.price || 0}</div><div className="stat-label">Price per Unit</div></div>
                            </div>
                        </div>
                    )}

                    {analytics && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ marginBottom: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>🎫 Registration Revenue</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                <div className="stat-card"><div className="stat-value">₹{analytics?.revenue || 0}</div><div className="stat-label">Total from Fees</div></div>
                                <div className="stat-card"><div className="stat-value">₹{event?.registrationFee || 0}</div><div className="stat-label">Fee per Registration</div></div>
                            </div>
                        </div>
                    )}

                    {analytics && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ marginBottom: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>👥 Team Completion</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                                <div className="stat-card"><div className="stat-value">{analytics?.totalTeams || 0}</div><div className="stat-label">Total Teams</div></div>
                                <div className="stat-card"><div className="stat-value">{analytics?.completedTeams || 0}</div><div className="stat-label">Completed Teams</div></div>
                                <div className="stat-card"><div className="stat-value">{analytics?.incompleteTeams || 0}</div><div className="stat-label">Incomplete Teams</div></div>
                                <div className="stat-card"><div className="stat-value">{analytics?.attendedTeams || 0}</div><div className="stat-label">Fully Attended Teams</div></div>
                                <div className="stat-card"><div className="stat-value">{analytics?.teamCompletionRate || 0}%</div><div className="stat-label">Completion Rate</div></div>
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 style={{ marginBottom: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>⭐ Feedback</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            <div className="stat-card"><div className="stat-value">{analytics?.averageRating?.toFixed(1) || 'N/A'}</div><div className="stat-label">Avg Rating</div></div>
                            <div className="stat-card"><div className="stat-value">{analytics?.feedbackCount || 0}</div><div className="stat-label">Feedback Count</div></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

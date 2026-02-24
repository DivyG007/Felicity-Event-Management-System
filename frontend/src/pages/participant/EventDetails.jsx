import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById } from '../../api/eventApi';
import { registerForEvent } from '../../api/registrationApi';
import { useAuth } from '../../hooks/useAuth';
import DiscussionForum from '../../components/DiscussionForum';

export default function EventDetails() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [formData, setFormData] = useState({});
    const [merchOptions, setMerchOptions] = useState({ size: '', color: '', variant: '' });
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        getEventById(id)
            .then(res => setEvent(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    const deadlinePassed = event && new Date(event.registrationDeadline) < new Date();
    const limitReached = event && event.registrationLimit && event.registrationCount >= event.registrationLimit;
    const stockOut = event?.type === 'merchandise' && event?.merchandiseDetails?.stockQuantity <= 0;
    const canRegister = !deadlinePassed && !limitReached && !stockOut;

    const handleRegister = async () => {
        setRegistering(true);
        setMessage({ text: '', type: '' });
        try {
            const payload = { eventId: id };
            if (event.type === 'normal' && event.customForm?.length > 0) {
                payload.formResponses = formData;
            }
            if (event.type === 'merchandise') {
                payload.selectedSize = merchOptions.size;
                payload.selectedColor = merchOptions.color;
                payload.selectedVariant = merchOptions.variant;
            }
            const res = await registerForEvent(payload);
            setMessage({ text: `Registered! Ticket ID: ${res.data.ticketId}`, type: 'success' });
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Registration failed', type: 'error' });
        } finally {
            setRegistering(false);
        }
    };

    if (loading) return <div className="empty-state"><div className="spinner"></div></div>;
    if (!event) return <div className="empty-state"><p>Event not found</p></div>;

    return (
        <div>
            <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
                ← Back
            </button>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>{event.name}</h1>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>by {event.organizerId?.name || 'Organizer'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span className={`badge badge-${event.status}`}>{event.status}</span>
                        <span className="badge" style={{ background: 'rgba(102,126,234,0.15)', color: '#667eea' }}>{event.type}</span>
                    </div>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem', lineHeight: 1.6 }}>{event.description}</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="stat-card">
                        <div className="stat-label">Start Date</div>
                        <div style={{ color: '#fff', fontWeight: 600 }}>{new Date(event.startDate).toLocaleDateString()}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">End Date</div>
                        <div style={{ color: '#fff', fontWeight: 600 }}>{new Date(event.endDate).toLocaleDateString()}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Registration Deadline</div>
                        <div style={{ color: deadlinePassed ? '#ff6b7a' : '#fff', fontWeight: 600 }}>
                            {new Date(event.registrationDeadline).toLocaleDateString()}
                            {deadlinePassed && ' (Passed)'}
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Fee</div>
                        <div style={{ color: '#fff', fontWeight: 600 }}>₹{event.registrationFee || 'Free'}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Registrations</div>
                        <div style={{ color: '#fff', fontWeight: 600 }}>
                            {event.registrationCount || 0}{event.registrationLimit ? ` / ${event.registrationLimit}` : ''}
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Eligibility</div>
                        <div style={{ color: '#fff', fontWeight: 600 }}>{event.eligibility || 'All'}</div>
                    </div>
                </div>

                {event.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        {event.tags.map(tag => (
                            <span key={tag} className="badge" style={{ background: 'rgba(255,255,255,0.08)' }}>{tag}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Merchandise options */}
            {event.type === 'merchandise' && event.merchandiseDetails && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Select Options</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {event.merchandiseDetails.sizes?.length > 0 && (
                            <div className="form-group">
                                <label>Size</label>
                                <select className="search-bar" value={merchOptions.size} onChange={e => setMerchOptions({ ...merchOptions, size: e.target.value })}>
                                    <option value="">Select size</option>
                                    {event.merchandiseDetails.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        )}
                        {event.merchandiseDetails.colors?.length > 0 && (
                            <div className="form-group">
                                <label>Color</label>
                                <select className="search-bar" value={merchOptions.color} onChange={e => setMerchOptions({ ...merchOptions, color: e.target.value })}>
                                    <option value="">Select color</option>
                                    {event.merchandiseDetails.colors.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                        Stock: {event.merchandiseDetails.stockQuantity} remaining
                    </p>
                </div>
            )}

            {/* Custom form for normal events */}
            {event.type === 'normal' && event.customForm?.length > 0 && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Registration Form</h3>
                    {event.customForm.sort((a, b) => a.order - b.order).map(field => (
                        <div key={field._id} className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>{field.label} {field.required && <span style={{ color: '#ff6b7a' }}>*</span>}</label>
                            {field.type === 'textarea' ? (
                                <textarea className="search-bar" style={{ minHeight: '80px' }} onChange={e => setFormData({ ...formData, [field.label]: e.target.value })} required={field.required} />
                            ) : field.type === 'dropdown' ? (
                                <select className="search-bar" onChange={e => setFormData({ ...formData, [field.label]: e.target.value })} required={field.required}>
                                    <option value="">Select...</option>
                                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            ) : field.type === 'checkbox' ? (
                                field.options?.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                        {field.options.map(opt => (
                                            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={(formData[field.label] || []).includes(opt)}
                                                    onChange={(e) => {
                                                        const current = Array.isArray(formData[field.label]) ? formData[field.label] : [];
                                                        const next = e.target.checked
                                                            ? [...current, opt]
                                                            : current.filter(item => item !== opt);
                                                        setFormData({ ...formData, [field.label]: next });
                                                    }}
                                                />
                                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="checkbox" onChange={e => setFormData({ ...formData, [field.label]: e.target.checked })} />
                                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Yes</span>
                                    </label>
                                )
                            ) : field.type === 'file' ? (
                                <input
                                    type="file"
                                    className="search-bar"
                                    onChange={e => setFormData({ ...formData, [field.label]: e.target.files?.[0]?.name || '' })}
                                    required={field.required}
                                />
                            ) : (
                                <input type={field.type || 'text'} className="search-bar" onChange={e => setFormData({ ...formData, [field.label]: e.target.value })} required={field.required} />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Register / Purchase button */}
            {message.text && (
                <div className={`auth-error`} style={{ marginBottom: '1rem', background: message.type === 'success' ? 'rgba(46,213,115,0.15)' : undefined, borderColor: message.type === 'success' ? 'rgba(46,213,115,0.3)' : undefined, color: message.type === 'success' ? '#2ed573' : undefined }}>
                    {message.text}
                </div>
            )}

            <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                onClick={handleRegister}
                disabled={!canRegister || registering}
            >
                {!canRegister
                    ? (deadlinePassed ? 'Registration Closed' : limitReached ? 'Registration Full' : 'Out of Stock')
                    : registering
                        ? 'Processing...'
                        : event.type === 'merchandise' ? `Purchase — ₹${event.registrationFee || 0}` : 'Register Now'
                }
            </button>

            {/* Real-Time Discussion Forum */}
            <div style={{ marginTop: '1.5rem' }}>
                <DiscussionForum eventId={id} eventName={event.name} />
            </div>
        </div>
    );
}

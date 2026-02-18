import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { completeOnboarding } from '../api/userApi';
import { getAllOrganizers } from '../api/organizerApi';
import { INTEREST_OPTIONS } from '../utils/constants';
import { useEffect } from 'react';
import './Auth.css';

export default function Onboarding() {
    const [interests, setInterests] = useState([]);
    const [organizers, setOrganizers] = useState([]);
    const [followedOrgs, setFollowedOrgs] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { updateUser } = useAuth();

    useEffect(() => {
        getAllOrganizers()
            .then(res => setOrganizers(res.data || []))
            .catch(() => { });
    }, []);

    const toggleInterest = (interest) => {
        setInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const toggleFollow = (orgId) => {
        setFollowedOrgs(prev =>
            prev.includes(orgId)
                ? prev.filter(id => id !== orgId)
                : [...prev, orgId]
        );
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await completeOnboarding({ interests, followedOrganizers: followedOrgs });
            updateUser({ onboardingCompleted: true, interests, followedOrganizers: followedOrgs });
            navigate('/participant/dashboard');
        } catch (err) {
            console.error('Onboarding error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        try {
            await completeOnboarding({ interests: [], followedOrganizers: [] });
            updateUser({ onboardingCompleted: true });
        } catch (err) {
            console.error('Skip onboarding error:', err);
        }
        navigate('/participant/dashboard');
    };

    return (
        <div className="auth-container">
            <div className="auth-card auth-card-wide" style={{ maxWidth: '600px' }}>
                <div className="auth-header">
                    <h1>🎪 Welcome to Felicity!</h1>
                    <p>Let&apos;s personalize your experience</p>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>
                        Select your interests
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {INTEREST_OPTIONS.map(interest => (
                            <button
                                key={interest}
                                onClick={() => toggleInterest(interest)}
                                className={`btn ${interests.includes(interest) ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                            >
                                {interest}
                            </button>
                        ))}
                    </div>
                </div>

                {organizers.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>
                            Follow Clubs / Organizers
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {organizers.map(org => (
                                <div
                                    key={org._id}
                                    onClick={() => toggleFollow(org._id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '10px',
                                        background: followedOrgs.includes(org._id)
                                            ? 'rgba(102, 126, 234, 0.15)'
                                            : 'rgba(255, 255, 255, 0.05)',
                                        border: followedOrgs.includes(org._id)
                                            ? '1px solid rgba(102, 126, 234, 0.3)'
                                            : '1px solid rgba(255, 255, 255, 0.08)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{org.name}</div>
                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{org.category}</div>
                                    </div>
                                    <span>{followedOrgs.includes(org._id) ? '✓ Following' : '+ Follow'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={handleSkip} className="btn btn-secondary" style={{ flex: 1 }}>
                        Skip for now
                    </button>
                    <button onClick={handleSubmit} className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                        {loading ? 'Saving...' : 'Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
}

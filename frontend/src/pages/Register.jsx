import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerParticipant } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';
import { PARTICIPANT_TYPES } from '../utils/constants';
import './Auth.css';

export default function Register() {
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        participantType: 'non-iiit',
        college: '',
        contactNumber: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const { confirmPassword, ...data } = form;
            const res = await registerParticipant(data);
            login(res.data.token, res.data.user);

            // Redirect to onboarding
            navigate('/onboarding');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card auth-card-wide">
                <div className="auth-header">
                    <h1>🎪 Felicity</h1>
                    <p>Event Management System</p>
                </div>
                <h2>Create Account</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-error">{error}</div>}

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="firstName">First Name</label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={form.firstName}
                                onChange={handleChange}
                                placeholder="First name"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lastName">Last Name</label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={form.lastName}
                                onChange={handleChange}
                                placeholder="Last name"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="participantType">Participant Type</label>
                        <select
                            id="participantType"
                            name="participantType"
                            value={form.participantType}
                            onChange={handleChange}
                        >
                            <option value="non-iiit">Non-IIIT Participant</option>
                            <option value="iiit">IIIT Student</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder={form.participantType === 'iiit' ? 'yourname@iiit.ac.in' : 'your@email.com'}
                            required
                        />
                        {form.participantType === 'iiit' && (
                            <small className="form-hint">Must use your IIIT-issued email address</small>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="college">College / Organization</label>
                        <input
                            type="text"
                            id="college"
                            name="college"
                            value={form.college}
                            onChange={handleChange}
                            placeholder="Your college or organization"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="contactNumber">Contact Number</label>
                        <input
                            type="tel"
                            id="contactNumber"
                            name="contactNumber"
                            value={form.contactNumber}
                            onChange={handleChange}
                            placeholder="Your phone number"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Min 6 characters"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder="Re-enter password"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Sign In</Link>
                </p>
            </div>
        </div>
    );
}

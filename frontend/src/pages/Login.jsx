import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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

        try {
            const res = await loginUser(form);
            login(res.data.token, res.data.user);

            // Redirect based on role (participants go to onboarding if not completed)
            const u = res.data.user;
            if (u.role === 'participant' && !u.onboardingCompleted) {
                navigate('/onboarding');
            } else {
                const dashboardRoutes = {
                    participant: '/participant/dashboard',
                    organizer: '/organizer/dashboard',
                    admin: '/admin/dashboard',
                };
                navigate(dashboardRoutes[u.role] || '/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>🎪 Felicity</h1>
                    <p>Event Management System</p>
                </div>
                <h2>Welcome Back</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-error">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="auth-switch">
                    Don&apos;t have an account? <Link to="/register">Sign Up</Link>
                </p>
            </div>
        </div>
    );
}

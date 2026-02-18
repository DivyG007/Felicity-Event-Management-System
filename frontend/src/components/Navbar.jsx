import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Navbar.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = {
        participant: [
            { to: '/participant/dashboard', label: 'Dashboard', icon: '📊' },
            { to: '/participant/events', label: 'Browse Events', icon: '🔍' },
            { to: '/participant/organizers', label: 'Clubs', icon: '🏛️' },
            { to: '/participant/profile', label: 'Profile', icon: '👤' },
        ],
        organizer: [
            { to: '/organizer/dashboard', label: 'Dashboard', icon: '📊' },
            { to: '/organizer/create-event', label: 'Create Event', icon: '➕' },
            { to: '/organizer/ongoing', label: 'Ongoing', icon: '🔴' },
            { to: '/organizer/profile', label: 'Profile', icon: '👤' },
        ],
        admin: [
            { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
            { to: '/admin/organizers', label: 'Manage Clubs', icon: '🏛️' },
            { to: '/admin/password-resets', label: 'Resets', icon: '🔑' },
        ],
    };

    const items = navItems[user.role] || [];

    return (
        <nav className="navbar">
            <div className="nav-brand">
                <span className="nav-logo">🎪</span>
                <span className="nav-title">Felicity</span>
            </div>

            <div className="nav-links">
                {items.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </div>

            <div className="nav-user">
                <span className="nav-user-name">{user.firstName || user.email}</span>
                <span className="nav-role-badge">{user.role}</span>
                <button onClick={handleLogout} className="nav-logout-btn">
                    Logout
                </button>
            </div>
        </nav>
    );
}

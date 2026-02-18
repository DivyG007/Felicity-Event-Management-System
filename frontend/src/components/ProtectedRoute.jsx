import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        const dashboardRoutes = {
            participant: '/participant/dashboard',
            organizer: '/organizer/dashboard',
            admin: '/admin/dashboard',
        };
        return <Navigate to={dashboardRoutes[user.role] || '/login'} replace />;
    }

    return children;
}

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Wraps a route to require authentication.
 * Unauthenticated users are redirected to /login.
 * Shows a real loading spinner while auth state is being checked — a blank
 * screen here previously looked like the app had frozen or crashed on
 * every single page load, since this fires on literally every protected
 * route until the initial /auth/me check resolves.
 */
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
            </div>
        );
    }
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};

export default ProtectedRoute;

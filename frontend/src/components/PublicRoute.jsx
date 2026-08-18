import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Wraps a route meant only for logged-OUT users (/login, /register).
 * An already-authenticated user landing here (e.g. via browser back button,
 * a bookmark, or manually typing the URL) is redirected straight to the
 * interview page instead of being shown a login form for an account
 * they're already signed into.
 */
const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
            </div>
        );
    }
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return children;
};

export default PublicRoute;

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, History, Mic, LogOut, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Reusable header for authenticated pages (History, Report — deliberately
 * NOT the active InterviewDashboard page, to avoid adding UI chrome around
 * a focused, immersive recording experience).
 *
 * Logout here does the full job, not just a navigate('/login') while
 * leaving tokens behind: it calls the backend to actually invalidate the
 * session (authService.logout -> POST /auth/logout), clears local tokens,
 * clears AuthContext user state, and only then redirects. Camera/mic
 * cleanup for an in-progress interview is handled separately by
 * InterviewDashboard's own unmount effect, which fires automatically once
 * this redirect causes that route to unmount — no special-casing needed
 * here.
 */
const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (loggingOut) return; // guard against double-click firing this twice
        setLoggingOut(true);
        try {
            await logout();
        } finally {
            navigate('/login', { replace: true });
        }
    };

    return (
        <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    <Link to="/interview" className="flex items-center gap-2 font-bold text-lg text-slate-800">
                        <Sparkles className="w-6 h-6 text-primary-500" />
                        Intix
                    </Link>

                    <div className="hidden sm:flex items-center gap-1">
                        <Link
                            to="/interview"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                            <Mic className="w-4 h-4" />
                            Interview
                        </Link>
                        <Link
                            to="/history"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                            <History className="w-4 h-4" />
                            History
                        </Link>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(v => !v)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                                <User className="w-4 h-4" />
                            </div>
                            <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[140px] truncate">
                                {user?.name || user?.email || 'Account'}
                            </span>
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        </button>

                        <AnimatePresence>
                            {menuOpen && (
                                <>
                                    {/* Click-outside overlay */}
                                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50"
                                    >
                                        <div className="px-4 py-2 border-b border-slate-100">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || 'Account'}</p>
                                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                        </div>
                                        {/* Shown on small screens where the top nav links are hidden */}
                                        <Link
                                            to="/interview"
                                            onClick={() => setMenuOpen(false)}
                                            className="sm:hidden flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                            <Mic className="w-4 h-4" /> Interview
                                        </Link>
                                        <Link
                                            to="/history"
                                            onClick={() => setMenuOpen(false)}
                                            className="sm:hidden flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                            <History className="w-4 h-4" /> History
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            disabled={loggingOut}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            {loggingOut ? 'Logging out...' : 'Logout'}
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

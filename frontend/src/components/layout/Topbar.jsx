import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, User, Settings, Sparkles, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Topbar = ({ onMenuClick, isMobileMenuOpen }) => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Determine page title based on route
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/dashboard') return 'Dashboard';
        if (path.startsWith('/history')) return 'Interviews';
        if (path.startsWith('/report')) return 'Report';
        if (path === '/resume') return 'Resume';
        if (path === '/interview') return 'Interview';
        return '';
    };

    return (
        <header className="h-16 bg-black/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left: Mobile Menu Toggle & Page Title */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
                >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* Mobile Logo (visible only on mobile) */}
                <Link to="/dashboard" className="md:hidden flex items-center gap-2 font-bold text-lg text-white">
                    <Sparkles className="w-5 h-5 text-primary-500" />
                </Link>

                {/* Page Title (visible on desktop) */}
                <h1 className="hidden md:block text-sm font-medium text-slate-200">
                    {getPageTitle()}
                </h1>
            </div>

            {/* Right: User Profile & Theme Toggle */}
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                    aria-label="Toggle theme"
                >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 hover:bg-white/5 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-white/10"
                    >
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-medium text-xs">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="hidden sm:block text-sm font-medium text-slate-300">{user?.name || 'User'}</span>
                        <ChevronDown className={`hidden sm:block w-4 h-4 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown */}
                    {isDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                            <div className="absolute right-0 mt-2 w-48 bg-[#09090b] rounded-xl shadow-2xl shadow-black border border-white/10 py-1 z-20 backdrop-blur-xl">
                                <div className="px-4 py-2 border-b border-slate-700 mb-1 sm:hidden">
                                    <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                                </div>
                                <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
                                    <User className="w-4 h-4" /> Profile
                                </button>
                                <div className="border-t border-white/5 mt-1 pt-1">
                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            logout();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" /> Logout
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Topbar;

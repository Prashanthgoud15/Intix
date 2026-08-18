import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Link } from 'react-router-dom';
import { LayoutDashboard, History, FileText } from 'lucide-react';

const AppShell = ({ children, focusedMode = false }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { name: 'History', path: '/history', icon: <History className="w-5 h-5" /> },
        { name: 'Resume', path: '/resume', icon: <FileText className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-primary-500/30 flex">
            {/* Desktop Sidebar (hidden in focused mode) */}
            {!focusedMode && <Sidebar />}

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col min-w-0 ${!focusedMode ? 'md:ml-64' : ''}`}>
                {/* Topbar */}
                <Topbar
                    onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    isMobileMenuOpen={isMobileMenuOpen}
                />

                {/* Mobile Navigation Overlay */}
                {isMobileMenuOpen && !focusedMode && (
                    <div className="md:hidden fixed inset-0 z-30 bg-slate-950/90 backdrop-blur-md pt-16">
                        <nav className="px-4 py-6 space-y-2">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path ||
                                    (item.path === '/history' && location.pathname.startsWith('/report'));
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${isActive
                                            ? 'bg-primary-500/10 text-primary-400'
                                            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                                            }`}
                                    >
                                        {item.icon}
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AppShell;

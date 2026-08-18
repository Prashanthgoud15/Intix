import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, History, FileText, Sparkles } from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { name: 'New Interview', path: '/interview/setup', icon: <Sparkles className="w-4 h-4" /> },
        { name: 'History', path: '/history', icon: <History className="w-4 h-4" /> },
        { name: 'Resume', path: '/resume', icon: <FileText className="w-4 h-4" /> },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen bg-slate-900 border-r border-slate-800 fixed left-0 top-0 z-40">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900">
                <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-white tracking-tight">
                    <Sparkles className="w-5 h-5 text-primary-500" />
                    Intix
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-4 space-y-8 overflow-y-auto">
                <div>
                    <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Workspace
                    </h3>
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path ||
                                (item.path === '/history' && location.pathname.startsWith('/report'));
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${isActive
                                        ? 'bg-primary-500/10 text-primary-400'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    {item.icon}
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;

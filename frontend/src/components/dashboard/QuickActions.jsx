import { useNavigate } from 'react-router-dom';
import { Play, History, FileText, ChevronRight } from 'lucide-react';

const QuickActions = () => {
    const navigate = useNavigate();

    const actions = [
        {
            title: 'Start Interview',
            description: 'Practice a new interview',
            icon: <Play className="w-6 h-6 text-primary-400" />,
            path: '/interview',
            color: 'bg-primary-500/10 border-primary-500/20 hover:border-primary-500/40',
        },
        {
            title: 'Interview History',
            description: 'Review your previous interviews',
            icon: <History className="w-6 h-6 text-accent-400" />,
            path: '/history',
            color: 'bg-accent-500/10 border-accent-500/20 hover:border-accent-500/40',
        },
        {
            title: 'Resume',
            description: 'Manage your resume',
            icon: <FileText className="w-6 h-6 text-emerald-400" />,
            path: '/interview', // Currently resume upload is part of the interview flow
            color: 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40',
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {actions.map((action, index) => (
                <button
                    key={index}
                    onClick={() => navigate(action.path)}
                    className={`flex items-center p-5 rounded-xl border transition-all group text-left ${action.color} bg-slate-800/50 backdrop-blur-sm`}
                >
                    <div className="p-3 rounded-lg bg-slate-900/50 mr-4">
                        {action.icon}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-white text-lg">{action.title}</h3>
                        <p className="text-sm text-slate-400">{action.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors transform group-hover:translate-x-1" />
                </button>
            ))}
        </div>
    );
};

export default QuickActions;

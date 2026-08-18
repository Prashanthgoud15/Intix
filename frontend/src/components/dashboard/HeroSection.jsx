import { useNavigate } from 'react-router-dom';
import { Play, History } from 'lucide-react';
import { motion } from 'framer-motion';

const HeroSection = ({ userName }) => {
    const navigate = useNavigate();

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-8 md:p-12 mb-8 shadow-xl">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 max-w-3xl">
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl md:text-4xl font-bold text-white mb-2"
                >
                    Good morning, {userName}
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg text-slate-300 mb-8"
                >
                    Ready for your next interview? Practice smarter and improve with every session.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row gap-4"
                >
                    <button
                        onClick={() => navigate('/interview')}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-primary-500/25"
                    >
                        <Play className="w-5 h-5 fill-current" />
                        Start New Interview
                    </button>
                    <button
                        onClick={() => navigate('/history')}
                        className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
                    >
                        <History className="w-5 h-5" />
                        View Interview History
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default HeroSection;

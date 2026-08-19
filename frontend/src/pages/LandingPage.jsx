import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ChevronRight,
  Play,
  CheckCircle2,
  BarChart2,
  MessageSquare,
  Video,
  Target,
  FileText,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/ui/Button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockChartData = [
  { name: 'Mon', score: 65 },
  { name: 'Tue', score: 72 },
  { name: 'Wed', score: 68 },
  { name: 'Thu', score: 85 },
  { name: 'Fri', score: 82 },
  { name: 'Sat', score: 90 },
  { name: 'Sun', score: 95 },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-primary-500/30 font-sans">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 px-6 py-4 lg:px-8 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-white tracking-tight">
            <Sparkles className="w-5 h-5 text-primary-500" />
            Intix
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Product</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')} variant="primary" size="sm">
                Dashboard
              </Button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block"
                >
                  Log in
                </button>
                <Button onClick={() => navigate('/register')} variant="primary" size="sm">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center">
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-primary-400 mb-8">
                <span className="flex h-1.5 w-1.5 rounded-full bg-primary-500"></span>
                AI-powered interview coaching
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-4xl lg:text-[56px] font-bold text-white tracking-tight mb-6 leading-[1.1]">
                Your next interview <br className="hidden sm:block" /> starts here.
              </motion.h1>

              <motion.p variants={fadeUp} className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Practice realistic interviews with AI, get real-time feedback on your answers, speech and presentation, and improve with every session.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-12">
                <Button
                  size="lg"
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                  className="w-full sm:w-auto px-8"
                >
                  Start Practicing
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full sm:w-auto px-8"
                >
                  See How It Works
                </Button>
              </motion.div>

              <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-6 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-600" /> Real-time analysis</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-600" /> Personalized questions</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-600" /> Detailed performance reports</span>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* REAL PRODUCT PREVIEW */}
        <section className="px-6 lg:px-8 pb-24">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl"
            >
              <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                {/* Dashboard Header Mock */}
                <div className="h-14 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-900/50">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded bg-primary-500/20 flex items-center justify-center"><Sparkles className="w-4 h-4 text-primary-500" /></div>
                    <div className="text-sm font-semibold text-slate-300">Dashboard</div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center"><span className="text-xs text-slate-400">JD</span></div>
                  </div>
                </div>
                {/* Dashboard Content Mock */}
                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-xl font-bold text-white mb-1">Welcome back, John</div>
                        <div className="text-sm text-slate-400">Here&apos;s your interview performance overview.</div>
                      </div>
                      <div className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg flex items-center gap-2">
                        <Play className="w-4 h-4" /> Start Interview
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { label: 'Interviews', value: '12' },
                        { label: 'Avg Score', value: '85%' },
                        { label: 'Strengths', value: '4' },
                        { label: 'Focus Areas', value: '2' }
                      ].map((stat, i) => (
                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                          <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                          <div className="text-xs text-slate-500">{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 h-64 flex flex-col">
                      <div className="text-sm font-semibold text-slate-300 mb-6">Performance Trend</div>
                      <div className="flex-1 w-full h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={mockChartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', color: '#f8fafc' }}
                              itemStyle={{ color: '#0ea5e9' }}
                            />
                            <Area type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                      <div className="text-sm font-semibold text-slate-300 mb-6">Recent Interviews</div>
                      <div className="space-y-4">
                        {[
                          { role: 'Frontend Dev', date: '2 days ago', score: '88%' },
                          { role: 'Full Stack', date: '1 week ago', score: '82%' },
                          { role: 'React Dev', date: '2 weeks ago', score: '79%' }
                        ].map((item, i) => (
                          <div key={i} className="flex justify-between items-center border-b border-slate-800/50 pb-4 last:border-0 last:pb-0">
                            <div>
                              <div className="text-sm font-medium text-slate-200 mb-1">{item.role}</div>
                              <div className="text-xs text-slate-500">{item.date}</div>
                            </div>
                            <div className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs font-semibold rounded">
                              {item.score}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* WHAT INTIX ANALYZES */}
        <section id="features" className="py-24 bg-slate-900 border-y border-slate-800 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <h2 className="text-sm font-semibold text-primary-500 uppercase tracking-wider mb-3">What Intix Analyzes</h2>
              <p className="text-3xl font-bold text-white max-w-2xl">
                Comprehensive intelligence for every aspect of your interview performance.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: MessageSquare, title: "Answer Quality", desc: "How relevant, complete and technically strong your answers are." },
                { icon: Video, title: "Speech", desc: "Pace, clarity, filler words and speaking patterns." },
                { icon: Target, title: "Confidence", desc: "Signals from speech and presentation." },
                { icon: BarChart2, title: "Visual Presence", desc: "Eye contact, posture and body-language signals where available." }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors"
                >
                  <feature.icon className="w-6 h-6 text-primary-500 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW INTIX WORKS */}
        <section id="how-it-works" className="py-32 px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl font-bold text-white mb-4">How Intix works</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                A clean, 3-stage visual flow to prepare you for your next technical interview.
              </p>
            </div>

            <div className="space-y-24">
              {[
                { step: "01", title: "PRACTICE", desc: "Choose your role and start a realistic AI interview. Upload your resume to get personalized questions tailored to your specific experience.", align: "left" },
                { step: "02", title: "ANALYZE", desc: "Intix evaluates your answers, speech and presentation in real time using advanced AI and computer vision.", align: "right" },
                { step: "03", title: "IMPROVE", desc: "Review your report and know exactly what to work on next. Get question-by-question feedback and actionable recommendations.", align: "left" }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
                  className={`flex flex-col md:flex-row items-center gap-12 ${item.align === 'right' ? 'md:flex-row-reverse' : ''}`}
                >
                  <div className="flex-1">
                    <div className="text-primary-500 font-mono text-sm mb-4">{item.step}</div>
                    <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                    <p className="text-slate-400 text-lg leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <div className="flex-1 w-full">
                    <div className="aspect-video bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-center relative overflow-hidden group">
                      {/* Decorative background glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      {idx === 0 && (
                        <div className="flex flex-col items-center gap-4 text-slate-500">
                          <div className="flex items-center gap-4">
                            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50"><FileText className="w-8 h-8 text-primary-400" /></div>
                            <ChevronRight className="w-6 h-6 text-slate-600" />
                            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50"><Target className="w-8 h-8 text-emerald-400" /></div>
                          </div>
                          <span className="text-sm font-medium">Resume → Targeted Questions</span>
                        </div>
                      )}
                      {idx === 1 && (
                        <div className="flex flex-col items-center gap-4 text-slate-500">
                          <div className="relative">
                            <div className="p-6 bg-slate-800/50 rounded-full border border-slate-700/50 relative z-10"><Video className="w-10 h-10 text-primary-500" /></div>
                            <div className="absolute inset-0 border-2 border-primary-500/30 rounded-full animate-ping"></div>
                          </div>
                          <span className="text-sm font-medium">Real-time AI Analysis</span>
                        </div>
                      )}
                      {idx === 2 && (
                        <div className="flex flex-col items-center gap-4 text-slate-500">
                          <div className="flex items-end gap-2 h-16">
                            <div className="w-4 bg-slate-700 rounded-t-sm h-6"></div>
                            <div className="w-4 bg-slate-700 rounded-t-sm h-10"></div>
                            <div className="w-4 bg-primary-500 rounded-t-sm h-16 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
                          </div>
                          <span className="text-sm font-medium">Actionable Insights</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* REPORT PREVIEW */}
        <section className="py-24 bg-slate-900 border-y border-slate-800 px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Actionable insights. <br /> Measurable progress.</h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                This is one of Intix&apos;s strongest differentiators. Receive a visually impressive report that breaks down your performance, highlights your strengths, and gives you question-by-question feedback.
              </p>
              <ul className="space-y-4">
                {['Overall Score & Breakdown', 'Strengths & Focus Areas', 'Question-by-question analysis', 'Downloadable PDF reports'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-primary-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
              >
                {/* Report Mockup */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                      <div className="text-lg font-bold text-white mb-1">Frontend Developer</div>
                      <div className="text-sm text-slate-400">Interview Report</div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">85%</div>
                      <div className="text-xs text-slate-500 uppercase">Overall Score</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded p-4">
                      <div className="text-xs text-slate-400 mb-2">Answer Quality</div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-primary-500 w-[80%]"></div></div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded p-4">
                      <div className="text-xs text-slate-400 mb-2">Confidence</div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-primary-500 w-[60%]"></div></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-slate-300 mb-2">Key Feedback</div>
                    <div className="bg-slate-900 border border-slate-800 rounded p-4 space-y-2">
                      <div className="text-sm text-slate-300">Strong technical knowledge demonstrated in React hooks.</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded p-4 space-y-2">
                      <div className="text-sm text-slate-300">Work on pacing your speech during complex explanations.</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-32 px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready for your next interview?
            </h2>
            <p className="text-lg text-slate-400 mb-10">
              Practice once. See what needs work. Come back stronger.
            </p>
            <Button
              size="lg"
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
              className="px-8"
            >
              Start Practicing
            </Button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg text-white mb-2">
              <Sparkles className="w-4 h-4 text-primary-500" />
              Intix
            </div>
            <p className="text-slate-500 text-sm">
              Your Personal AI Interview Coach.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4 text-sm">Product</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</a></li>
              <li><a href="/history" className="hover:text-slate-300 transition-colors">History</a></li>
              <li><a href="/resume" className="hover:text-slate-300 transition-colors">Resume</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4 text-sm">Connect</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <a href="https://github.com/Prashanthgoud15" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/in/prashanth-goud-372485294/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="mailto:goudprashanth691@gmail.com" className="hover:text-slate-300 transition-colors">
                  goudprashanth691@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-800 pt-8 text-sm text-slate-600">
          © {new Date().getFullYear()} Intix. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

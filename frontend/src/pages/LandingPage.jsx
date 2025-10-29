import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Brain, 
  Target, 
  TrendingUp, 
  Eye, 
  MessageSquare,
  Sparkles,
  ChevronRight,
  FileText,
  Linkedin,
  Github,
  Mail
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Video className="w-8 h-8" />,
      title: 'Real-Time Computer Vision',
      description: 'Advanced MediaPipe analysis tracks eye contact, posture, and body language',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI-Powered Evaluation',
      description: 'Gemini AI generates questions and provides intelligent feedback on your answers',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Resume-Based Questions',
      description: 'Upload your resume to get personalized questions that progress from basic to advanced',
      color: 'from-amber-500 to-orange-500'
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: 'Speech Analysis',
      description: 'Gemini AI transcribes and analyzes speech pace, clarity, and filler words',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Confidence Scoring',
      description: 'Multi-factor scoring system provides honest, data-driven performance metrics',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Progress Tracking & Reports',
      description: 'Comprehensive performance reports with charts, insights, and detailed session history',
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:px-8">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-accent-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-7xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-semibold text-primary-700">
              AI-Powered Interview Preparation
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="gradient-text">Intix</span>
            <br />
            Your Personal AI Interview Coach
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto"
          >
            Master your interview skills with real-time AI feedback on body language, 
            speech, and content. Get honest, data-driven insights to ace your next interview.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => navigate('/interview')}
              className="btn-primary flex items-center gap-2 text-lg group"
            >
              Start Interview
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/history')}
              className="btn-secondary text-lg"
            >
              View History
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            {[
              { label: 'Accuracy', value: '95%' },
              { label: 'Real-Time Analysis', value: '<500ms' },
              { label: 'Metrics Tracked', value: '15+' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-slate-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 lg:px-8 bg-white/50 backdrop-blur-sm">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="max-w-7xl mx-auto"
        >
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Powerful Features for
              <span className="gradient-text"> Interview Success</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Comprehensive AI analysis that covers every aspect of your interview performance
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="card group cursor-pointer"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-800">
                  {feature.title}
                </h3>
                <p className="text-slate-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 py-20 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            How It <span className="gradient-text">Works</span>
          </h2>

          <div className="space-y-12">
            {[
              {
                step: '01',
                title: 'Upload Your Resume (Optional)',
                description: 'Upload your resume to get personalized questions based on YOUR projects, skills, and experience. Questions progress from basic to advanced!',
                color: 'from-amber-500 to-orange-500'
              },
              {
                step: '02',
                title: 'Start Your Session',
                description: 'Grant camera and microphone access. Gemini AI will guide you through the interview with tailored questions.',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                step: '03',
                title: 'Answer AI Questions',
                description: 'Respond to dynamically generated questions. Gemini AI analyzes your speech while MediaPipe tracks your body language.',
                color: 'from-purple-500 to-pink-500'
              },
              {
                step: '04',
                title: 'Get Real-Time Feedback',
                description: 'Watch your confidence score update live as our AI analyzes your performance in real-time.',
                color: 'from-green-500 to-emerald-500'
              },
              {
                step: '05',
                title: 'Review Your Report',
                description: 'Receive a comprehensive report with detailed metrics, insights, and personalized recommendations for improvement.',
                color: 'from-red-500 to-pink-500'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex items-start gap-6"
              >
                <div className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2 text-slate-800">
                    {item.title}
                  </h3>
                  <p className="text-lg text-slate-600">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 lg:px-8 bg-gradient-to-br from-primary-600 to-accent-600 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start practicing now and get instant, actionable feedback from our AI coach.
          </p>
          <button
            onClick={() => navigate('/interview')}
            className="bg-white text-primary-700 px-8 py-4 rounded-lg font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
          >
            Begin Your First Interview
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-2xl font-bold mb-2">
                <span className="gradient-text">Intix</span>
              </h3>
              <p className="text-slate-400 text-sm">
                Your Personal AI Interview Coach
              </p>
              <p className="text-slate-500 text-xs mt-2">
                Powered by Gemini AI, MediaPipe & React
              </p>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Real-time Computer Vision</li>
                <li>• Resume-Based Questions</li>
                <li>• Speech Analysis</li>
                <li>• Performance Reports</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Connect</h4>
              <div className="space-y-3">
                <a
                  href="https://www.linkedin.com/in/prashanth-goud-372485294/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                  <span className="text-sm">LinkedIn</span>
                </a>
                <a
                  href="https://github.com/Prashanthgoud15"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 hover:text-purple-400 transition-colors"
                >
                  <Github className="w-5 h-5" />
                  <span className="text-sm">GitHub</span>
                </a>
                <a
                  href="mailto:goudprashanth691@gmail.com"
                  className="flex items-center gap-2 text-slate-400 hover:text-green-400 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <span className="text-sm">goudprashanth691@gmail.com</span>
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-slate-800 pt-6 text-center">
            <p className="text-slate-500 text-sm">
              © 2025 Intix — Your Personal AI Interview Coach. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

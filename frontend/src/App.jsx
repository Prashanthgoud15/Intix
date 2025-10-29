import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import InterviewDashboard from './pages/InterviewDashboard';
import ReportPage from './pages/ReportPage';
import HistoryPage from './pages/HistoryPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/interview" element={<InterviewDashboard />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

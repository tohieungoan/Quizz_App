import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './layouts/Header';
import { Footer } from './layouts/Footer';
import { LandingPage } from './pages/User/LandingPage/LandingPage';
import { AboutUs } from './pages/User/AboutUs/AboutUs';
import { Feedback } from './pages/User/Feedback/Feedback';
import { AuthPage } from './pages/User/AuthPage/AuthPage';
import { Dashboard } from './pages/User/Dashboard/Dashboard';
import { NotFoundPage } from './pages/User/NotFoundPage/NotFoundPage';
import { LobbyWaiting } from './pages/User/LobbyWaiting/LobbyWaiting';
import { FormalExam } from './pages/User/FormalExam/FormalExam';
import { ParticipantAnswer } from './pages/User/ParticipantAnswer/ParticipantAnswer';
import { LiveLeaderboard } from './pages/User/LiveLeaderboard/LiveLeaderboard';
import { PowerUpSelection } from './pages/User/PowerUpSelection/PowerUpSelection';
import { HostLiveReview } from './pages/User/HostLiveReview/HostLiveReview';
import { QuizCreator } from './pages/Admin/QuizCreator/QuizCreator';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './pages/Admin/AdminDashboard/AdminDashboard';
import { Quizzes } from './pages/Admin/Quizzes/Quizzes';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthRoute =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname === '/lobby' ||
    location.pathname === '/exam' ||
    location.pathname === '/play' ||
    location.pathname === '/leaderboard' ||
    location.pathname === '/powerups' ||
    location.pathname === '/create-quiz' ||
    location.pathname === '/host-panel' ||
    location.pathname.startsWith('/admin');

  const handleGetStarted = () => {
    navigate('/register');
  };

  // Auth/Game/Admin routes render without Header & Footer
  if (isAuthRoute) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/create-quiz"
          element={
            <QuizCreator
              onCancel={() => {
                const returnTab = sessionStorage.getItem('dashboard_active_tab') || 'host_studio';
                navigate('/dashboard', { state: { activeTab: returnTab } });
              }}
            />
          }
        />
        <Route path="/lobby" element={<LobbyWaiting />} />
        <Route path="/exam" element={<FormalExam />} />
        <Route path="/play" element={<ParticipantAnswer />} />
        <Route path="/leaderboard" element={<LiveLeaderboard />} />
        <Route path="/powerups" element={<PowerUpSelection />} />
        <Route path="/host-panel" element={<HostLiveReview />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="quizzes" element={<Quizzes onCreateQuiz={() => navigate('/admin/quizzes/create')} onEditQuiz={(quiz) => navigate(`/admin/quizzes/edit/${quiz.id}`)} />} />
          <Route path="quizzes/create" element={<QuizCreator onCancel={() => navigate('/admin/quizzes')} />} />
          <Route path="quizzes/edit/:id" element={<QuizCreator onCancel={() => navigate('/admin/quizzes')} />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    );
  }

  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col">
      <Header onGetStartedClick={handleGetStarted} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;

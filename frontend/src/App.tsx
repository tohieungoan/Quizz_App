import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './layouts/Header';
import { Footer } from './layouts/Footer';
import { AdminLayout } from './layouts/AdminLayout';
import {
  LandingPage,
  AboutUs,
  Feedback,
  AuthPage,
  Dashboard,
  NotFoundPage,
  LobbyWaiting,
  FormalExam,
  ParticipantAnswer,
  LiveLeaderboard,
  PowerUpSelection,
  HostLiveReview,
} from './pages/User';
import {
  AdminDashboard,
  Quizzes,
  QuizCreator,
  Users,
  Reports,
  Rooms,
  Notifications,
  Settings,
} from './pages/Admin';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthRoute =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname === '/create-quiz' ||
    location.pathname === '/lobby' ||
    location.pathname === '/exam' ||
    location.pathname === '/play' ||
    location.pathname === '/leaderboard' ||
    location.pathname === '/powerups' ||
    location.pathname === '/host-panel' ||
    location.pathname.startsWith('/admin');

  const handleGetStarted = () => {
    navigate('/register');
  };

  // Auth/Game routes render without Header & Footer
  if (isAuthRoute) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-quiz" element={<QuizCreator onCancel={() => navigate('/dashboard')} />} />
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
          <Route path="rooms" element={<Rooms onNavigate={() => {}} />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/:id" element={<Reports />} />
          <Route path="users" element={<Users />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
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

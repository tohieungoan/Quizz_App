import React from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Header } from './layouts/Header';
import { Footer } from './layouts/Footer';
import { LandingPage } from './pages/User/LandingPage/LandingPage';
import { AboutUs } from './pages/User/AboutUs/AboutUs';
import { Feedback } from './pages/User/Feedback/Feedback';
import { AuthPage } from './pages/User/AuthPage/AuthPage';
import { ResetPasswordPage } from './pages/User/ResetPasswordPage/ResetPasswordPage';
import { VerifyEmailPage } from './pages/User/VerifyEmailPage/VerifyEmailPage';
import { VerifyNotificationEmailPage } from './pages/User/VerifyNotificationEmailPage/VerifyNotificationEmailPage';
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
import { Rooms } from './pages/Admin/Rooms/Rooms';
import { Reports } from './pages/Admin/Reports/Reports';
import { Users } from './pages/Admin/Users/Users';
import { Notifications } from './pages/Admin/Notifications/Notifications';
import { Settings } from './pages/Admin/Settings/Settings';
import { Achievements } from './pages/Admin/Achievements/Achievements';
import { Broadcast } from './pages/Admin/Broadcast/Broadcast';
import { Profile } from './pages/User/Profile/Profile';
import { useAuth } from './hooks/useAuth';
import { GraduationCap } from 'lucide-react';
import { startNewQuizDraftSession } from './utils/quizDraftSession';

/**
 * Route classification:
 * - PUBLIC_ONLY:  Accessible only when NOT logged in (logged in -> redirect to /dashboard)
 * - PROTECTED:    Authentication required (unauthenticated -> redirect to /login)
 * - PUBLIC_OPEN:  Open to everyone: /, /about, /feedback, /register
 */
const PUBLIC_ONLY_ROUTES = ['/login', '/register'];

const PROTECTED_ROUTES = [
  '/dashboard', '/create-quiz', '/host-panel', '/admin',
];

const GAME_ROUTES = [
  '/lobby', '/exam', '/play', '/leaderboard', '/powerups',
];

// Routes without Header/Footer (except public pages with header)
const NO_LAYOUT_ROUTES = [
  '/login', '/register', '/reset-password', '/verify-email', '/verify-notification-email',
  ...PROTECTED_ROUTES,
  ...GAME_ROUTES,
];

const matchesRoute = (pathname: string, routes: string[]) =>
  routes.some((r) => pathname === r || pathname.startsWith(r + '/'));

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { status } = useAuth();

  const isNoLayout = matchesRoute(location.pathname, NO_LAYOUT_ROUTES);
  const isProtected = matchesRoute(location.pathname, PROTECTED_ROUTES);
  const isPublicOnly = matchesRoute(location.pathname, PUBLIC_ONLY_ROUTES);

  // ── Splash loading — verifying session ──────────────────────────────
  if (status === 'loading') {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#f9f9ff]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse">
            <GraduationCap className="w-10 h-10 text-on-primary" />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">QuizzApp</h2>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" />
          </div>
          <span className="text-xs text-outline font-bold mt-2">Restoring session...</span>
        </div>
      </div>
    );
  }

  // ── Guard: logged in visiting public-only (/login) -> Dashboard ──────
  if (status === 'authenticated' && isPublicOnly) {
    return <Navigate to="/dashboard" replace />;
  }

  // ── Guard: logged in visiting public pages (/, /about...) -> Dashboard ─────
  if (status === 'authenticated' && !isNoLayout) {
    return <Navigate to="/dashboard" replace />;
  }

  // ── Guard: unauthenticated visiting protected route -> /login ──────────────────
  if (status === 'unauthenticated' && isProtected) {
    return <Navigate to="/login" replace />;
  }

  // ── Guard: authenticated non-admin visiting /admin -> /dashboard ──────────────
  if (status === 'authenticated' && matchesRoute(location.pathname, ['/admin'])) {
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
    if (!isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // ── Guard: visiting /play without prior room participation ──────────
  if (matchesRoute(location.pathname, ['/play'])) {
    const hasRoomCode =
      (location.state as any)?.roomCode ||
      sessionStorage.getItem('play_room_code');
    if (!hasRoomCode) {
      if (status === 'authenticated') {
        return <Navigate to="/dashboard" replace />;
      } else {
        return <Navigate to="/" replace />;
      }
    }
  }

  const handleGetStarted = () => navigate('/register');

  // ── Routes without Header/Footer (auth / game / admin) ─────────────────
  if (isNoLayout) {
    return (
      <Routes>
        {/* Auth — public */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/verify-notification-email" element={<VerifyNotificationEmailPage />} />

        {/* Protected — authentication required */}
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
        <Route
          path="/create-quiz/:id"
          element={
            <QuizCreator
              onCancel={() => {
                const returnTab = sessionStorage.getItem('dashboard_active_tab') || 'host_studio';
                navigate('/dashboard', { state: { activeTab: returnTab } });
              }}
            />
          }
        />
const LobbyWaitingWrapper = () => {
  const location = useLocation()
  const key = (location.state as any)?.roomCode || location.search || 'lobby'
  return <LobbyWaiting key={key} />
}

        <Route path="/lobby" element={<LobbyWaitingWrapper />} />
        <Route path="/exam" element={<FormalExam />} />
        <Route path="/exam/:examId" element={<FormalExam />} />
        <Route path="/play" element={<ParticipantAnswer />} />
        <Route path="/leaderboard" element={<LiveLeaderboard />} />
        <Route path="/powerups" element={<PowerUpSelection />} />
        <Route path="/host-panel" element={<HostLiveReview />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="quizzes" element={<Quizzes onCreateQuiz={() => { startNewQuizDraftSession(); navigate('/admin/quizzes/create'); }} onEditQuiz={(quiz) => navigate(`/admin/quizzes/edit/${quiz.id}`)} />} />
          <Route path="quizzes/create" element={<QuizCreator onCancel={() => navigate('/admin/quizzes')} />} />
          <Route path="quizzes/edit/:id" element={<QuizCreator onCancel={() => navigate('/admin/quizzes')} />} />
          <Route path="rooms" element={<Rooms onNavigate={() => {}} />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/:id" element={<Reports />} />
          <Route path="users" element={<Users />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="achievements" element={<Achievements />} />
          <Route path="broadcast" element={<Broadcast />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    );
  }

  // ── Public routes — with Header & Footer (/, /about, /feedback, /register) ─
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

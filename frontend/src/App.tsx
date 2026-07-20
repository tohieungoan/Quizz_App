import React from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Header } from './layouts/Header'
import { Footer } from './layouts/Footer'
import { LandingPage } from './pages/LandingPage'
import { AboutUs } from './pages/AboutUs'
import { Feedback } from './pages/Feedback'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'
import { AdminDashboard } from './pages/AdminDashboard'
import { NotFoundPage } from './pages/NotFoundPage'
import { LobbyWaiting } from './pages/LobbyWaiting'
import { FormalExam } from './pages/FormalExam'
import { ParticipantAnswer } from './pages/ParticipantAnswer'
import { LiveLeaderboard } from './pages/LiveLeaderboard'
import { PowerUpSelection } from './pages/PowerUpSelection'
import { HostLiveReview } from './pages/HostLiveReview'
import { AdminLayout } from './layouts/AdminLayout'
import { Quizzes } from './pages/Quizzes'
import { QuizCreator } from './pages/QuizCreator'
import { Users } from './pages/Users'
import { Reports } from './pages/Reports'
import { Rooms } from './pages/Rooms'
import { Notifications } from './pages/Notifications'
import { Settings } from './pages/Settings'
const App: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const isAuthRoute = 
    location.pathname === '/login' || 
    location.pathname === '/register' || 
    location.pathname.startsWith('/dashboard') || 
    location.pathname === '/lobby' || 
    location.pathname === '/exam' ||
    location.pathname === '/play' ||
    location.pathname === '/leaderboard' ||
    location.pathname === '/powerups' ||
    location.pathname === '/host-panel' ||
    location.pathname.startsWith('/admin')

  const handleGetStarted = () => {
    navigate('/register')
  }

  // Auth/Game routes render without Header & Footer
  if (isAuthRoute) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lobby" element={<LobbyWaiting />} />
        <Route path="/exam" element={<FormalExam />} />
        <Route path="/play" element={<ParticipantAnswer />} />
        <Route path="/leaderboard" element={<LiveLeaderboard />} />
        <Route path="/powerups" element={<PowerUpSelection />} />
        <Route path="/host-panel" element={<HostLiveReview />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="quizzes" element={<Quizzes onCreateQuiz={() => {}} onEditQuiz={() => {}} />} />
          <Route path="quizzes/create" element={<QuizCreator onCancel={() => {}} />} />
          <Route path="quizzes/edit/:id" element={<QuizCreator onCancel={() => {}} />} />
          <Route path="rooms" element={<Rooms onNavigate={() => {}} />} />
          <Route path="reports" element={<Reports context={null} onNavigate={() => {}} />} />
          <Route path="users" element={<Users />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    )
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
  )
}

export default App

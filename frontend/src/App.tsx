import React from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Header } from './layouts/Header'
import { Footer } from './layouts/Footer'
import { LandingPage } from './pages/LandingPage'
import { AboutUs } from './pages/AboutUs'
import { Feedback } from './pages/Feedback'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'

const App: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register' || location.pathname.startsWith('/dashboard')

  const handleGetStarted = () => {
    navigate('/register')
  }

  // Auth routes render without Header & Footer
  if (isAuthRoute) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
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
      </Routes>
      <Footer />
    </div>
  )
}

export default App

import React from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Header } from './layouts/Header'
import { Footer } from './layouts/Footer'
import { LandingPage } from './pages/LandingPage'
import { AboutUs } from './pages/AboutUs'
import { Feedback } from './pages/Feedback'
import { AuthPage } from './pages/AuthPage'

const App: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register'

  const handleGetStarted = () => {
    const scrollAndFocus = () => {
      const formElement = document.getElementById('joinGameForm')
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' })
        const roomCodeInput = document.getElementById('roomCode')
        if (roomCodeInput) {
          roomCodeInput.focus()
        }
      }
    }

    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(scrollAndFocus, 100)
    } else {
      scrollAndFocus()
    }
  }

  // Auth routes render without Header & Footer
  if (isAuthRoute) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
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

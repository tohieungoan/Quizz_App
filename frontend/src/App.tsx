import React from 'react'
import { Header } from './layouts/Header'
import { Footer } from './layouts/Footer'
import { LandingPage } from './pages/LandingPage'

const App: React.FC = () => {
  const handleGetStarted = () => {
    // Cuộn tới khung Join Game hoặc thực hiện hành động chuyển trang
    const formElement = document.getElementById('joinGameForm')
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' })
      const roomCodeInput = document.getElementById('roomCode')
      if (roomCodeInput) {
        roomCodeInput.focus()
      }
    }
  }

  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col">
      <Header onGetStartedClick={handleGetStarted} />
      <LandingPage />
      <Footer />
    </div>
  )
}

export default App

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { AuthProvider } from './store/AuthContext'
import { AIQuizProvider } from './contexts/AIQuizContext'
import { Toaster } from 'react-hot-toast'
import { initSecurityGuard } from './utils/securityGuard'
import { initTimeTracker } from './utils/streakTracker'

// Initialize Anti-F12, Anti-DevTools & Right-Click protection globally
initSecurityGuard()
// Initialize 10-minute web session activity tracker globally
initTimeTracker()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AIQuizProvider>
          <App />
          <Toaster position="top-right" />
        </AIQuizProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
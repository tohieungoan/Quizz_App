import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { GraduationCap, Menu, X } from 'lucide-react'

interface HeaderProps {
  onGetStartedClick?: () => void
}

export const Header: React.FC<HeaderProps> = ({ onGetStartedClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-outline-variant/10">
      <div className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        {/* Brand Logo */}
        <NavLink to="/" className="flex items-center gap-3 group tracking-tight select-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-200">
            <GraduationCap className="w-5.5 h-5.5 text-white" />
          </div>
          <span className="font-headline-md text-headline-md font-extrabold text-on-surface">QuizzApp</span>
        </NavLink>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => 
              `font-body-md text-body-md transition-colors duration-200 ${
                isActive 
                  ? 'text-primary font-bold border-b-2 border-primary pb-1' 
                  : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            Features
          </NavLink>
          <NavLink 
            to="/about" 
            className={({ isActive }) => 
              `font-body-md text-body-md transition-colors duration-200 ${
                isActive 
                  ? 'text-primary font-bold border-b-2 border-primary pb-1' 
                  : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            About Us
          </NavLink>
          <NavLink 
            to="/feedback" 
            className={({ isActive }) => 
              `font-body-md text-body-md transition-colors duration-200 ${
                isActive 
                  ? 'text-primary font-bold border-b-2 border-primary pb-1' 
                  : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            Feedback
          </NavLink>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-base">
          {/* Get Started Button */}
          <button 
            onClick={onGetStartedClick}
            className="hidden md:block font-button text-button bg-secondary text-on-secondary rounded-xl px-6 py-3 shadow-md hover:shadow-premium hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
          >
            Get Started
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-primary hover:bg-primary-container/10 rounded-xl transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-outline-variant/20 py-6 px-margin-mobile flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-5 duration-200 z-50">
          <NavLink
            to="/"
            end
            onClick={() => setIsMenuOpen(false)}
            className={({ isActive }) =>
              `font-body-md text-body-md transition-colors py-2 border-b border-outline-variant/10 ${
                isActive ? 'text-primary font-bold' : 'text-on-surface-variant'
              }`
            }
          >
            Features
          </NavLink>
          <NavLink
            to="/about"
            onClick={() => setIsMenuOpen(false)}
            className={({ isActive }) =>
              `font-body-md text-body-md transition-colors py-2 border-b border-outline-variant/10 ${
                isActive ? 'text-primary font-bold' : 'text-on-surface-variant'
              }`
            }
          >
            About Us
          </NavLink>
          <NavLink
            to="/feedback"
            onClick={() => setIsMenuOpen(false)}
            className={({ isActive }) =>
              `font-body-md text-body-md transition-colors py-2 border-b border-outline-variant/10 ${
                isActive ? 'text-primary font-bold' : 'text-on-surface-variant'
              }`
            }
          >
            Feedback
          </NavLink>
          <button
            onClick={() => {
              setIsMenuOpen(false)
              if (onGetStartedClick) onGetStartedClick()
            }}
            className="font-button text-button bg-secondary text-on-secondary rounded-xl px-6 py-3.5 shadow-md hover:shadow-premium transition-all active:scale-95 text-center mt-2 w-full"
          >
            Get Started
          </button>
        </div>
      )}
    </header>
  )
}

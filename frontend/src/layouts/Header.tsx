import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Gamepad2, Menu, X } from 'lucide-react'

interface HeaderProps {
  onGetStartedClick?: () => void
}

export const Header: React.FC<HeaderProps> = ({ onGetStartedClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-sm border-none">
      <div className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="flex items-center">
          <NavLink to="/" className="flex items-center gap-2 font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed tracking-tight">
            <Gamepad2 className="w-8 h-8 text-primary" />
            <span>QuizzApp</span>
          </NavLink>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => 
              `font-body-md text-body-md transition-colors ${
                isActive 
                  ? 'text-primary dark:text-primary-fixed font-bold border-b-2 border-primary pb-1' 
                  : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            Features
          </NavLink>
          <NavLink 
            to="/about" 
            className={({ isActive }) => 
              `font-body-md text-body-md transition-colors ${
                isActive 
                  ? 'text-primary dark:text-primary-fixed font-bold border-b-2 border-primary pb-1' 
                  : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            About Us
          </NavLink>
          <NavLink 
            to="/feedback" 
            className={({ isActive }) => 
              `font-body-md text-body-md transition-colors ${
                isActive 
                  ? 'text-primary dark:text-primary-fixed font-bold border-b-2 border-primary pb-1' 
                  : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            Feedback
          </NavLink>
        </nav>

        <div className="flex items-center gap-base md:gap-gutter">
          {/* Desktop Get Started Button */}
          <button 
            onClick={onGetStartedClick}
            className="hidden md:block font-button text-button bg-primary text-on-primary rounded-full px-6 py-3 shadow-level-1 hover:shadow-level-2 hover:-translate-y-1 transition-all active:scale-95"
          >
            Get Started
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-primary hover:bg-primary-container/20 rounded-full transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-surface border-b border-outline-variant/30 py-6 px-margin-mobile flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-5 duration-200">
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
            className="font-button text-button bg-primary text-on-primary rounded-full px-6 py-4 shadow-level-1 hover:shadow-level-2 transition-all active:scale-95 text-center mt-2 w-full"
          >
            Get Started
          </button>
        </div>
      )}
    </header>
  )
}

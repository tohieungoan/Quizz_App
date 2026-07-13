import React from 'react'

interface HeaderProps {
  onGetStartedClick?: () => void
}

export const Header: React.FC<HeaderProps> = ({ onGetStartedClick }) => {
  return (
    <nav className="sticky top-0 w-full z-50 bg-surface/80 dark:bg-surface/80 backdrop-blur-md shadow-sm border-none">
      <div className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="flex items-center">
          <a className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed tracking-tight" href="#">
            QuizzApp
          </a>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a className="font-body-md text-body-md text-primary dark:text-primary-fixed font-bold border-b-2 border-primary pb-1" href="#">
            Features
          </a>
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">
            About Us
          </a>
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">
            Feedback
          </a>
        </div>
        <div className="flex items-center gap-base md:gap-gutter">
          <button 
            onClick={onGetStartedClick}
            className="font-button text-button bg-primary-container text-on-primary rounded-full px-6 py-3 custom-shadow-level-1 hover:custom-shadow-level-2 hover:-translate-y-1 transition-all active:scale-95"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  )
}

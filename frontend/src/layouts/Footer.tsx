import React from 'react'

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-12 bg-surface-container-lowest dark:bg-on-background border-t border-outline-variant/30 dark:border-outline/20">
      <div className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto gap-base">
        <div className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed mb-4 md:mb-0">
          QuizzApp
        </div>
        <div className="font-label-bold text-label-bold text-on-surface-variant dark:text-outline-variant flex flex-col md:flex-row gap-4 items-center">
          <span>© 2026 QuizzApp. All rights reserved.</span>
          <div className="hidden md:block w-1 h-1 rounded-full bg-outline-variant"></div>
          <a className="hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">
            Privacy Policy
          </a>
          <div className="hidden md:block w-1 h-1 rounded-full bg-outline-variant"></div>
          <a className="hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">
            Terms of Service
          </a>
          <div className="hidden md:block w-1 h-1 rounded-full bg-outline-variant"></div>
          <a className="hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">
            Contact Support
          </a>
        </div>
      </div>
    </footer>
  )
}

import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50'
  
  const variants = {
    primary: 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.2)]',
    secondary: 'bg-slate-800 text-white hover:bg-slate-750 border border-slate-700',
    outline: 'bg-transparent border-2 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  }

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

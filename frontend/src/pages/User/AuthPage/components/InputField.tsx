import React from 'react'

interface InputFieldProps {
  id: string
  type?: string
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  icon?: React.ReactNode
  rightElement?: React.ReactNode
  autoComplete?: string
}

export const InputField: React.FC<InputFieldProps> = ({
  id, type = 'text', label, value, onChange,
  error, icon, rightElement, autoComplete,
}) => (
  <div className="flex flex-col gap-1 w-full animate-in fade-in duration-200">
    <div className={`relative flex items-center rounded-xl border-2 transition-all duration-200 bg-surface-container-low/50 ${
      error
        ? 'border-error'
        : value
        ? 'border-primary'
        : 'border-outline-variant focus-within:border-primary'
    }`}>
      {icon && (
        <span className={`absolute left-4 w-5 h-5 flex-shrink-0 transition-colors ${
          value ? 'text-primary' : 'text-outline'
        }`}>
          {icon}
        </span>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder=" "
        className={`peer w-full bg-transparent py-4 text-on-surface font-body-md text-body-md focus:outline-none rounded-xl ${
          icon ? 'pl-12 pr-12' : 'px-4'
        }`}
      />
      <label
        htmlFor={id}
        className={`absolute pointer-events-none transition-all duration-200 text-outline font-body-md
          ${icon ? 'left-12' : 'left-4'}
          peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base
          peer-focus:top-1 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-primary
          ${value ? 'top-1 translate-y-0 text-xs text-primary' : ''}`}
      >
        {label}
      </label>
      {rightElement && (
        <span className="absolute right-4 flex-shrink-0">
          {rightElement}
        </span>
      )}
    </div>
    {error && (
      <span className="text-error text-sm font-body-md flex items-center gap-1 pl-1">
        {error}
      </span>
    )}
  </div>
)

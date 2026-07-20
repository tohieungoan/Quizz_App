import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[] | string[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  menuClassName?: string;
}

export function Dropdown({ value, onChange, options, placeholder, icon, className = '', menuClassName = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const formattedOptions = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = formattedOptions.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-4 py-2.5 rounded-lg border border-outline-variant/50 bg-white text-on-surface hover:border-primary transition-all text-sm shadow-sm font-medium w-full min-w-[160px] ${className} ${isOpen ? 'ring-2 ring-primary/20 border-primary' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-on-surface-variant shrink-0 flex items-center">{icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder || 'Select...'}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform shrink-0 ml-3 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-1.5 w-full min-w-[180px] rounded-xl bg-white shadow-lg border border-outline-variant/30 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200 ${menuClassName}`}>
          <ul className="max-h-60 overflow-auto">
            {formattedOptions.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value}>
                  <button
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                      isSelected ? 'bg-primary/5 text-primary font-bold' : 'text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

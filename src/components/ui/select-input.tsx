'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectInputProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export default function SelectInput({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  label,
  disabled = false,
  error,
  className = '',
}: SelectInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-bold text-[#7A6E6D]">
          {label}
        </label>
      )}
      
      <div ref={selectRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            flex w-full items-center justify-between rounded-lg border
            bg-white py-2 px-3 text-sm text-stone-800
            outline-none transition-all
            ${error ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-stone-200 focus:border-[#541919]/60 focus:ring-1 focus:ring-[#541919]/60'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            shadow-[0_2px_8px_rgba(0,0,0,0.01)]
          `}
        >
          <span className={selectedOption ? 'text-stone-800' : 'text-stone-400'}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown
            size={18}
            className={`text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-stone-200 bg-white shadow-lg shadow-stone-200/50">
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    flex w-full items-center justify-between px-3 py-2 text-sm transition-colors
                    ${value === option.value ? 'bg-[#541919]/5 text-[#541919] font-bold' : 'text-stone-700 hover:bg-stone-50'}
                  `}
                >
                  <span>{option.label}</span>
                  {value === option.value && (
                    <Check size={16} className="text-[#541919]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs font-semibold text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

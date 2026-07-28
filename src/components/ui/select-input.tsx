'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

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
  /** Si se pasa, aparece un buscador en el dropdown que llama a esta función con debounce de 500ms */
  onSearch?: (query: string) => void;
  /** Muestra un spinner mientras se cargan resultados de búsqueda */
  isSearching?: boolean;
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
  onSearch,
  isSearching = false,
}: SelectInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Enfocar el buscador al abrir
  useEffect(() => {
    if (isOpen && onSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, onSearch]);

  // Debounce de 500ms para la búsqueda
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearch?.(query);
      }, 500);
    },
    [onSearch]
  );

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
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

            {/* Buscador (solo si se pasa onSearch) */}
            {onSearch && (
              <div className="px-2 pt-2 pb-1 border-b border-stone-100">
                <div className="relative flex items-center">
                  <Search size={14} className="absolute left-2.5 text-stone-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Buscar cliente..."
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-3 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-[#541919]/60 focus:ring-1 focus:ring-[#541919]/60 transition-all"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {isSearching && (
                    <div className="absolute right-2.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#541919]/30 border-t-[#541919]" />
                  )}
                </div>
              </div>
            )}

            <div className="max-h-52 overflow-y-auto py-1">
              {options.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-stone-400">
                  {searchQuery ? 'Sin resultados para tu búsqueda.' : 'No hay opciones disponibles.'}
                </p>
              ) : (
                options.map((option) => (
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
                ))
              )}
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

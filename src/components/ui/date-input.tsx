'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DateInputProps {
  value?: Date | string;
  onChange?: (date: Date) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function DateInput({
  value,
  onChange,
  label,
  placeholder = 'Seleccionar fecha',
  disabled = false,
  error,
  className = '',
}: DateInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = useMemo(() => {
    if (!value) return null;
    const parsed = typeof value === 'string' ? new Date(value) : value;
    return isNaN(parsed.getTime()) ? null : parsed;
  }, [value]);

  const [viewDate, setViewDate] = useState<Date>(() => selectedDate || new Date());

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const monthYearLabel = useMemo(() => {
    const raw = viewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [viewDate]);

  const formattedInputValue = useMemo(() => {
    if (!selectedDate) return '';
    return selectedDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, [selectedDate]);

  const calendarGrid = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const grid = [];

    // Días del mes anterior
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      grid.push({
        day: daysInPrevMonth - i,
        month: viewMonth - 1,
        year: viewYear,
        isCurrentMonth: false,
      });
    }

    // Días del mes actual
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      grid.push({
        day: i,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
      });
    }

    // Días del mes siguiente (para completar la cuadrícula de 35 o 42 celdas)
    const totalCells = grid.length > 35 ? 42 : 35;
    const remainingCells = totalCells - grid.length;
    for (let i = 1; i <= remainingCells; i++) {
      grid.push({
        day: i,
        month: viewMonth + 1,
        year: viewYear,
        isCurrentMonth: false,
      });
    }

    return grid;
  }, [viewYear, viewMonth]);

  const handleSelectDay = (cell: { day: number; month: number; year: number }) => {
    const newDate = new Date(cell.year, cell.month, cell.day);
    onChange?.(newDate);
    setIsOpen(false);
  };

  const isSelected = (cell: { day: number; month: number; year: number }) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === cell.day &&
      selectedDate.getMonth() === cell.month &&
      selectedDate.getFullYear() === cell.year
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-bold text-[#7A6E6D]">
          {label}
        </label>
      )}

      <div ref={containerRef} className="relative">
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
          <span className={formattedInputValue ? 'text-stone-800 font-medium' : 'text-stone-400'}>
            {formattedInputValue || placeholder}
          </span>
          <CalendarIcon size={18} className="text-stone-400" />
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-2 w-[320px] rounded-3xl border border-pink-100/80 bg-white p-5 shadow-2xl shadow-stone-300/40 select-none">
            {/* Cabecera del calendario */}
            <div className="flex items-center justify-between mb-6 px-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-full text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h4 className="text-lg font-bold text-[#201515]">
                {monthYearLabel}
              </h4>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-full text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 text-center mb-3 text-sm font-medium text-[#5a4e4e]">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Cuadrícula de días */}
            <div className="grid grid-cols-7 gap-y-2 text-center text-base">
              {calendarGrid.map((cell, idx) => {
                const selected = isSelected(cell);
                return (
                  <div key={idx} className="flex flex-col items-center justify-center relative">
                    {selected && (
                      <span className="absolute -top-1 w-1 h-1 rounded-full bg-[#581C1C]" />
                    )}
                    <button
                      type="button"
                      onClick={() => handleSelectDay(cell)}
                      className={`
                        w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all
                        ${
                          selected
                            ? 'bg-[#581C1C] text-white font-bold shadow-md ring-4 ring-[#581C1C]/20'
                            : cell.isCurrentMonth
                            ? 'text-[#201515] hover:bg-stone-100'
                            : 'text-stone-300 hover:text-stone-400'
                        }
                      `}
                    >
                      {cell.day}
                    </button>
                  </div>
                );
              })}
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

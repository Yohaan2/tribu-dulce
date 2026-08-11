'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 4) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, '...', totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, '...', totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = '',
}: PaginationProps) {
  if (totalItems === 0) return null;

  const from = (currentPage - 1) * itemsPerPage + 1;
  const to = Math.min(currentPage * itemsPerPage, totalItems);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-4 ${className}`}>
      {/* Texto Informativo */}
      <p className="text-sm font-medium text-slate-700">
        Mostrando {from}-{to} de {totalItems}
      </p>

      {/* Botones de Navegación */}
      <div className="flex items-center justify-center gap-2">
        {/* Botón Anterior */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200/90 bg-stone-50/60 text-stone-700 transition-all hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-stone-50/60 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Números de Página */}
        {pageNumbers.map((page, index) => {
          if (typeof page === 'string') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex h-10 w-8 items-center justify-center text-sm font-semibold text-stone-400 select-none"
              >
                {page}
              </span>
            );
          }

          const isActive = page === currentPage;

          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-bold transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-stone-200/90 bg-stone-50/60 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {page}
            </button>
          );
        })}

        {/* Botón Siguiente */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Página siguiente"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200/90 bg-stone-50/60 text-stone-700 transition-all hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-stone-50/60 disabled:cursor-not-allowed"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

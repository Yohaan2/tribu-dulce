'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAudit } from '@/hooks/useAudit';
import Pagination from '@/components/ui/pagination';
import DateInput from '@/components/ui/date-input';
import { ClipboardList, User, Clock, ChevronDown, ChevronUp, Filter, X, Calendar } from 'lucide-react';

function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AuditPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const limit = 100;
  const { logs, total, totalPages, isLoading, error } = useAudit(
    currentPage,
    limit,
    startDate || undefined,
    endDate || undefined
  );

  const todayStr = formatDateToYYYYMMDD(new Date());
  const isTodaySelected = startDate === todayStr && endDate === todayStr;
  const hasActiveFilters = Boolean(startDate || endDate);

  const handleSelectToday = () => {
    setStartDate(todayStr);
    setEndDate(todayStr);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <MainLayout title="Auditoría">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Barra de Filtros */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  hasActiveFilters || showFilters
                    ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Filter size={15} />
                <span>Filtrar por fecha</span>
                {hasActiveFilters && (
                  <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
                )}
              </button>

              <button
                type="button"
                onClick={handleSelectToday}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isTodaySelected
                    ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Calendar size={15} />
                <span>Hoy</span>
              </button>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-100 transition-colors"
              >
                <X size={14} />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>

          {/* Panel Desplegable de Filtros */}
          {showFilters && (
            <div className="flex flex-wrap items-end gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm animate-fade-in">
              <DateInput
                label="Desde"
                placeholder="Seleccionar fecha inicial"
                value={startDate ? new Date(`${startDate}T00:00:00`) : undefined}
                onChange={(date) => {
                  setStartDate(formatDateToYYYYMMDD(date));
                  setCurrentPage(1);
                }}
                className="w-52"
              />

              <DateInput
                label="Hasta"
                placeholder="Seleccionar fecha final"
                value={endDate ? new Date(`${endDate}T00:00:00`) : undefined}
                onChange={(date) => {
                  setEndDate(formatDateToYYYYMMDD(date));
                  setCurrentPage(1);
                }}
                className="w-52"
              />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex h-60 items-center justify-center text-sm text-slate-400">
            Cargando registro de auditoría...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {error.message}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-60 flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <ClipboardList size={40} className="mb-2 stroke-[1.5] text-slate-300" />
            <p className="text-sm">
              {hasActiveFilters
                ? 'No se encontraron registros de auditoría para las fechas seleccionadas.'
                : 'No hay registros de auditoría.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Usuario</th>
                  <th className="px-4 py-3 font-semibold">Acción</th>
                  <th className="px-4 py-3 font-semibold">Fecha y hora</th>
                  <th className="px-4 py-3 font-semibold">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const details = log.details ? JSON.stringify(log.details) : null;
                  const isExpanded = expandedLogId === log.id;
                  const summary = details
                    ? details.length > 80
                      ? `${details.slice(0, 80)}...`
                      : details
                    : 'N/A';

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-slate-400" />
                            <span className="font-medium text-slate-700">{log.user_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-md bg-pink-50 px-2 py-1 text-xs font-bold text-pink-700">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-slate-500">
                            <Clock size={14} />
                            <span>{log.formatted_datetime}</span>
                          </div>
                        </td>
                        <td className="max-w-xs px-4 py-3">
                          {details ? (
                            <button
                              type="button"
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="flex w-full items-center gap-2 text-left text-slate-500 transition-colors hover:text-slate-800"
                              aria-expanded={isExpanded}
                              aria-controls={`audit-details-${log.id}`}
                              title={isExpanded ? 'Ocultar detalle' : 'Mostrar detalle completo'}
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              <span className="truncate font-mono text-xs">{summary}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && details && (
                        <tr id={`audit-details-${log.id}`} className="bg-slate-50/70">
                          <td colSpan={4} className="px-4 py-3">
                            <pre className="max-h-60 overflow-auto whitespace-pre-wrap wrap-break-word rounded-lg bg-slate-200 p-3 font-mono text-xs leading-relaxed text-slate-800">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={limit}
                onPageChange={(page) => setCurrentPage(page)}
              />
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

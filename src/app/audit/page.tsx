'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAudit } from '@/hooks/useAudit';
import Pagination from '@/components/ui/pagination';
import { ClipboardList, User, Clock, Shield } from 'lucide-react';

export default function AuditPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const { logs, total, totalPages, isLoading, error } = useAudit(currentPage, limit);

  return (
    <MainLayout title="Auditoría">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Shield size={20} className="text-primary" />
          <h2 className="text-lg font-bold text-slate-800">Historial de acciones</h2>
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
            <p className="text-sm">No hay registros de auditoría.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Usuario</th>
                  <th className="px-4 py-3 font-semibold">Acción</th>
                  <th className="px-4 py-3 font-semibold">Fecha y hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
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
                  </tr>
                ))}
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

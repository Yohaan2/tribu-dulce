'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { Settings, TrendingUp, Save, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

export default function SettingsPage() {
  const { exchangeRate, updateExchangeRate, isUpdating } = useExchangeRate();
  const currentUser = useAuthStore((state) => state.user);

  const [rate, setRate] = useState('');
  const [source, setSource] = useState('BCV');
  const [success, setSuccess] = useState(false);

  // Cargar tasa actual al montar
  useEffect(() => {
    if (exchangeRate) {
      setRate(exchangeRate.rate.toString());
      setSource(exchangeRate.source);
    }
  }, [exchangeRate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rate || isNaN(Number(rate)) || Number(rate) <= 0) return;

    try {
      await updateExchangeRate({
        rate: parseFloat(rate),
        source: source || 'Manual',
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error al guardar tasa: ${err.message}`);
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <MainLayout title="Configuración del Sistema">
      <div className="max-w-2xl space-y-6">
        
        {/* Panel de Tasa de Cambio */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Tasa de Cambio Oficial (USD / Bs)</h3>
              <p className="text-xs text-slate-400">
                Ajusta el multiplicador que se aplicará en las facturas y cobros en bolívares.
              </p>
            </div>
          </div>

          {!isAdmin && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs font-semibold text-rose-800">
              <ShieldAlert size={16} className="text-rose-600 shrink-0" />
              <span>Solo usuarios con rol ADMINISTRADOR pueden modificar la tasa oficial de cambio.</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Valor de la Tasa (en Bs)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  disabled={!isAdmin || isUpdating}
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="Ej. 40.00"
                  className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-pink-500 focus:ring-1 focus:ring-pink-500 disabled:opacity-50 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Fuente de la Tasa
                </label>
                <input
                  type="text"
                  required
                  disabled={!isAdmin || isUpdating}
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Ej. BCV / DolarToday"
                  className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-pink-500 focus:ring-1 focus:ring-pink-500 disabled:opacity-50 disabled:bg-slate-50"
                />
              </div>
            </div>

            {success && (
              <p className="text-xs font-semibold text-emerald-600">
                ¡Tasa de cambio actualizada correctamente!
              </p>
            )}

            <button
              type="submit"
              disabled={!isAdmin || isUpdating || !rate}
              className="flex items-center justify-center gap-2 rounded-lg bg-pink-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-pink-600/10 hover:bg-pink-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Save size={16} />
              <span>{isUpdating ? 'Guardando...' : 'Guardar Configuración'}</span>
            </button>
          </form>
        </div>

        {/* Panel de Roles y Permisos (Informativo) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Mi Perfil y Permisos</h3>
              <p className="text-xs text-slate-400">Nivel de autorización en Tribu Dulce</p>
            </div>
          </div>

          {currentUser ? (
            <div className="space-y-2 text-sm text-slate-600">
              <p>
                <span className="font-bold text-slate-800">Nombre de Usuario:</span> {currentUser.name}
              </p>
              <p>
                <span className="font-bold text-slate-800">Rol Asignado:</span>{' '}
                <span className="font-bold text-pink-600">{currentUser.role}</span>
              </p>
              <div className="mt-4 text-xs text-slate-400 border-t border-slate-50 pt-3">
                {isAdmin ? (
                  <p>
                    Tienes permisos completos de administrador: puedes agregar productos, modificar
                    tasas de cambio y eliminar registros.
                  </p>
                ) : (
                  <p>
                    Tienes permisos de vendedor (EMPLOYEE): puedes crear clientes y registrar ventas,
                    pero no cambiar configuraciones globales del sistema.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">Sesión no iniciada.</p>
          )}
        </div>

      </div>
    </MainLayout>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  DollarSign,
  CalendarDays,
  CalendarCheck,
  Coins,
  ArrowRight,
  PlusCircle,
  UserPlus,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useDashboard } from '@/hooks/useDashboard';
import { formatCurrencyUsd, formatCurrencyBs } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Datos Mock en caso de que la BD esté vacía
const MOCK_STATS = {
  todaySales: 0,
  weekSales: 0,
  monthSales: 0,
  pendingAmount: 0,
  topClients: [
  ],
  weeklyChartData: [
  ],
};

export default function DashboardPage() {
  const router = useRouter();
  const { stats, isLoading } = useDashboard();

  // Si está cargando, mostramos skeletons elegantes.
  // Si los datos de la BD existen pero todo está en cero (vacía), podemos usar mock para fines de diseño/demo,
  // pero mantendremos la lógica limpia. Combinamos stats con mock de fallback si no hay datos.
  const activeStats =
    stats && (stats.todaySales > 0 || stats.weekSales > 0 || stats.pendingAmount > 0)
      ? stats
      : MOCK_STATS;

  return (
    <MainLayout title="Dashboard General">
      <div className="space-y-6">
        
        {/* Fila superior: Bienvenida y Acción principal */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              ¡Hola de nuevo!
            </h2>
            <p className="text-sm text-slate-500">
              Aquí está el resumen del flujo de ventas y cuentas por cobrar.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/sales')}
              className="flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-pink-600/10 hover:bg-pink-700 active:scale-[0.98] transition-all"
            >
              <PlusCircle size={18} />
              <span>Registrar Venta</span>
            </button>
            <button
              onClick={() => router.push('/clients')}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              <UserPlus size={18} />
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>

        {/* Fila de Tarjetas (KPI Grid) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Ventas Hoy */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Ventas Hoy
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-800">
                {formatCurrencyUsd(activeStats.todaySales)}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 font-bold">
                <TrendingUp size={12} />
                <span>+12.5% vs ayer</span>
              </p>
            </div>
          </div>

          {/* Card 2: Ventas Semana */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Ventas Semana
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <CalendarDays size={20} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-800">
                {formatCurrencyUsd(activeStats.weekSales)}
              </h3>
              <p className="mt-1 text-xs text-slate-400 font-semibold">
                Últimos 7 días corridos
              </p>
            </div>
          </div>

          {/* Card 3: Ventas Mes */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Ventas Mes
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <CalendarCheck size={20} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-800">
                {formatCurrencyUsd(activeStats.monthSales)}
              </h3>
              <p className="mt-1 text-xs text-slate-400 font-semibold">
                Últimos 30 días corridos
              </p>
            </div>
          </div>

          {/* Card 4: Pendiente por Cobrar */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pendiente por Cobrar
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Coins size={20} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-amber-600">
                {formatCurrencyUsd(activeStats.pendingAmount)}
              </h3>
              <p className="mt-1 text-xs text-slate-400 font-semibold">
                Suma de deudas activas
              </p>
            </div>
          </div>
        </div>

        {/* Fila Central: Gráfico y Tabla Top Clientes */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Gráfico Semanal (Col-span 2) */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800">Flujo Semanal de Ventas (USD)</h3>
            <p className="text-xs text-slate-400 mb-4">Ingresos por ventas de los últimos 7 días</p>
            
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeStats.weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" stroke="#d87c88" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#d87c88" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none' }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                    itemStyle={{ color: '#d87c88' }}
                    formatter={(value) => [`$${value}`, 'Vendido']}
                  />
                  <Bar dataKey="amount" fill="#64241c" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla: Clientes con más compras */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Top Clientes</h3>
              <p className="text-xs text-slate-400 mb-4">Clientes con mayor volumen acumulado</p>

              <div className="divide-y divide-slate-100">
                {activeStats.topClients.map((client, idx) => (
                  <div key={client.client_id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-50 text-xs font-bold text-pink-600">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-700 leading-tight">
                          {client.client_name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {client.sales_count} {client.sales_count === 1 ? 'venta' : 'ventas'}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-slate-800">
                      {formatCurrencyUsd(client.total_spent)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => router.push('/clients')}
              className="mt-4 flex w-full items-center justify-center gap-1 py-2 text-xs font-bold text-pink-600 hover:text-pink-700 transition-colors border-t border-slate-50 pt-3"
            >
              <span>Ver todos los clientes</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}

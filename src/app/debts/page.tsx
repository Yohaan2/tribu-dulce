'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useDebts } from '@/hooks/useDebts';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { formatCurrencyUsd, formatCurrencyBs } from '@/lib/utils';
import {
  CircleDollarSign,
  CreditCard,
  Search,
  X,
  Phone,
  MessageSquareText,
  TriangleAlert,
  LayoutGrid,
  List,
  ChevronRight
} from 'lucide-react';

export default function DebtsPage() {
  const { debts, isLoading, payDebt, isPaying } = useDebts();
  const { exchangeRate } = useExchangeRate();

  // Estados de filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'TODAS' | 'HOY' | 'SEMANA' | 'MES'>('TODAS');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list');

  // Estados para modal de abono
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [amountUsd, setAmountUsd] = useState('');
  const [amountBs, setAmountBs] = useState('');

  // Estado para modal de detalles
  const [selectedDetailSale, setSelectedDetailSale] = useState<any | null>(null);

  const rate = exchangeRate ? Number(exchangeRate.rate) : 40.0;

  // Calcular abonos acumulados
  const getAccumulatedPaid = (sale: any) => {
    return (sale.payments || []).reduce((acc: number, p: any) => acc + Number(p.amount_usd), 0);
  };

  // Convertir automáticamente de USD a Bs al tipear en USD
  const handleUsdChange = (val: string) => {
    setAmountUsd(val);
    if (val && !isNaN(Number(val))) {
      setAmountBs((Number(val) * rate).toFixed(2));
    } else {
      setAmountBs('');
    }
  };

  // Obtener iniciales de un nombre
  const getInitials = (name: string) => {
    if (!name) return 'C';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Formatear fecha estilo tarjeta ("12 Oct, 2023")
  const formatDateCard = (dateString: string | Date): string => {
    if (!dateString) return '';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
      .replace(/\./g, '') // Quitar puntos de abreviación del mes
      .replace(/de /g, ''); // Limpiar conectores 'de'
  };

  // Determinar si una deuda está vencida (solo en quincenas: 15, 30 o el último día de febrero)
  const checkIfOverdue = () => {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth();

    if (day === 15 || day === 30) return true;

    if (month === 1) {
      const lastDayOfFeb = new Date(today.getFullYear(), 2, 0).getDate();
      if (day === lastDayOfFeb) return true;
    }

    return false;
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace('0', '');
    console.log(cleaned)
    return `https://wa.me/+58${cleaned}`;
  };

  // Agrupar deudas por cliente
  const groupedDebts = useMemo(() => {
    const groups: Record<string, any> = {};

    debts.forEach((sale) => {
      const clientId = sale.client?.id;
      if (!clientId) return;

      const paid = getAccumulatedPaid(sale);
      const outstandingUsd = Number(sale.total_usd) - paid;
      if (outstandingUsd <= 0) return;

      if (!groups[clientId]) {
        groups[clientId] = {
          id: clientId,
          client: sale.client,
          total_usd: 0,
          sales: [],
          created_at: sale.created_at, // Oldest sale's date initialized
          productCount: 0,
        };
      }

      groups[clientId].total_usd += outstandingUsd;
      groups[clientId].sales.push(sale);
      groups[clientId].productCount += (sale.items || []).reduce((acc: number, item: any) => acc + Number(item.quantity), 0);

      // Mantener la fecha del pedido más antiguo para calcular el vencimiento
      if (new Date(sale.created_at).getTime() < new Date(groups[clientId].created_at).getTime()) {
        groups[clientId].created_at = sale.created_at;
      }
    });

    const list = Object.values(groups);
    // Ordenar deudas de mayor a menor
    list.sort((a: any, b: any) => b.total_usd - a.total_usd);
    return list;
  }, [debts]);

  // Filtrar deudas agrupadas por cliente
  const filteredDebts = useMemo(() => {
    return groupedDebts.map((clientDebt) => {
      // Filtrar las ventas individuales del cliente que coinciden con el filtro de fecha
      const filteredSales = clientDebt.sales.filter((sale: any) => {
        if (activeFilter === 'TODAS') return true;

        const saleDate = new Date(sale.created_at);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const saleDay = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());

        if (activeFilter === 'HOY') {
          return saleDay.getTime() === today.getTime();
        }

        if (activeFilter === 'SEMANA') {
          const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return saleDay >= oneWeekAgo;
        }

        if (activeFilter === 'MES') {
          const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          return saleDay >= oneMonthAgo;
        }

        return true;
      });

      if (filteredSales.length === 0) return null;

      // Recalcular montos y estadísticas para las ventas filtradas
      const total_usd = filteredSales.reduce((sum: number, sale: any) => {
        const paid = getAccumulatedPaid(sale);
        return sum + (Number(sale.total_usd) - paid);
      }, 0);

      const productCount = filteredSales.reduce((sum: number, sale: any) => {
        return sum + (sale.items || []).reduce((acc: number, item: any) => acc + Number(item.quantity), 0);
      }, 0);

      const oldestCreatedAt = filteredSales.reduce((oldest: string, sale: any) => {
        return new Date(sale.created_at).getTime() < new Date(oldest).getTime() ? sale.created_at : oldest;
      }, filteredSales[0].created_at);

      return {
        ...clientDebt,
        sales: filteredSales,
        total_usd,
        productCount,
        created_at: oldestCreatedAt,
      };
    })
      .filter((cd): cd is any => cd !== null)
      .filter((cd) => {
        // Filtrar por nombre del cliente
        const clientName = cd.client?.name?.toLowerCase() || '';
        return clientName.includes(searchQuery.toLowerCase());
      });
  }, [groupedDebts, searchQuery, activeFilter]);

  // Agrupar items de pedidos por día
  const getGroupedItemsByDay = (sales: any[]) => {
    const groups: { [key: string]: any[] } = {};

    // Ordenar de más reciente a más antiguo
    const sortedSales = [...sales].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    sortedSales.forEach((sale) => {
      const dayKey = new Date(sale.created_at).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!groups[dayKey]) {
        groups[dayKey] = [];
      }

      if (sale.items) {
        sale.items.forEach((item: any) => {
          groups[dayKey].push({
            ...item,
            created_at: sale.created_at,
          });
        });
      }
    });

    return Object.entries(groups).map(([dateStr, items]) => ({
      dateStr,
      items,
    }));
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale || !amountUsd || isNaN(Number(amountUsd))) return;

    try {
      await payDebt({
        clientId: selectedSale.client.id,
        amountUsd: parseFloat(amountUsd),
        amountBs: parseFloat(amountBs || '0'),
      });

      // Limpiar y cerrar modal
      setSelectedSale(null);
      setAmountUsd('');
      setAmountBs('');
    } catch (err: any) {
      alert(`Error al registrar el pago: ${err.message}`);
    }
  };

  return (
    <MainLayout title="Cuentas por Cobrar">
      <div className="space-y-6">


        {/* Buscador y Filtros por Tags */}
        <div className="space-y-4">
          {/* Barra de Búsqueda */}
          <div className="relative rounded-2xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente..."
              className="block w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#5C2320] focus:ring-1 focus:ring-[#5C2320]"
            />
          </div>

          {/* Tags de Filtrado + Toggle de Vista */}
          <div className="flex items-center gap-2">
            <div className="flex flex-1 flex-wrap gap-2 overflow-x-auto pb-1 no-scrollbar">
              {(['TODAS', 'HOY', 'SEMANA', 'MES'] as const).map((filter) => {
                const labelMap = { TODAS: 'Todas', HOY: 'Hoy', SEMANA: 'Semana', MES: 'Mes' };
                const isActive = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${isActive
                      ? 'bg-[#5C2320] text-white shadow-sm shadow-[#5C2320]/15'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                      }`}
                  >
                    {labelMap[filter]}
                  </button>
                );
              })}
            </div>

            {/* Switch de Vista */}
            <div className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setViewMode('cards')}
                title="Vista en tarjetas"
                className={`flex items-center justify-center rounded-lg p-2 transition-all ${viewMode === 'cards'
                    ? 'bg-white text-[#5C2320] shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                title="Vista en lista"
                className={`flex items-center justify-center rounded-lg p-2 transition-all ${viewMode === 'list'
                    ? 'bg-white text-[#5C2320] shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Listado de Deudas */}
        {isLoading ? (
          <div className="flex h-60 items-center justify-center text-sm text-slate-400">
            Cargando deudas...
          </div>
        ) : filteredDebts.length === 0 ? (
          <div className="flex h-60 flex-col items-center justify-center text-slate-400 text-center rounded-3xl border border-slate-100 bg-white p-6">
            <CircleDollarSign size={44} className="mb-2 text-slate-300 stroke-[1.2]" />
            <p className="text-sm font-bold text-slate-700">¡Todo al día!</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[250px]">
              {searchQuery ? 'No se encontraron clientes con deudas para esta búsqueda.' : 'No hay cuentas por cobrar pendientes.'}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* ── VISTA TARJETAS ── */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDebts.map((clientDebt) => {
              const outstandingUsd = clientDebt.total_usd;
              const outstandingBs = outstandingUsd * rate;
              const productCount = clientDebt.productCount;
              const isOverdue = checkIfOverdue();

              return (
                <div key={clientDebt.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                  {/* Fila Superior de Tarjeta */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar de Iniciales */}
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 font-black text-slate-600 text-sm">
                        {getInitials(clientDebt.client?.name || '')}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-extrabold text-slate-800 leading-snug truncate">
                          {clientDebt.client?.name || 'Cliente desconocido'}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">
                          {formatDateCard(clientDebt.created_at)} • {productCount} {productCount === 1 ? 'producto' : 'productos'}
                        </p>
                      </div>
                    </div>

                    {/* Insignia de Estado */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0 border ${isOverdue
                        ? 'bg-rose-50 text-rose-600 border-rose-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}
                    >
                      {isOverdue ? (
                        <>
                          <TriangleAlert size={14} /> Vencido
                        </>
                      ) : (
                        <>
                          <CircleDollarSign size={14} /> Pendiente
                        </>
                      )}
                    </span>
                  </div>

                  {/* Fila Media de Tarjeta: Montos */}
                  <div className="space-y-2 pt-2 border-t border-slate-50">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Monto en Divisas</span>
                      <span className="text-xl font-black text-[#5C2320]">
                        {formatCurrencyUsd(outstandingUsd)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Tasa (BCV)</span>
                      <span className="text-slate-700 font-bold">
                        {formatCurrencyBs(outstandingBs)}
                      </span>
                    </div>
                  </div>

                  {/* Fila Inferior de Tarjeta: Acciones */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => setSelectedDetailSale(clientDebt)}
                      className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 active:scale-[0.98] transition-all cursor-pointer text-center"
                    >
                      Ver detalle
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSale(clientDebt);
                        setAmountUsd(outstandingUsd.toFixed(2));
                        setAmountBs(outstandingBs.toFixed(2));
                      }}
                      className="w-full rounded-2xl bg-[#5C2320] hover:bg-[#7A2F2B] active:scale-[0.98] py-3 text-sm font-bold text-white shadow-md shadow-[#5C2320]/15 transition-all cursor-pointer text-center"
                    >
                      Marcar pagado
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── VISTA LISTA ── */
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            {filteredDebts.map((clientDebt, idx) => {
              const outstandingUsd = clientDebt.total_usd;
              const outstandingBs = outstandingUsd * rate;
              const isOverdue = checkIfOverdue();
              const isLast = idx === filteredDebts.length - 1;

              return (
                <button
                  key={clientDebt.id}
                  onClick={() => setSelectedDetailSale(clientDebt)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors ${!isLast ? 'border-b border-slate-100' : ''
                    }`}
                >
                  {/* Avatar */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 font-black text-[#5C2320] text-sm">
                    {getInitials(clientDebt.client?.name || '')}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate ml-1">
                      {clientDebt.client?.name || 'Cliente desconocido'}
                    </p>
                    <span
                      className={`inline-block mt-0.5 rounded-full px-1 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${isOverdue
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-amber-50 text-amber-600'
                        }`}
                    >
                      {isOverdue ? 'Vencido' : 'Pendiente'}
                    </span>
                  </div>

                  {/* Montos */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-800">
                      {formatCurrencyUsd(outstandingUsd)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatCurrencyBs(outstandingBs)}
                    </p>
                  </div>

                  {/* Chevron */}
                  <ChevronRight size={16} className="text-slate-300 shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* Modal de Detalle de Venta - Bottom Sheet */}
        {selectedDetailSale && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-[2px] animate-fade-in" onClick={() => setSelectedDetailSale(null)}>
            <div
              className="relative w-full max-w-md bg-white rounded-t-[32px] p-6 pb-8 shadow-2xl border-t border-[#EADED9] animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Barra indicadora superior */}
              <div className="w-12 h-1 bg-[#E0D5D1] rounded-full mx-auto mb-5"></div>

              {/* Botón Cerrar */}
              <button
                onClick={() => setSelectedDetailSale(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-[#F5F2F0] text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X size={16} className="stroke-[2.5]" />
              </button>

              {/* Título */}
              <div className="mb-5">
                <h3 className="text-xl font-black text-[#5C2320] tracking-tight">
                  Detalle de Transacciones
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">
                  Cuenta agrupada • {selectedDetailSale.sales.length} {selectedDetailSale.sales.length === 1 ? 'pedido pendiente' : 'pedidos pendientes'}
                </p>
              </div>

              {/* Info Cliente */}
              <div className="border border-[#F2ECE9] bg-[#FAF8F6] px-3 py-2 rounded-2xl flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-pink-600 border border-pink-100/30 font-black text-xs">
                    {selectedDetailSale.client?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{selectedDetailSale.client?.name}</p>
                    <p className="text-xs text-slate-400">{selectedDetailSale.client?.phone || 'Sin teléfono'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pedidos</p>
                  <p className="text-xs font-black text-[#5C2320]">{selectedDetailSale.sales.length}</p>
                </div>
              </div>


              {/* Lista de Productos */}
              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Productos por fecha</h4>
                <div className="max-h-[160px] overflow-y-auto pr-1 space-y-3">
                  {getGroupedItemsByDay(selectedDetailSale.sales).map((group) => (
                    <div key={group.dateStr} className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block px-1">
                        {group.dateStr}
                      </span>
                      <div className="border border-[#F2ECE9] rounded-2xl divide-y divide-[#F2ECE9] bg-slate-50/50">
                        {group.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center px-3 py-2 text-sm">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 block truncate">{item.product?.name}</span>
                              <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span>{item.quantity} x {formatCurrencyUsd(item.unit_price)}</span>
                                <span className="text-[10px] text-slate-400">
                                  ({new Date(item.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })})
                                </span>
                              </span>
                            </div>
                            <span className="font-extrabold text-slate-700">{formatCurrencyUsd(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Historial de Abonos */}
              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Historial de Pagos / Abonos</h4>
                {(() => {
                  const allPayments = selectedDetailSale.sales
                    .flatMap((sale: any) => (sale.payments || []).map((pay: any) => ({ ...pay, sale_id: sale.id })))
                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                  return allPayments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic bg-[#FAF8F6] p-3 rounded-xl border border-[#F2ECE9] text-center">No se han registrado abonos previos.</p>
                  ) : (
                    <div className="max-h-[100px] overflow-y-auto border border-[#F2ECE9] rounded-2xl divide-y divide-[#F2ECE9]">
                      {allPayments.map((pay: any, idx: number) => (
                        <div key={pay.id} className="flex justify-between items-center p-3 text-xs">
                          <div>
                            <span className="font-bold text-slate-700">Abono #{allPayments.length - idx}</span>
                            <span className="text-[10px] text-slate-400 block">
                              {formatDateCard(pay.created_at)}
                              <span className="text-[9px] text-slate-400 ml-1">
                                ({new Date(pay.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })})
                              </span>
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-emerald-600 block">{formatCurrencyUsd(pay.amount_usd)}</span>
                            <span className="text-[10px] text-slate-400">{formatCurrencyBs(pay.amount_bs)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Recuadro de Teléfono del Cliente */}
              {selectedDetailSale.client?.phone && (
                <div className="bg-[#5C2320] rounded-2xl p-4 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Teléfono del Cliente</p>
                      <p className="text-base font-black text-white">{selectedDetailSale.client.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`tel:${selectedDetailSale.client.phone}`}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                    >
                      <Phone size={18} />
                    </a>
                    <a href={formatPhone(selectedDetailSale.client.phone)} target="_blank" rel="noopener noreferrer"
                      className='flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors'>
                      <MessageSquareText size={18} />
                    </a>
                  </div>
                </div>
              )}

              {/* Totales Resumen */}
              {(() => {
                const totalFacturado = selectedDetailSale.sales.reduce((sum: number, sale: any) => sum + Number(sale.total_usd), 0);
                const totalAbonado = selectedDetailSale.sales.reduce((sum: number, sale: any) => {
                  return sum + (sale.payments || []).reduce((acc: number, p: any) => acc + Number(p.amount_usd), 0);
                }, 0);
                const totalPendiente = totalFacturado - totalAbonado;

                return (
                  <div className="border-t border-[#F2ECE9] pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Total Facturado:</span>
                      <span className="font-bold text-slate-700">{formatCurrencyUsd(totalFacturado)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Total Abonado:</span>
                      <span className="font-bold text-emerald-600">{formatCurrencyUsd(totalAbonado)}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#F2ECE9] pt-3 text-base">
                      <span className="text-slate-800 font-extrabold">Pendiente de Cobro:</span>
                      <span className="font-black text-[#5C2320]">
                        {formatCurrencyUsd(totalPendiente)}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <button
                onClick={() => setSelectedDetailSale(null)}
                className="w-full rounded-2xl bg-[#5C2320] hover:bg-[#7A2F2B] py-3 text-sm font-bold text-white shadow-md transition-all mt-4 cursor-pointer text-center"
              >
                Cerrar Detalles
              </button>
            </div>
          </div>
        )}

        {/* Modal de Abono / Pago */}
        {selectedSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard className="text-[#5C2320]" size={18} />
                  <span>Registrar Pago / Abono</span>
                </h3>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 mb-4 text-xs space-y-2 text-slate-600 border border-slate-100">
                <div className="flex justify-between">
                  <span className="font-semibold">Cliente:</span>
                  <span className="font-bold text-slate-800">{selectedSale.client?.name}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/50 pt-2">
                  <span className="font-semibold text-slate-700">Total Pendiente:</span>
                  <span className="font-black text-rose-600 text-sm">
                    {formatCurrencyUsd(selectedSale.total_usd)}
                  </span>
                </div>
              </div>

              <form onSubmit={handlePaySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Monto del Pago (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amountUsd}
                    onChange={(e) => handleUsdChange(e.target.value)}
                    placeholder="0.00"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-[#5C2320] focus:ring-1 focus:ring-[#5C2320]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Equivalente en Bolívares (Tasa: {rate} Bs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amountBs}
                    onChange={(e) => setAmountBs(e.target.value)}
                    placeholder="0.00"
                    className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSale(null)}
                    className="rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPaying || !amountUsd}
                    className="rounded-2xl bg-[#5C2320] hover:bg-[#7A2F2B] py-3 text-sm font-bold text-white shadow-md shadow-[#5C2320]/10 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isPaying ? 'Guardando...' : 'Confirmar Abono'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}

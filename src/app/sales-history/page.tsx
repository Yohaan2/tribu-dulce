'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { formatCurrencyUsd, formatCurrencyBs } from '@/lib/utils';
import { 
  Search, 
  Plus, 
  Minus,
  Trash2,
  SlidersHorizontal, 
  Eye, 
  Pencil, 
  X, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Sale, SaleStatus } from '@/types';

type FilterType = 'Todas' | 'Pendientes' | 'Pagadas' | 'Este Mes';

interface EditableItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export default function SalesHistoryPage() {
  const router = useRouter();
  const { sales, isLoading, updateSale, isUpdatingSale } = useSales();
  const { products } = useProducts();
  const { exchangeRate } = useExchangeRate();

  const rate = exchangeRate ? Number(exchangeRate.rate) : 40.0;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('Todas');
  
  // State para visualización de detalles de venta
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  
  // State para edición de venta
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [newStatus, setNewStatus] = useState<SaleStatus>('PAID');
  const [editingItems, setEditingItems] = useState<EditableItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Filtrado y agrupado de las ventas
  const filteredSales = useMemo(() => {
    let result = [...sales];

    // 1. Filtrar por término de búsqueda (cliente o productos)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter((sale) => {
        const clientName = sale.client?.name?.toLowerCase() || 'cliente general';
        const hasMatchingProduct = sale.items?.some((item) => 
          item.product?.name?.toLowerCase().includes(term)
        );
        return clientName.includes(term) || hasMatchingProduct;
      });
    }

    // 2. Filtrar por tipo seleccionado (Todas, Pendientes, Pagadas, Este Mes)
    if (selectedFilter === 'Pendientes') {
      result = result.filter((sale) => sale.status === 'PENDING' || sale.status === 'PARTIAL');
    } else if (selectedFilter === 'Pagadas') {
      result = result.filter((sale) => sale.status === 'PAID');
    } else if (selectedFilter === 'Este Mes') {
      const now = new Date();
      result = result.filter((sale) => {
        const saleDate = new Date(sale.created_at);
        return (
          saleDate.getFullYear() === now.getFullYear() &&
          saleDate.getMonth() === now.getMonth()
        );
      });
    }

    return result;
  }, [sales, searchTerm, selectedFilter]);

  // Agrupar ventas por fecha
  const groupedSales = useMemo(() => {
    const groups: Record<string, Sale[]> = {};
    
    filteredSales.forEach((sale) => {
      const dateStr = new Date(sale.created_at).toDateString();
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(sale);
    });

    return Object.entries(groups).sort((a, b) => {
      return new Date(b[0]).getTime() - new Date(a[0]).getTime();
    });
  }, [filteredSales]);

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    const formattedDate = date.toLocaleDateString('es-ES', options).toUpperCase();

    if (isToday) return `HOY, ${formattedDate}`;
    if (isYesterday) return `AYER, ${formattedDate}`;

    const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' }).toUpperCase();
    return `${dayName}, ${formattedDate}`;
  };

  const getStatusBadge = (status: SaleStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EAFDF3] text-[#1E7F46]">
            <CheckCircle2 size={12} className="stroke-[2.5]" />
            Pagado
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF6E9] text-[#B76E00]">
            <AlertCircle size={12} className="stroke-[2.5]" />
            Pendiente
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EEF4FF] text-[#355FC4]">
            <Clock size={12} className="stroke-[2.5]" />
            Abono Parcial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            <HelpCircle size={12} className="stroke-[2.5]" />
            Desconocido
          </span>
        );
    }
  };

  const openEditModal = (sale: Sale) => {
    setEditingSale(sale);
    setNewStatus(sale.status);
    setSelectedProductId('');
    const items = sale.items?.map((item) => ({
      product_id: item.product_id,
      product_name: item.product?.name || 'Producto',
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
    })) || [];
    setEditingItems(items);
  };

  const handleQuantityChange = (index: number, delta: number) => {
    setEditingItems((prev) => {
      const next = [...prev];
      const newQty = Math.max(1, next[index].quantity + delta);
      next[index] = { ...next[index], quantity: newQty };
      return next;
    });
  };

  const handlePriceChange = (index: number, priceStr: string) => {
    const val = parseFloat(priceStr);
    setEditingItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], unit_price: isNaN(val) ? 0 : val };
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setEditingItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddProduct = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const existingIndex = editingItems.findIndex((i) => i.product_id === prod.id);
    if (existingIndex >= 0) {
      handleQuantityChange(existingIndex, 1);
    } else {
      setEditingItems((prev) => [
        ...prev,
        {
          product_id: prod.id,
          product_name: prod.name,
          quantity: 1,
          unit_price: Number(prod.price_usd),
        },
      ]);
    }
    setSelectedProductId('');
  };

  const editingTotalUsd = useMemo(() => {
    return editingItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  }, [editingItems]);

  const editingTotalBs = useMemo(() => {
    return editingTotalUsd * rate;
  }, [editingTotalUsd, rate]);

  const handleSaveSale = async () => {
    if (!editingSale) return;
    try {
      await updateSale({
        id: editingSale.id,
        status: newStatus,
        items: editingItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });
      setEditingSale(null);
    } catch (error: any) {
      alert(`Error al actualizar la venta: ${error.message}`);
    }
  };

  return (
    <MainLayout title="Historial de Ventas">
      <div className="max-w-xl mx-auto space-y-5 relative pb-24">

        {/* Buscador */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#EADED9] rounded-2xl text-sm font-semibold text-slate-700 placeholder-slate-400 outline-none focus:border-[#7A2F2B] focus:ring-1 focus:ring-[#7A2F2B] shadow-sm transition-all"
          />
        </div>

        {/* Botonera de Acciones Rápidas */}
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/sales')}
            className="flex-1 bg-[#5C2320] hover:bg-[#7A2F2B] active:scale-[0.98] text-white py-3.5 px-4 rounded-2xl text-xs font-black tracking-wide flex items-center justify-center gap-2 shadow-md shadow-[#5C2320]/10 transition-all cursor-pointer"
          >
            <Plus size={16} className="stroke-[3]" />
            Nueva Venta
          </button>
          
          <button className="bg-[#FAF5F3] hover:bg-[#EADED9]/20 border border-[#EADED9] text-[#7A2F2B] p-3.5 rounded-2xl flex items-center justify-center active:scale-95 transition-all" title="Filtrar">
            <SlidersHorizontal size={18} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Filtros estilo píldoras */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {(['Todas', 'Pendientes', 'Pagadas', 'Este Mes'] as FilterType[]).map((filter) => {
            const isSelected = selectedFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border cursor-pointer
                  ${isSelected 
                    ? 'bg-[#5C2320] border-[#5C2320] text-white shadow-sm font-black' 
                    : 'bg-white border-[#EADED9] text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }
                `}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Listado de Ventas agrupadas */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <Loader2 className="animate-spin text-[#7A2F2B] mb-2" size={28} />
            <p className="text-xs font-bold">Cargando transacciones...</p>
          </div>
        ) : groupedSales.length === 0 ? (
          <div className="bg-white border border-dashed border-[#EADED9] rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF5F3] text-[#7A2F2B] flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
            <h3 className="text-sm font-black text-slate-700">Sin transacciones</h3>
            <p className="text-xs text-slate-400 font-semibold max-w-[200px]">
              No se encontraron ventas que coincidan con los filtros actuales
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedSales.map(([dateStr, daySales]) => (
              <div key={dateStr} className="space-y-3">
                {/* Cabecera de grupo */}
                <h3 className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                  {formatDateHeader(dateStr)}
                </h3>

                {/* Cards de venta */}
                <div className="space-y-3.5">
                  {daySales.map((sale) => {
                    const clientName = sale.client?.name || 'Cliente General';
                    const initials = clientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    const itemCount = sale.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                    const formattedTime = new Date(sale.created_at).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false
                    });

                    return (
                      <div 
                        key={sale.id}
                        className="bg-white border border-[#F2ECE9] p-4 rounded-3xl shadow-xs hover:shadow-sm hover:border-[#EADED9] transition-all space-y-3.5"
                      >
                        {/* Cabecera del item */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-full bg-pink-50 text-pink-700 border border-pink-100/30 flex items-center justify-center font-black text-sm shadow-inner">
                              {initials}
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-800 tracking-tight">
                                {clientName}
                              </h4>
                              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock size={11} className="text-slate-400" />
                                <span>{formattedTime}</span>
                                <span>•</span>
                                <span>{itemCount} {itemCount === 1 ? 'producto' : 'productos'}</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Divisor interno */}
                        <div className="h-[1px] bg-[#FAF8F6] w-full"></div>

                        {/* Parte inferior: Montos y botones de acción */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="block text-base font-black text-[#5C2320] tracking-tight">
                              {formatCurrencyUsd(sale.total_usd)}
                            </span>
                            <span className="block text-[10px] font-bold text-slate-400">
                              {formatCurrencyBs(sale.total_bs)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Estado Badge */}
                            {getStatusBadge(sale.status)}

                            {/* Botones */}
                            <button 
                              onClick={() => setViewingSale(sale)}
                              className="p-2 bg-[#FAF5F3] text-slate-500 hover:text-slate-800 rounded-xl transition-all active:scale-90 border border-transparent hover:border-[#EADED9] cursor-pointer"
                              title="Ver Detalle"
                            >
                              <Eye size={14} className="stroke-[2.5]" />
                            </button>

                            <button 
                              onClick={() => openEditModal(sale)}
                              className="p-2 bg-[#FAF5F3] text-slate-500 hover:text-[#7A2F2B] rounded-xl transition-all active:scale-90 border border-transparent hover:border-[#EADED9] cursor-pointer"
                              title="Editar Estado"
                            >
                              <Pencil size={14} className="stroke-[2.5]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floating Action Button (FAB) */}
        <button
          onClick={() => router.push('/sales')}
          className="fixed bottom-20 md:bottom-8 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-200"
          title="Nueva Venta"
        >
          <Plus size={24} className="stroke-[3]" />
        </button>

        {/* MODAL: Detalle de Venta */}
        {viewingSale !== null && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-[2px] animate-fade-in" onClick={() => setViewingSale(null)}>
            <div 
              className="relative w-full max-w-md bg-white rounded-t-[32px] p-6 pb-8 shadow-2xl border-t border-[#EADED9] animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Barra indicadora superior */}
              <div className="w-12 h-1 bg-[#E0D5D1] rounded-full mx-auto mb-5"></div>

              {/* Botón Cerrar */}
              <button 
                onClick={() => setViewingSale(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-[#F5F2F0] text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X size={16} className="stroke-[2.5]" />
              </button>

              {/* Título */}
              <div className="mb-5">
                <h3 className="text-xl font-black text-[#5C2320] tracking-tight">
                  Detalle de Transacción
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">
                  {new Date(viewingSale.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} a las {new Date(viewingSale.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Info Cliente */}
              <div className="border border-[#F2ECE9] bg-[#FAF8F6] p-4 rounded-2xl flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-pink-600 border border-pink-100/30 font-black text-xs">
                    {viewingSale.client?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CG'}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 tracking-tight">
                      {viewingSale.client?.name || 'Cliente General'}
                    </h4>
                    {viewingSale.client?.phone && (
                      <p className="text-xs font-bold text-slate-400 mt-0.5">
                        {viewingSale.client.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  {getStatusBadge(viewingSale.status)}
                </div>
              </div>

              {/* Lista de Productos Comprados */}
              <div className="border border-[#F2ECE9] p-4 rounded-2xl bg-white mb-5 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-[#7A2F2B]">
                  Productos Adquiridos
                </h4>
                
                <div className="divide-y divide-slate-100">
                  {viewingSale.items && viewingSale.items.length > 0 ? (
                    viewingSale.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 text-xs">
                        <div className="pr-4">
                          <p className="font-bold text-slate-800 truncate">{item.product?.name || 'Producto Desconocido'}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'} x {formatCurrencyUsd(item.unit_price)}
                          </p>
                        </div>
                        <span className="font-black text-slate-800 flex-shrink-0">
                          {formatCurrencyUsd(item.subtotal || (item.quantity * item.unit_price))}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic py-2">Sin productos desglosados</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-600">Total USD:</span>
                  <span className="font-black text-[#5C2320] text-base">{formatCurrencyUsd(viewingSale.total_usd)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400">Total Bs:</span>
                  <span className="font-bold text-slate-500">{formatCurrencyBs(viewingSale.total_bs)}</span>
                </div>
              </div>

              {/* Botón Cerrar Panel */}
              <button 
                onClick={() => setViewingSale(null)}
                className="w-full bg-[#5C2320] hover:bg-[#7A2F2B] text-white text-sm font-black py-4 rounded-2xl shadow-md transition-all cursor-pointer"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        )}

        {/* MODAL: Editar Venta / Deuda */}
        {editingSale !== null && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-[2px] animate-fade-in" onClick={() => setEditingSale(null)}>
            <div 
              className="relative w-full max-w-md bg-white rounded-t-4xl p-6 pb-8 shadow-2xl border-t border-[#EADED9] animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Barra indicadora superior */}
              <div className="w-12 h-1 bg-[#E0D5D1] rounded-full mx-auto mb-5"></div>

              {/* Botón Cerrar */}
              <button 
                onClick={() => setEditingSale(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-[#F5F2F0] text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X size={16} className="stroke-[2.5]" />
              </button>

              {/* Título */}
              <div className="mb-5">
                <h3 className="text-xl font-black text-[#5C2320] tracking-tight">
                  Editar Venta
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  Cliente: <span className="font-black text-slate-700">{editingSale.client?.name || 'Cliente General'}</span>
                </p>
              </div>

              {/* Opciones de Estado de Pago */}
              <div className="space-y-3 mb-6">
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#7A2F2B]">
                  Estado de Pago
                </label>
                
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'PAID', title: 'Pagado' },
                    { id: 'PENDING', title: 'Pendiente' },
                    { id: 'PARTIAL', title: 'Abono' }
                  ].map((option) => {
                    const isSelected = newStatus === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setNewStatus(option.id as SaleStatus)}
                        className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold
                          ${isSelected 
                            ? 'border-[#7A2F2B] bg-[#FAF5F3] text-[#5C2320] ring-1 ring-[#7A2F2B]' 
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }
                        `}
                      >
                        {option.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detalle y Edición de Productos */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#7A2F2B]">
                    Productos en esta Venta
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">
                    {editingItems.length} {editingItems.length === 1 ? 'producto' : 'productos'}
                  </span>
                </div>

                {/* Lista de productos editables */}
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {editingItems.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No hay productos agregados
                    </p>
                  ) : (
                    editingItems.map((item, idx) => (
                      <div 
                        key={`${item.product_id}-${idx}`}
                        className="p-3 bg-[#FAF8F6] border border-[#F2ECE9] rounded-2xl space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-slate-800 truncate">
                            {item.product_name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                          {/* Controles de Cantidad */}
                          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(idx, -1)}
                              className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
                            >
                              <Minus size={12} className="stroke-3" />
                            </button>
                            <span className="text-xs font-black w-6 text-center text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(idx, 1)}
                              className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
                            >
                              <Plus size={12} className="stroke-3" />
                            </button>
                          </div>

                          {/* Campo de Precio Unitario */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => handlePriceChange(idx, e.target.value)}
                              className="w-16 bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-black text-slate-800 outline-none focus:border-[#7A2F2B]"
                            />
                          </div>

                          {/* Subtotal del item */}
                          <div className="text-right min-w-15">
                            <span className="text-xs font-black text-[#5C2320]">
                              {formatCurrencyUsd(item.quantity * item.unit_price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Selección para agregar nuevo producto */}
                <div className="pt-2 border-t border-slate-100 flex gap-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 bg-white border border-[#EADED9] rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#7A2F2B]"
                  >
                    <option value="">-- Seleccionar producto para agregar --</option>
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} ({formatCurrencyUsd(prod.price_usd)})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    disabled={!selectedProductId}
                    className="bg-[#5C2320] hover:bg-[#7A2F2B] disabled:opacity-40 text-white px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} className="stroke-3" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>

              {/* Resumen de totales calculados */}
              <div className="bg-[#FAF8F6] border border-[#F2ECE9] p-3.5 rounded-2xl mb-6 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500">Nuevo Total USD:</span>
                  <span className="font-black text-[#5C2320] text-sm">{formatCurrencyUsd(editingTotalUsd)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400">Nuevo Total Bs:</span>
                  <span className="font-bold text-slate-600">{formatCurrencyBs(editingTotalBs)}</span>
                </div>
              </div>

              {/* Botón de Guardar */}
              <button 
                onClick={handleSaveSale}
                disabled={isUpdatingSale || editingItems.length === 0}
                className="w-full bg-[#5C2320] hover:bg-[#7A2F2B] disabled:opacity-50 text-white text-sm font-black py-4 rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isUpdatingSale ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Guardando cambios...</span>
                  </>
                ) : (
                  <span>Guardar Cambios</span>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}

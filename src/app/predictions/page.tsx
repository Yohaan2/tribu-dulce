'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePredictions } from '@/hooks/usePredictions';
import { useProducts } from '@/hooks/useProducts';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { formatCurrencyUsd, formatCurrencyBs } from '@/lib/utils';
import {
  TrendingUp,
  Target,
  Plus,
  Trash2,
  Pencil,
  Save,
  RotateCcw,
  History,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  DollarSign,
  Package,
  Cookie,
  ArrowUpRight,
  Clock,
  Award,
  Layers,
  ChevronRight,
  X,
  Loader2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import SelectInput, { SelectOption } from '@/components/ui/select-input';
import { PredictionSummary, PredictionHistoryItem, PredictionItemComparison } from '@/types';

export default function PredictionsPage() {
  const {
    summary,
    isLoading,
    refetchActive,
    history,
    isHistoryLoading,
    addPredictionItem,
    isAdding,
    updatePredictionItem,
    isUpdating,
    deletePredictionItem,
    isDeleting,
    resetPrediction,
    isResetting,
    getPredictionById,
  } = usePredictions();

  const { products, isLoading: productsLoading } = useProducts();
  const { exchangeRate } = useExchangeRate();

  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [estimatedQuantity, setEstimatedQuantity] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState('');
  const [editingTotalCost, setEditingTotalCost] = useState('');

  // Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetNotes, setResetNotes] = useState('');

  // History Detail Modal State
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [historyDetail, setHistoryDetail] = useState<PredictionSummary | null>(null);
  const [isHistoryDetailLoading, setIsHistoryDetailLoading] = useState(false);

  // Opciones de productos
  const productOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: 'Selecciona un producto...' },
      ...products.map((p) => ({
        value: p.id,
        label: `${p.name} - $${Number(p.price_usd).toFixed(2)}`,
      })),
    ];
  }, [products]);

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    setFormError('');
  };

  // Cálculo en tiempo real en el formulario
  const parsedQty = parseInt(estimatedQuantity, 10) || 0;
  const parsedPrice = Number(products.find((p) => p.id === selectedProductId)?.price_usd) || 0;
  const parsedTotalCost = parseFloat(totalCost) || 0;
  const calculatedUnitCost = parsedQty > 0 ? parsedTotalCost / parsedQty : 0;
  const previewSales = parsedQty * parsedPrice;
  const previewProfit = previewSales - parsedTotalCost;

  // Manejar submit del formulario
  const handleAddForecast = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedProductId) {
      setFormError('Por favor selecciona un producto existente.');
      return;
    }

    if (parsedQty <= 0) {
      setFormError('La cantidad estimada debe ser un número entero mayor a 0.');
      return;
    }

    if (parsedTotalCost < 0) {
      setFormError('El costo total no puede ser negativo.');
      return;
    }

    try {
      await addPredictionItem({
        product_id: selectedProductId,
        estimated_quantity: parsedQty,
        total_cost: parsedTotalCost,
        unit_cost: calculatedUnitCost,
      });

      setFormSuccess('¡Producto agregado a la previsión correctamente!');
      setSelectedProductId('');
      setEstimatedQuantity('');
      setTotalCost('');
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Error al agregar el producto a la previsión.');
    }
  };


  const handleEditItem = (item: PredictionItemComparison) => {
    setEditingItemId(item.id);
    setEditingQuantity(String(item.estimated_quantity));
    setEditingTotalCost(String(item.total_cost));
    setFormError('');
    setFormSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingQuantity('');
    setEditingTotalCost('');
  };

  const handleSaveItem = async (itemId: string) => {
    const quantity = Number(editingQuantity);
    const cost = Number(editingTotalCost);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setFormError('La cantidad estimada debe ser un entero mayor a 0.');
      return;
    }

    if (!Number.isFinite(cost) || cost < 0) {
      setFormError('El costo total debe ser un número mayor o igual a 0.');
      return;
    }

    try {
      await updatePredictionItem({
        itemId,
        input: {
          estimated_quantity: quantity,
          total_cost: cost,
          unit_cost: quantity > 0 ? cost / quantity : 0,
        },
      });
      handleCancelEdit();
      setFormSuccess('Item de previsión actualizado correctamente.');
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Error al actualizar el item de previsión.');
    }
  };

  // Manejar reinicio de previsión
  const handleConfirmReset = async () => {
    try {
      await resetPrediction(resetNotes.trim() || undefined);
      setIsResetModalOpen(false);
      setResetNotes('');
    } catch (err: any) {
      alert(err.message || 'Error al reiniciar la previsión');
    }
  };

  // Ver detalle de una previsión histórica
  const handleOpenHistoryDetail = async (id: string) => {
    setViewingHistoryId(id);
    setIsHistoryDetailLoading(true);
    try {
      const data = await getPredictionById(id);
      setHistoryDetail(data);
    } catch (err: any) {
      alert(err.message || 'Error al cargar el detalle histórico');
      setViewingHistoryId(null);
    } finally {
      setIsHistoryDetailLoading(false);
    }
  };

  const activePrediction = summary?.prediction;
  const items = summary?.items || [];
  const totals = summary?.totals || {
    total_estimated_quantity: 0,
    total_sold_quantity: 0,
    total_remaining_quantity: 0,
    total_estimated_sales: 0,
    total_real_sales: 0,
    total_estimated_cost: 0,
    total_estimated_profit: 0,
    total_real_profit: 0,
    overall_quantity_rate: 0,
    overall_sales_rate: 0,
    overall_profit_rate: 0,
  };


  // Formato legible de fecha
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <MainLayout title="Previsiones de Ventas">
      <div className="space-y-6">
        {/* Cabecera & Selector de Pestañas */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${activeTab === 'active'
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <Target size={14} />
                <span>Previsión Activa</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${activeTab === 'history'
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <History size={14} />
                <span>Historial</span>
                {history.length > 0 && (
                  <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-700">
                    {history.length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={() => refetchActive()}
              title="Refrescar datos"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PESTAÑA 1: PREVISIÓN ACTIVA */}
        {/* ========================================================================= */}
        {activeTab === 'active' && (
          <div className="space-y-6">
            {/* Banner de Estado de la Previsión Activa */}
            <div className="flex flex-col gap-3 rounded-2xl border border-pink-100 bg-gradient-to-r from-pink-50/70 via-white to-pink-50/40 p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-600 text-white shadow-sm shadow-pink-600/30">
                  <Clock size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Período Activo
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {activePrediction
                        ? `Iniciado el ${formatDateTime(activePrediction.started_at)}`
                        : 'Sin previsión activa (crea una a continuación)'}
                    </span>
                  </div>
                </div>
              </div>

              {activePrediction && (
                <button
                  onClick={() => setIsResetModalOpen(true)}
                  disabled={isResetting}
                  className="flex items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white px-3.5 py-2 text-xs font-bold text-pink-700 shadow-sm hover:bg-pink-50 active:scale-[0.98] transition-all"
                >
                  <RotateCcw size={14} className="text-pink-600" />
                  <span>Cerrar Venta</span>
                </button>
              )}
            </div>

            {/* Fila: Formulario para Agregar Estimación de Producto */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-100 text-pink-600">
                    <Plus size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {activePrediction ? 'Agregar Producto a la Previsión' : 'Iniciar Nueva Previsión'}
                  </h3>
                </div>
              </div>

              <form onSubmit={handleAddForecast} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  {/* Selector de Producto */}
                  <div className="md:col-span-1">
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                      Producto <span className="text-rose-500">*</span>
                    </label>
                    <SelectInput
                      value={selectedProductId}
                      onChange={handleProductSelect}
                      options={productOptions}
                      placeholder="Seleccionar producto..."
                    />
                  </div>


                  {/* Cantidad Estimada */}
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                      Cantidad Estimada (uds) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Ej: 500"
                      value={estimatedQuantity}
                      onChange={(e) => setEstimatedQuantity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-300 focus:outline-none"
                    />
                  </div>

                  {/* Precio Unitario */}
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                      Precio actual del producto ($ USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-semibold text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={parsedPrice.toFixed(2)}
                        readOnly
                        disabled
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-7 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-300 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Costo Total */}
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                      Costo Total de las {parsedQty > 0 ? `${parsedQty} uds` : 'unidades'} ($ USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-semibold text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={totalCost}
                        onChange={(e) => setTotalCost(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 pl-7 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-300 focus:outline-none"
                      />
                    </div>
                    {parsedQty > 0 && parsedTotalCost > 0 && (
                      <p className="mt-1 text-[11px] font-medium text-slate-500">
                        = <strong className="text-slate-700">${calculatedUnitCost.toFixed(2)}</strong> / unidad
                      </p>
                    )}
                  </div>
                </div>

                {/* Previsualización en Vivo de Cálculos */}
                {parsedQty > 0 && parsedPrice > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-2.5 text-xs">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-slate-400">Venta Proyectada:</span>{' '}
                        <strong className="text-slate-800">${previewSales.toFixed(2)} USD</strong>
                      </div>
                      {parsedTotalCost > 0 && (
                        <div>
                          <span className="text-slate-400">Costo Total:</span>{' '}
                          <strong className="text-slate-700">${parsedTotalCost.toFixed(2)} USD</strong>{' '}
                          <span className="text-slate-400">(${calculatedUnitCost.toFixed(2)}/ud)</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400">Ganancia Proyectada:</span>{' '}
                        <strong className="text-emerald-700">${previewProfit.toFixed(2)} USD</strong>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 italic">
                      Margen: {previewSales > 0 ? ((previewProfit / previewSales) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                )}


                {/* Mensajes de feedback */}
                {formError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-100">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                {formSuccess && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-700 border border-emerald-100">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex items-center gap-2 rounded-xl bg-pink-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-pink-600/20 hover:bg-pink-700 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>Guardar en Previsión</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Grid de Tarjetas KPI de Resumen */}
            <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
              {/* KPI 1: Cantidad Estimada vs Real */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Unidades
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Package size={14} />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-slate-800">
                      {totals.total_sold_quantity}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      / {totals.total_estimated_quantity} est.
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">
                      Restante: <strong className="text-slate-700">{totals.total_remaining_quantity} uds</strong>
                    </span>
                    <span className="font-bold text-blue-600">
                      {totals.overall_quantity_rate}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, totals.overall_quantity_rate)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* KPI 2: Ventas USD */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Venta Total
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                    <DollarSign size={16} />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-slate-800">
                      ${totals.total_real_sales.toFixed(2)}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      / ${totals.total_estimated_sales.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">
                      Avance:{' '}
                      <strong className="text-slate-700">
                        {totals.overall_sales_rate}%
                      </strong>
                    </span>
                    {totals.total_real_sales >= totals.total_estimated_sales && totals.total_estimated_sales > 0 && (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">
                        ¡Meta lograda!
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, totals.overall_sales_rate)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* KPI 3: Ganancia USD */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Ganancia Real
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <TrendingUp size={16} />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-black ${totals.total_real_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ${totals.total_real_profit.toFixed(2)}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      / ${totals.total_estimated_profit.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">
                      Cumplimiento:{' '}
                      <strong className="text-slate-700">
                        {totals.overall_profit_rate}%
                      </strong>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, totals.overall_profit_rate)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* KPI 4: Productos en Previsión */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Productos Activos
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Award size={16} />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-slate-800">
                      {items.length}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      {items.length === 1 ? 'producto' : 'productos'}
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500">
                    {items.filter((i) => i.is_exceeded).length} superaron la previsión
                  </p>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${items.length > 0 ? (items.filter((i) => i.fulfillment_rate >= 100).length / items.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* TABLA 1: Previsión Estimada */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-pink-600" />
                  <h3 className="text-xs font-bold text-slate-800">
                    1. Tabla de Previsión (Estimado)
                  </h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-3 py-2">Producto</th>
                      <th className="px-3 py-2 text-right">Cantidad Estimada</th>
                      <th className="px-3 py-2 text-right">Precio Unitario</th>
                      <th className="px-3 py-2 text-right">Costo Total (Unitario)</th>
                      <th className="px-3 py-2 text-right">Venta Total Est.</th>
                      <th className="px-3 py-2 text-right">Ganancia Est.</th>
                      <th className="px-3 py-2 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                          No hay productos en la previsión activa. Utiliza el formulario arriba para agregar uno.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-3 py-3.5 font-bold text-slate-800 flex items-center gap-2">
                            <Cookie size={16} className="text-pink-500 shrink-0" />
                            <span>{item.product_name}</span>
                          </td>
                          <td className="px-3 py-3.5 text-right text-slate-700">
                            {editingItemId === item.id ? (
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={editingQuantity}
                                onChange={(e) => setEditingQuantity(e.target.value)}
                                className="w-24 rounded-lg border border-pink-300 px-2 py-1 text-right text-xs focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                              />
                            ) : (
                              <span className="font-semibold">{item.estimated_quantity} uds</span>
                            )}
                          </td>
                          <td className="px-3 py-3.5 text-right text-slate-600">
                            ${item.unit_price.toFixed(2)}
                          </td>
                          <td className="px-3 py-3.5 text-right">
                            {editingItemId === item.id ? (
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editingTotalCost}
                                onChange={(e) => setEditingTotalCost(e.target.value)}
                                className="w-24 rounded-lg border border-pink-300 px-2 py-1 text-right text-xs focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                              />
                            ) : (
                              <>
                                <span className="font-semibold text-slate-700">
                                  ${item.total_cost.toFixed(2)}
                                </span>
                                <span className="ml-1 text-[11px] text-slate-400">
                                  (${item.unit_cost.toFixed(2)}/ud)
                                </span>
                              </>
                            )}
                          </td>
                          <td className="px-3 py-3.5 text-right font-bold text-slate-800">
                            ${item.estimated_sales.toFixed(2)}
                          </td>
                          <td className="px-3 py-3.5 text-right font-bold text-emerald-600">
                            ${item.estimated_profit.toFixed(2)}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            {editingItemId === item.id ? (
                              <div className="flex justify-center gap-1">
                                <button
                                  onClick={() => handleSaveItem(item.id)}
                                  disabled={isUpdating}
                                  title="Guardar cambios"
                                  className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                                >
                                  {isUpdating ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  disabled={isUpdating}
                                  title="Cancelar edición"
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                                >
                                  <X size={15} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-center gap-1">
                                <button
                                  onClick={() => handleEditItem(item)}
                                  disabled={isUpdating || isDeleting}
                                  title="Editar previsión"
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`¿Eliminar ${item.product_name} de la previsión?`)) {
                                      deletePredictionItem(item.id);
                                    }
                                  }}
                                  disabled={isDeleting || isUpdating}
                                  title="Eliminar de la previsión"
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {items.length > 0 && (
                    <tfoot className="border-t-2 border-slate-200 bg-slate-50/70 font-bold text-slate-800">
                      <tr>
                        <td className="px-3 py-2">TOTAL ESTIMADO</td>
                        <td className="px-3 py-2 text-right">{totals.total_estimated_quantity} uds</td>
                        <td className="px-3 py-2 text-right">-</td>
                        <td className="px-3 py-2 text-right text-slate-700">${totals.total_estimated_cost?.toFixed(2) || '0.00'}</td>
                        <td className="px-3 py-2 text-right text-slate-900">${totals.total_estimated_sales.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-emerald-600">${totals.total_estimated_profit.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>


            {/* TABLA 2: Ventas Reales */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-800">
                    2. Tabla de Ventas Reales (Desde {activePrediction ? formatDateTime(activePrediction.started_at) : 'inicio'})
                  </h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-3 py-3">Producto</th>
                      <th className="px-3 py-3 text-right">Cantidad Vendida</th>
                      <th className="px-3 py-3 text-right">Venta Total Real</th>
                      <th className="px-3 py-3 text-right">Ganancia Real</th>
                      <th className="px-3 py-3 text-right">% Cumplido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                          Sin productos en seguimiento.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-3 py-3.5 font-bold text-slate-800 flex items-center gap-2">
                            <Cookie size={16} className="text-emerald-500 shrink-0" />
                            <span>{item.product_name}</span>
                          </td>
                          <td className="px-3 py-3.5 text-right font-semibold text-slate-700">
                            {item.sold_quantity} uds
                          </td>
                          <td className="px-3 py-3.5 text-right font-bold text-slate-900">
                            ${item.real_sales.toFixed(2)}
                          </td>
                          <td className={`px-3 py-3.5 text-right font-bold ${item.real_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ${item.real_profit.toFixed(2)}
                          </td>
                          <td className="px-3 py-3.5 text-right">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${item.fulfillment_rate >= 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.fulfillment_rate >= 50
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                                }`}
                            >
                              {item.fulfillment_rate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {items.length > 0 && (
                    <tfoot className="border-t-2 border-slate-200 bg-slate-50/70 font-bold text-slate-800">
                      <tr>
                        <td className="px-3 py-3">TOTAL REAL</td>
                        <td className="px-3 py-3 text-right">{totals.total_sold_quantity} uds</td>
                        <td className="px-3 py-3 text-right text-slate-900">${totals.total_real_sales.toFixed(2)}</td>
                        <td className={`px-3 py-3 text-right ${totals.total_real_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>${totals.total_real_profit.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right font-black text-pink-600">{totals.overall_quantity_rate}%</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* SECCIÓN 3: Comparación Detallada (Estimado vs Real) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-100 text-pink-600">
                    <Sparkles size={16} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-800">
                    3. Comparación entre Previsión y Realidad
                  </h3>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs">
                  Agrega productos a la previsión para ver la comparativa en tiempo real.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all shadow-xs ${item.is_exceeded
                        ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/20'
                        : 'border-slate-200 bg-white'
                        }`}
                    >
                      <div>
                        {/* Header de la tarjeta */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                              <Cookie size={16} />
                            </div>
                            <h4 className="text-xs font-bold text-slate-800 leading-snug">
                              {item.product_name}
                            </h4>
                          </div>

                          {item.is_exceeded ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shadow-xs">
                              <CheckCircle2 size={12} />
                              Superada (+{item.exceeded_quantity})
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                              {item.fulfillment_rate}% meta
                            </span>
                          )}
                        </div>

                        {/* Barra de Progreso */}
                        <div className="mt-3.5">
                          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
                            <span>Progreso de ventas</span>
                            <span className="font-bold text-slate-700">
                              {item.sold_quantity} / {item.estimated_quantity} uds
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${item.is_exceeded ? 'bg-emerald-500' : 'bg-pink-500'
                                }`}
                              style={{ width: `${Math.min(100, item.fulfillment_rate)}%` }}
                            />
                          </div>
                        </div>

                        {/* Detalle Estimado vs Real */}
                        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs border border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Estimado
                            </span>
                            <p className="mt-0.5 font-bold text-slate-700">
                              {item.estimated_quantity} uds
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Venta: ${item.estimated_sales.toFixed(2)}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Costo: ${item.total_cost.toFixed(2)} <span className="text-[10px]">(${item.unit_cost.toFixed(2)}/ud)</span>
                            </p>
                            <p className="text-[11px] text-emerald-600 font-medium">
                              Ganancia: ${item.estimated_profit.toFixed(2)}
                            </p>
                          </div>


                          <div className="border-l border-slate-200 pl-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Real
                            </span>
                            <p className="mt-0.5 font-bold text-slate-900">
                              {item.sold_quantity} uds
                            </p>
                            <p className="text-[11px] text-slate-600">
                              Venta: ${item.real_sales.toFixed(2)}
                            </p>
                            <p className={`text-[11px] font-bold ${item.real_profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                              Ganancia: ${item.real_profit.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Footer: Cantidad Restante */}
                      <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                        <span className="text-slate-500">Restante para la meta:</span>
                        <span className="font-extrabold text-slate-800">
                          {item.remaining_quantity === 0 && item.is_exceeded
                            ? '0 uds (Completada)'
                            : `${item.remaining_quantity} uds`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 2: HISTORIAL DE PREVISIONES */}
        {/* ========================================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-100 text-pink-600">
                    <History size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Historial de Previsiones Finalizadas y Anteriores
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  {history.length} previsiones registradas
                </span>
              </div>

              {isHistoryLoading ? (
                <div className="flex items-center justify-center p-12 text-slate-400">
                  <Loader2 size={24} className="animate-spin text-pink-600" />
                  <span className="ml-2 text-xs">Cargando historial...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No hay previsiones archivadas aún. Al reiniciar la previsión activa, quedará guardada en este historial.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-5 py-3">Estado</th>
                        <th className="px-5 py-3">Fecha Inicio</th>
                        <th className="px-5 py-3">Fecha Cierre</th>
                        <th className="px-5 py-3 text-right">Productos</th>
                        <th className="px-5 py-3 text-right">Cant. Estimada</th>
                        <th className="px-5 py-3 text-right">Cant. Vendida</th>
                        <th className="px-5 py-3 text-right">Venta Real</th>
                        <th className="px-5 py-3 text-right">Ganancia Real</th>
                        <th className="px-5 py-3 text-center">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.map((h) => {
                        const isAct = h.status === 'ACTIVE';
                        const fulfillRate =
                          h.total_estimated_quantity > 0
                            ? Math.round((h.total_sold_quantity / h.total_estimated_quantity) * 1000) / 10
                            : 0;

                        return (
                          <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3.5">
                              {isAct ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  ACTIVA
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                  ARCHIVADA
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-medium text-slate-700">
                              {formatDateTime(h.started_at)}
                            </td>
                            <td className="px-5 py-3.5 text-slate-500">
                              {h.finished_at ? formatDateTime(h.finished_at) : 'En curso'}
                            </td>
                            <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                              {h.items_count}
                            </td>
                            <td className="px-5 py-3.5 text-right text-slate-600">
                              {h.total_estimated_quantity} uds
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                              {h.total_sold_quantity} uds ({fulfillRate}%)
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                              ${h.total_real_sales.toFixed(2)}
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-emerald-600">
                              ${h.total_real_profit.toFixed(2)}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <button
                                onClick={() => handleOpenHistoryDetail(h.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-pink-600 transition-colors shadow-2xs"
                              >
                                <Eye size={13} />
                                <span>Ver</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: REINICIAR PREVISIÓN */}
        {/* ========================================================================= */}
        {isResetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsResetModalOpen(false)}
            />

            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
                    <RotateCcw size={16} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Cierre de Ventas</h3>
                </div>
                <button
                  onClick={() => setIsResetModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-600">
                <p className="font-medium text-slate-700">
                  ¿Estás seguro de que deseas reiniciar la previsión actual?
                </p>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-amber-600 shrink-0" />
                    El historial se mantendrá intacto
                  </p>
                  <p className="text-[11px] text-amber-800">
                    • La previsión actual se guardará como histórico con sus resultados finales.
                    <br />
                    • La nueva previsión iniciará un nuevo ciclo con su propia fecha y hora.
                    <br />
                    • Las nuevas ventas se calcularán solo a partir de la nueva fecha.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Notas u objetivo de este cierre <span className="text-slate-400">(Opcional)</span>:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Cierre de jornada semanal / fin de lote de galletas"
                    value={resetNotes}
                    onChange={(e) => setResetNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  disabled={isResetting}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  disabled={isResetting}
                  className="flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-pink-600/20 hover:bg-pink-700 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isResetting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Reiniciando...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw size={14} />
                      <span>Confirmar y Reiniciar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: DETALLE HISTÓRICO */}
        {/* ========================================================================= */}
        {viewingHistoryId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => {
                setViewingHistoryId(null);
                setHistoryDetail(null);
              }}
            />

            <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
                    <History size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Detalle de Previsión Histórica
                    </h3>
                    {historyDetail && (
                      <p className="text-[11px] text-slate-500">
                        {formatDateTime(historyDetail.prediction.started_at)} →{' '}
                        {historyDetail.prediction.finished_at
                          ? formatDateTime(historyDetail.prediction.finished_at)
                          : 'Presente'}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setViewingHistoryId(null);
                    setHistoryDetail(null);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              {isHistoryDetailLoading || !historyDetail ? (
                <div className="flex items-center justify-center p-12 text-slate-400">
                  <Loader2 size={24} className="animate-spin text-pink-600" />
                  <span className="ml-2 text-xs">Cargando detalle...</span>
                </div>
              ) : (
                <div className="mt-4 space-y-4 text-xs">
                  {/* Totales consolidados */}
                  <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Unidades</span>
                      <p className="text-sm font-black text-slate-800">
                        {historyDetail.totals.total_sold_quantity} / {historyDetail.totals.total_estimated_quantity}
                      </p>
                      <span className="text-[10px] text-blue-600 font-bold">
                        {historyDetail.totals.overall_quantity_rate}% meta
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Venta Total</span>
                      <p className="text-sm font-black text-slate-900">
                        ${historyDetail.totals.total_real_sales.toFixed(2)}
                      </p>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Est: ${historyDetail.totals.total_estimated_sales.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Ganancia Total</span>
                      <p className="text-sm font-black text-emerald-600">
                        ${historyDetail.totals.total_real_profit.toFixed(2)}
                      </p>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Est: ${historyDetail.totals.total_estimated_profit.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {historyDetail.prediction.notes && (
                    <div className="rounded-xl bg-pink-50/60 p-3 border border-pink-100 text-pink-950">
                      <span className="font-bold text-[11px]">Notas del período:</span>
                      <p className="mt-0.5 text-xs text-slate-700">{historyDetail.prediction.notes}</p>
                    </div>
                  )}

                  {/* Tabla de Productos del histórico */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                        <tr>
                          <th className="px-3.5 py-2.5">Producto</th>
                          <th className="px-3.5 py-2.5 text-right">Est.</th>
                          <th className="px-3.5 py-2.5 text-right">Vendido</th>
                          <th className="px-3.5 py-2.5 text-right">Venta Real</th>
                          <th className="px-3.5 py-2.5 text-right">Ganancia Real</th>
                          <th className="px-3.5 py-2.5 text-right">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {historyDetail.items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="px-3.5 py-2.5 font-bold text-slate-800">{item.product_name}</td>
                            <td className="px-3.5 py-2.5 text-right text-slate-500">{item.estimated_quantity}</td>
                            <td className="px-3.5 py-2.5 text-right font-bold text-slate-800">{item.sold_quantity}</td>
                            <td className="px-3.5 py-2.5 text-right text-slate-900">${item.real_sales.toFixed(2)}</td>
                            <td className="px-3.5 py-2.5 text-right font-bold text-emerald-600">${item.real_profit.toFixed(2)}</td>
                            <td className="px-3.5 py-2.5 text-right font-bold text-pink-600">{item.fulfillment_rate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

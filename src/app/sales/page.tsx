'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { useSalesStore } from '@/stores/sales.store';
import { useAuthStore } from '@/stores/auth.store';
import { formatCurrencyUsd, formatCurrencyBs } from '@/lib/utils';
import { ShoppingCart, User, Plus, Minus, Trash, Check, Loader2 } from 'lucide-react';
import { SaleStatus } from '@/types';

export default function SalesPage() {
  const { clients } = useClients();
  const { products, isLoading: productsLoading } = useProducts();
  const { createSale, isCreating } = useSales();
  const { exchangeRate } = useExchangeRate();
  const currentUser = useAuthStore((state) => state.user);

  // Zustand Store
  const {
    items,
    client_id,
    status,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setClientId,
    setStatus,
    setExchangeRate,
    calculateTotal,
  } = useSalesStore();

  // Sincronizar tasa de cambio en Zustand
  useEffect(() => {
    if (exchangeRate) {
      setExchangeRate(Number(exchangeRate.rate));
    }
  }, [exchangeRate, setExchangeRate]);

  const { totalUsd, totalBs } = calculateTotal();
  const [successMessage, setSuccessMessage] = useState('');

  const handleCheckout = async () => {
    if (!client_id) {
      alert('Por favor, selecciona un cliente para completar la venta.');
      return;
    }
    if (items.length === 0) {
      alert('Agrega al menos un producto a la venta.');
      return;
    }

    try {
      const payload = {
        client_id,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.price_usd,
        })),
        total_usd: totalUsd,
        total_bs: totalBs,
        status,
        created_by: currentUser?.id || null,
      };

      await createSale(payload);
      
      // Limpiar el carrito y mostrar éxito
      clearCart();
      setSuccessMessage('¡Venta registrada con éxito!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      alert(`Error al registrar la venta: ${err.message}`);
    }
  };

  return (
    <MainLayout title="Registrar Venta">
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Columna Izquierda: Selección de Cliente y Catálogo de Productos (Col-span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Selección de Cliente */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
              <User size={16} className="text-pink-500" />
              <span>Cliente de la Venta</span>
            </h3>
            
            <select
              value={client_id || ''}
              onChange={(e) => setClientId(e.target.value || null)}
              className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
            >
              <option value="">-- Seleccionar Cliente --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Catálogo de Productos */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Productos Disponibles</h3>
            
            {productsLoading ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                Cargando catálogo...
              </div>
            ) : products.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">
                No hay productos en el catálogo. Ve a la sección de Productos para agregar.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-pink-200 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{prod.name}</p>
                      <p className="text-sm font-black text-pink-600 mt-1">
                        {formatCurrencyUsd(prod.price_usd)}
                      </p>
                    </div>
                    <button
                      onClick={() => addItem(prod)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-600 hover:text-white transition-colors"
                      title="Agregar al Carrito"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Resumen del Carrito y Cierre (Check Out) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between h-fit">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
              <ShoppingCart size={18} className="text-pink-500" />
              <span>Resumen de Venta</span>
            </h3>

            {successMessage && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm font-semibold text-emerald-800">
                <Check size={16} className="text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Lista del carrito */}
            {items.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-slate-400 border border-dashed border-slate-100 rounded-xl my-2">
                <ShoppingCart size={28} className="stroke-[1.5] mb-2" />
                <p className="text-xs">El carrito está vacío</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto mb-4 pr-1">
                {items.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <div className="flex-1 pr-2 truncate">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {formatCurrencyUsd(item.price_usd)} c/u
                      </p>
                    </div>
                    
                    {/* Controles de cantidad */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="h-6 w-6 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold text-slate-800 w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="h-6 w-6 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        <Plus size={12} />
                      </button>
                      
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="ml-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selección de Tipo de Pago / Estatus */}
            <div className="border-t border-slate-100 pt-4 mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Condición / Estado de Cobro
                </label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {(['PAID', 'PENDING', 'PARTIAL'] as SaleStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                        status === st
                          ? 'bg-pink-600 border-pink-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {st === 'PAID' ? 'PAGADO' : st === 'PENDING' ? 'PENDIENTE' : 'ABONO PARCIAL'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Totales y checkout */}
          <div className="border-t border-slate-100 pt-4 mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">Total USD:</span>
              <span className="text-xl font-black text-slate-800">
                {formatCurrencyUsd(totalUsd)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-amber-50/50 px-3 py-2 text-xs border border-amber-100/50">
              <span className="font-semibold text-amber-800">Equivalente en Bs:</span>
              <span className="font-black text-amber-900">{formatCurrencyBs(totalBs)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCreating || items.length === 0 || !client_id}
              className="w-full rounded-xl bg-pink-600 py-3 text-sm font-bold text-white shadow-md shadow-pink-500/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Procesando venta...</span>
                </>
              ) : (
                <span>Registrar Venta</span>
              )}
            </button>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}

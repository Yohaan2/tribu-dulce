'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { useSalesStore } from '@/stores/sales.store';
import { useAuthStore } from '@/stores/auth.store';
import { formatCurrencyUsd, formatCurrencyBs } from '@/lib/utils';
import { ShoppingCart, User, Plus, Minus, Trash, Check, Loader2, Save } from 'lucide-react';
import { Client, SaleStatus } from '@/types';
import SelectInput, { SelectOption } from '@/components/ui/select-input';

export default function SalesPage() {
  const { clients, getClientById } = useClients(1, 10);
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

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const [partialPayment, setPartialPayment] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedClient, setSearchedClient] = useState<Client | null>(null);
  const [clientNotFound, setClientNotFound] = useState(false);

  const clientOptions: SelectOption[] = useMemo(() => {
    if (clientNotFound) return [];

    const options = [
      { value: '', label: 'Seleccionar Cliente' },
      ...clients.map((c) => ({
        value: c.id,
        label: c.name + (c.phone ? ` (${c.phone})` : ''),
      })),
    ];
    if (searchedClient && !options.some((o) => o.value === searchedClient.id)) {
      options.push({
        value: searchedClient.id,
        label: searchedClient.name + (searchedClient.phone ? ` (${searchedClient.phone})` : ''),
      });
    }
    return options;
  }, [clients, searchedClient, clientNotFound]);

  const handleCheckout = async () => {
    if (!client_id) {
      alert('Por favor, selecciona un cliente para completar la venta.');
      return;
    }
    if (items.length === 0) {
      alert('Agrega al menos un producto a la venta.');
      return;
    }

    if (status === 'PARTIAL') {
      const amt = parseFloat(partialPayment);
      if (isNaN(amt) || amt <= 0) {
        alert('Por favor, ingresa un monto de abono parcial válido y mayor a cero.');
        return;
      }
      if (amt >= totalUsd) {
        alert('El abono parcial debe ser menor al total de la venta. Si pagó todo el monto, seleccione la opción PAGADO.');
        return;
      }
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
        partial_payment_usd: status === 'PARTIAL' ? parseFloat(partialPayment) : null,
      };

      await createSale(payload);

      // Limpiar el carrito y mostrar éxito
      clearCart();
      setPartialPayment('');
      setSuccessMessage('¡Venta registrada con éxito!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      alert(`Error al registrar la venta: ${err.message}`);
    }
  };

  const handleSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchedClient(null);
      setClientNotFound(false);
      return;
    }
    setIsSearching(true);
    try {
      const client = await getClientById(trimmed);
      setSearchedClient(client);
      setClientId(client.id);
      setClientNotFound(false);
    } catch {
      setSearchedClient(null);
      setClientNotFound(true);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <>
      <MainLayout title="Registrar Venta" >
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Columna Izquierda: Selección de Cliente y Catálogo de Productos (Col-span 2) */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. Selección de Cliente */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <User size={16} className="text-pink-500" />
                <span>Cliente de la Venta</span>
              </h3>

              <SelectInput
                options={clientOptions}
                value={client_id || ''}
                onChange={(value) => setClientId(value || null)}
                onSearch={handleSearch}
                isSearching={isSearching}
                placeholder="Seleccionar Cliente"
                className="space-y-0!"
              />
            </div>

            {/* 2. Catálogo de Productos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700">Productos Disponibles</h3>
                {exchangeRate && (
                  <span className="text-xs font-semibold text-slate-500">
                    Tasa: {exchangeRate.rate} Bs/$
                  </span>
                )}
              </div>

              {productsLoading ? (
                <div className="flex h-40 items-center justify-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  Cargando catálogo...
                </div>
              ) : products.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                  No hay productos en el catálogo. Ve a la sección de Productos para agregar.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {products.map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-pink-200 transition-colors"
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
          <div className="flex flex-col justify-between h-fit space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart size={18} className="text-pink-500" />
                <span>Resumen de Venta</span>
              </h3>

              {successMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm font-semibold text-emerald-800">
                  <Check size={16} className="text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Lista del carrito */}
              {items.length === 0 ? (
                <div className="flex h-20 flex-col items-center justify-center text-slate-400 rounded-2xl my-2">
                  <ShoppingCart size={28} className="stroke-[1.5] mb-2" />
                  <p className="text-xs">El carrito está vacío</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto mb-4 pr-1">
                  {items.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100"
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
                          className="h-6 w-6 flex items-center justify-center rounded bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-bold text-slate-800 w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="h-6 w-6 flex items-center justify-center rounded bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
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
              <div className="py-4 space-y-3">
                <div>
                  <label className="block text-sm font-bold text-slate-800">
                    Condición / Estado de Cobro
                  </label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {(['PAID', 'PENDING', 'PARTIAL'] as SaleStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatus(st)}
                        className={`py-2 rounded-lg text-xs font-bold border transition-colors ${status === st
                          ? 'bg-pink-600 border-pink-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        {st === 'PAID' ? 'PAGADO' : st === 'PENDING' ? 'PENDIENTE' : 'ABONO PARCIAL'}
                      </button>
                    ))}
                  </div>
                </div>

                {status === 'PARTIAL' && (
                  <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 border border-slate-100/80 animate-fade-in animate-duration-200">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Monto de Abono (USD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={partialPayment}
                        onChange={(e) => setPartialPayment(e.target.value)}
                        placeholder="0.00"
                        className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                      />
                    </div>
                    {(() => {
                      const abono = parseFloat(partialPayment) || 0;
                      const remainingUsd = Math.max(0, totalUsd - abono);
                      const remainingBs = remainingUsd * (exchangeRate ? Number(exchangeRate.rate) : 40);
                      return (
                        <div className="flex flex-col gap-1.5 text-xs font-semibold border-t border-slate-200/50 pt-2.5">
                          <div className="flex justify-between text-slate-600">
                            <span>Queda debiendo:</span>
                            <span className="text-rose-600 font-extrabold">{formatCurrencyUsd(remainingUsd)}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Equivalente en Bs:</span>
                            <span className="text-rose-600 font-extrabold">{formatCurrencyBs(remainingBs)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Totales y checkout pegado abajo en móvil */}
        <div className="
        fixed bottom-16 left-0 right-0 z-20 bg-white border-t border-slate-100 px-5 py-4 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]
        md:relative md:bottom-auto md:left-auto md:right-auto md:z-0 md:bg-white md:border md:border-slate-100 md:rounded-2xl md:p-5 md:shadow-sm md:space-y-4
      ">
          <div className="flex items-end justify-between mb-4 md:mb-0">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total a cobrar
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl md:text-3xl font-black text-[#541919] tracking-tight">
                  {formatCurrencyUsd(totalUsd)}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  / {formatCurrencyBs(totalBs)}
                </span>
              </div>
            </div>

            <div className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-600 border border-stone-200/50">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isCreating || items.length === 0 || !client_id}
            className="w-full rounded-xl bg-[#541919] py-3.5 text-sm font-bold text-white shadow-md shadow-[#541919]/10 hover:bg-[#421313] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 md:mt-4"
          >
            {isCreating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Procesando venta...</span>
              </>
            ) : (
              <>
                <Save size={16} className="stroke-[2.5]" />
                <span>Guardar Venta</span>
              </>
            )}
          </button>

        </div>
        {/* Espaciador para evitar solapamiento del panel fijo inferior en móvil */}
        <div className="h-20 md:hidden" />
      </MainLayout>
    </>
  );
}

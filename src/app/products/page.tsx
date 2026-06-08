'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useProducts } from '@/hooks/useProducts';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import {
  Package,
  DollarSign,
  Plus,
  Trash2,
  Pencil,
  X,
  Cake,
  Cookie,
  IceCream,
  Utensils,
} from 'lucide-react';
import { formatCurrencyUsd, formatCurrencyBs } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  price_usd: number;
}

export default function ProductsPage() {
  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useProducts();
  const { exchangeRate } = useExchangeRate();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const getProductIconAndCategory = (productName: string) => {
    const lowerName = productName.toLowerCase();
    if (
      lowerName.includes('torta') ||
      lowerName.includes('cake') ||
      lowerName.includes('pastel') ||
      lowerName.includes('pie') ||
      lowerName.includes('tart')
    ) {
      return { icon: Cake, category: 'PASTELERÍA' };
    }
    if (
      lowerName.includes('cookie') ||
      lowerName.includes('galleta') ||
      lowerName.includes('polvorosa') ||
      lowerName.includes('alfajor')
    ) {
      return { icon: Cookie, category: 'GALLETERÍA' };
    }
    if (
      lowerName.includes('brownie') ||
      lowerName.includes('helado') ||
      lowerName.includes('postre') ||
      lowerName.includes('mousse') ||
      lowerName.includes('copa') ||
      lowerName.includes('trufa') ||
      lowerName.includes('quesillo')
    ) {
      return { icon: IceCream, category: 'POSTRES' };
    }
    return { icon: Utensils, category: 'OTROS' };
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price_usd.toString());
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (editingProduct) {
        // Edit Mode
        await updateProduct({
          id: editingProduct.id,
          input: {
            name: name.trim(),
            price_usd: parseFloat(price),
          },
        });
      } else {
        // Create Mode
        await createProduct({
          name: name.trim(),
          price_usd: parseFloat(price),
        });
      }
      setIsModalOpen(false);
      setName('');
      setPrice('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        '¿Estás seguro de que deseas eliminar este producto? Esto podría fallar si tiene ventas asociadas.'
      )
    ) {
      try {
        await deleteProduct(id);
      } catch (err: any) {
        alert(err.message || 'No se pudo eliminar el producto');
      }
    }
  };

  return (
    <MainLayout title="Gestión de Productos">
      <div className="relative pb-16">
        {/* Listado de Tarjetas */}
        <div className="max-w-2xl mx-auto space-y-4">
          {isLoading ? (
            <div className="flex h-60 items-center justify-center text-sm text-slate-400">
              Cargando catálogo de productos...
            </div>
          ) : products.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <Package size={40} className="mb-2 stroke-[1.5] text-slate-300" />
              <p className="text-sm">No hay productos registrados en el sistema.</p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-md shadow-primary/10 hover:opacity-90 active:scale-95 transition-all"
              >
                Registrar Primer Producto
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1">
              {products.map((product) => {
                const { icon: IconComponent, category } = getProductIconAndCategory(product.name);
                const priceBs = product.price_usd * (exchangeRate?.rate || 0);

                return (
                  <div
                    key={product.id}
                    className="relative flex flex-col rounded-2xl border border-slate-100/80 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in"
                  >
                    {/* Header de la Tarjeta (Icono + Acciones) */}
                    <div className="flex items-start justify-between">
                      {/* Icono de Categoría */}
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-50 text-pink-600 shadow-sm border border-pink-100/30">
                        <IconComponent size={24} className="stroke-[1.75]" />
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-slate-50 transition-colors"
                          title="Editar Producto"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-error hover:bg-slate-50 transition-colors"
                          title="Eliminar Producto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Nombre y Categoría */}
                    <div className="mt-4">
                      <h4 className="text-base font-bold text-slate-800 tracking-tight leading-tight">
                        {product.name}
                      </h4>
                      <p className="mt-1 text-[10px] font-bold text-slate-400 tracking-wider">
                        {category}
                      </p>
                    </div>

                    {/* Divisor */}
                    <hr className="my-4 border-slate-100" />

                    {/* Precios (USD / Bs.) */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-medium text-slate-400">Precio USD</p>
                        <p className="text-lg font-bold text-primary tracking-tight mt-0.5">
                          {formatCurrencyUsd(product.price_usd)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-medium text-slate-400">Precio Bs</p>
                        <p className="text-sm font-bold text-slate-700 tracking-tight mt-0.5">
                          {exchangeRate ? formatCurrencyBs(priceBs) : '---'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Botón Acción Flotante (FAB) */}
        <button
          onClick={handleOpenCreateModal}
          className="fixed bottom-20 md:bottom-8 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-200"
          title="Agregar Producto"
        >
          <Plus size={24} className="stroke-[2.5]" />
        </button>

        {/* Modal / Dialog interactivo */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div
              className="relative w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Encabezado del Modal */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Package size={18} className="text-primary" />
                  <span>
                    {editingProduct ? 'Editar Producto' : 'Registrar Nuevo Producto'}
                  </span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Nombre del Producto
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Torta de Chocolate XL"
                    className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Precio (USD)
                  </label>
                  <div className="relative mt-1.5 rounded-lg shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <DollarSign size={14} />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="block w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {errorMsg && <p className="text-xs font-semibold text-error">{errorMsg}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !name.trim() || !price}
                    className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-bold text-white shadow-md shadow-primary/10 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
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

'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useClients } from '@/hooks/useClients';
import {
  Users,
  Phone,
  Plus,
  Trash2,
  Pencil,
  X,
  Clock,
} from 'lucide-react';
import SelectInput, { SelectOption } from '@/components/ui/select-input';

interface Client {
  id: string;
  name: string;
  phone: string | null;
}

export default function ClientsPage() {
  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('0412');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const phoneCodeOptions: SelectOption[] = [
    { value: '0412', label: '0412' },
    { value: '0422', label: '0422' },
    { value: '0414', label: '0414' },
    { value: '0424', label: '0424' },
    { value: '0426', label: '0426' },
    { value: '0416', label: '0416' },
  ];

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleOpenCreateModal = () => {
    setEditingClient(null);
    setName('');
    setPhone('');
    setCountryCode('0412');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    const phoneCode = ['0412', '0414', '0424', '0416', '0426'];
    const extractedCode = phoneCode.find(code => client.phone?.startsWith(code));
    const phoneWithoutCountry = client.phone?.replace(`${extractedCode}`, '') || '';
    setEditingClient(client);
    setName(client.name);
    setPhone(phoneWithoutCountry);
    setCountryCode(extractedCode || '0412');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const fullPhone = phone.trim() ? `${countryCode}${phone.trim()}` : null;
      
      if (editingClient) {
        // Edit Mode
        await updateClient({
          id: editingClient.id,
          input: {
            name: name.trim(),
            phone: fullPhone,
          },
        });
      } else {
        // Create Mode
        await createClient({
          name: name.trim(),
          phone: fullPhone,
        });
      }
      setIsModalOpen(false);
      setName('');
      setPhone('');
      setCountryCode('0412');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar el cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        '¿Estás seguro de que deseas eliminar este cliente? Esto podría fallar si tiene ventas asociadas.'
      )
    ) {
      try {
        await deleteClient(id);
      } catch (err: any) {
        alert(err.message || 'No se pudo eliminar el cliente');
      }
    }
  };

  return (
    <MainLayout title="Gestión de Clientes">
      <div className="relative pb-16">
        {/* Listado de Tarjetas */}
        <div className="max-w-2xl mx-auto space-y-4">
          {isLoading ? (
            <div className="flex h-60 items-center justify-center text-sm text-slate-400">
              Cargando lista de clientes...
            </div>
          ) : clients.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <Users size={40} className="mb-2 stroke-[1.5] text-slate-300" />
              <p className="text-sm">No hay clientes registrados en el sistema.</p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-md shadow-primary/10 hover:opacity-90 active:scale-95 transition-all"
              >
                Registrar Primer Cliente
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="relative flex flex-col rounded-2xl border border-slate-100/80 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in"
                >
                  {/* Header de la Tarjeta (Iniciales + Acciones) */}
                  <div className="flex items-start justify-between">
                    {/* Iniciales del Cliente */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-50 text-pink-600 shadow-sm border border-pink-100/30">
                      <span className="text-lg font-bold tracking-tight">
                        {getInitials(client.name)}
                      </span>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(client)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-slate-50 transition-colors"
                        title="Editar Cliente"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-error hover:bg-slate-50 transition-colors"
                        title="Eliminar Cliente"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Nombre y Teléfono */}
                  <div className="mt-4">
                    <h4 className="text-base font-bold text-slate-800 tracking-tight leading-tight">
                      {client.name}
                    </h4>
                    {client.phone && (
                      <p className="mt-1 text-xs font-medium text-slate-500 flex items-center gap-1">
                        <Phone size={12} className="text-slate-400" />
                        {client.phone}
                      </p>
                    )}
                  </div>

                  {/* Divisor */}
                  <hr className="my-4 border-slate-100" />

                  {/* Estadísticas (Total Comprado / Deuda Pendiente) */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-medium text-slate-400">Total Comprado</p>
                      <p className="text-lg font-bold text-primary tracking-tight mt-0.5">
                        ${(client.total_purchased || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-medium text-slate-400">Deuda Pendiente</p>
                      <p className={`text-sm font-bold tracking-tight mt-0.5 ${(client.debt_pending || 0) > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                        ${(client.debt_pending || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón Acción Flotante (FAB) */}
        <button
          onClick={handleOpenCreateModal}
          className="fixed bottom-20 md:bottom-8 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-200"
          title="Agregar Cliente"
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
                  <Users size={18} className="text-primary" />
                  <span>
                    {editingClient ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
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
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Roberto Guzmán"
                    className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Teléfono de Contacto
                  </label>
                  <div className="relative mt-1.5 rounded-lg flex gap-2">
                    <div className="w-24">
                      <SelectInput
                        options={phoneCodeOptions}
                        value={countryCode}
                        onChange={setCountryCode}
                        placeholder="Código"
                        className="space-y-0!"
                      />
                    </div>
                    <div className="relative flex-1">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Phone size={14} />
                      </div>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej. 1234567"
                        className="block w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
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
                    disabled={isSubmitting || !name.trim()}
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

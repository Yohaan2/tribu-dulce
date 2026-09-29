'use client';

import { useState } from 'react';
import { Pencil, Trash2, UserCheck, UserX } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useUsers } from '@/hooks/useUsers';
import { UserProfile } from '@/types';

type FormState = {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'EMPLOYEE';
};

const emptyForm: FormState = {
  name: '',
  email: '',
  password: '',
  role: 'EMPLOYEE',
};

export default function UsersPage() {
  const { users, isLoading, error: loadError, create, update, remove } = useUsers();
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function openForm(user?: UserProfile) {
    setEditing(user || null);
    setForm(
      user
        ? {
            name: user.name,
            email: user.email || '',
            role: user.role as FormState['role'],
            password: '',
          }
        : emptyForm
    );
    setError('');
    setOpen(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      if (editing) {
        await update({
          id: editing.id,
          input: {
            name: form.name,
            email: form.email,
            role: form.role,
            ...(form.password ? { password: form.password } : {}),
          },
        });
      } else {
        await create(form);
      }
      setOpen(false);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function changeState(user: UserProfile, deleteUser = false) {
    const action = deleteUser
      ? 'eliminar definitivamente'
      : user.is_active
        ? 'desactivar'
        : 'reactivar';
    if (!window.confirm(`¿Deseas ${action} a ${user.name}?`)) return;

    try {
      if (deleteUser) await remove(user.id);
      else await update({ id: user.id, input: { is_active: !user.is_active } });
      setError('');
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return (
    <MainLayout title="Gestión de usuarios">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Usuarios</h2>
            <p className="text-sm text-slate-500">Gestiona accesos y roles del equipo.</p>
          </div>
          <button
            onClick={() => openForm()}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Nuevo usuario
          </button>
        </div>

        {(error || loadError) && (
          <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            {error || loadError?.message}
          </p>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-500">Cargando usuarios...</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-4">Nombre</th>
                  <th className="p-4">Correo</th>
                  <th className="p-4">Rol</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100 text-slate-700">
                    <td className="p-4 font-semibold">{user.name}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">
                      {user.role === 'EMPLOYEE' ? 'Vendedor' : user.role}
                    </td>
                    <td className="p-4">{user.is_active ? 'Activo' : 'Inactivo'}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {user.role !== 'SUPERADMIN' && (
                          <>
                            <button
                              type="button"
                              onClick={() => openForm(user)}
                              aria-label={`Editar a ${user.name}`}
                              title="Editar"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            >
                              <Pencil size={16} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => changeState(user)}
                              aria-label={`${user.is_active ? 'Desactivar' : 'Reactivar'} a ${user.name}`}
                              title={user.is_active ? 'Desactivar' : 'Reactivar'}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            >
                              {user.is_active ? (
                                <UserX size={16} aria-hidden="true" />
                              ) : (
                                <UserCheck size={16} aria-hidden="true" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => changeState(user, true)}
                              aria-label={`Eliminar a ${user.name}`}
                              title="Eliminar"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <form
              onSubmit={submit}
              className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
            >
              <h3 className="text-lg font-bold text-slate-800">
                {editing ? 'Editar usuario' : 'Nuevo usuario'}
              </h3>
              <label className="block text-sm font-medium text-slate-700">
                Nombre
                <input
                  required
                  minLength={2}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Correo
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Contraseña {editing && '(dejar en blanco para conservar)'}
                <input
                  type="password"
                  required={!editing}
                  minLength={8}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Rol
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as FormState['role'] })}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2"
                >
                  <option value="EMPLOYEE">Vendedor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </label>

              {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
                >
                  Cancelar
                </button>
                <button
                  disabled={busy}
                  className="rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {busy ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

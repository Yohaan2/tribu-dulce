'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data.user) {
        // Obtener el perfil del usuario
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Error obteniendo perfil:', profileError);
        }

        const user = {
          id: data.user.id,
          name: profileData?.name || data.user.email?.split('@')[0] || 'Usuario',
          role: profileData?.role || 'EMPLOYEE',
          created_at: profileData?.created_at || data.user.created_at,
        };

        setUser(user);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (role: 'ADMIN' | 'EMPLOYEE') => {
    setLoading(true);
    setError('');

    try {
      // Para desarrollo rápido, usar credenciales de prueba
      const testEmail = role === 'ADMIN' ? 'admin.tribudulce@gmail.com' : 'employee.tribudulce@gmail.com';
      const testPassword = 'test123456';

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (signInError) {
        // Si el usuario no existe, crearlo
        if (signInError.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword
          });

          if (signUpError) {
            throw signUpError;
          }

          if (signUpData.user) {
            // Crear perfil manualmente
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: signUpData.user.id,
                name: role === 'ADMIN' ? 'Tribu Admin (Gaby)' : 'Juan Vendedor',
                role: role,
              });

            if (profileError) {
              console.error('Error creando perfil:', profileError);
            }

            const user = {
              id: signUpData.user.id,
              name: role === 'ADMIN' ? 'Tribu Admin (Gaby)' : 'Juan Vendedor',
              role: role,
              created_at: signUpData.user.created_at,
            };

            setUser(user);
            router.push('/dashboard');
            return;
          }
        }
        throw signInError;
      }

      if (data.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const user = {
          id: data.user.id,
          name: profileData?.name || data.user.email?.split('@')[0] || 'Usuario',
          role: profileData?.role || role,
          created_at: profileData?.created_at || data.user.created_at,
        };

        setUser(user);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión rápido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Círculos decorativos de fondo con difuminado (Glows) */}
      <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-pink-600/20 blur-3xl" />
      <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-rose-500/20 blur-3xl" />

      {/* Tarjeta de login principal */}
      <div className="z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
        {/* Encabezado Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-lg shadow-pink-500/20">
            <span className="text-2xl font-black">TD</span>
          </div>
          <h2 className="mt-6 text-2xl font-black tracking-tight text-white md:text-3xl">
            Tribu <span className="text-pink-500">Dulce</span>
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Gestión de Ventas y Cuentas por Cobrar
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleCredentialsLogin} className="mt-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-semibold text-rose-400">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Correo Electrónico
            </label>
            <div className="relative mt-1.5 rounded-lg shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@tribudulce.com"
                className="block w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition-colors focus:border-pink-500 focus:bg-white/10 focus:ring-1 focus:ring-pink-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contraseña
              </label>
            </div>
            <div className="relative mt-1.5 rounded-lg shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 shadow-inner outline-none transition-colors focus:border-pink-500 focus:bg-white/10 focus:ring-1 focus:ring-pink-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-pink-600 py-3 text-sm font-bold text-white shadow-md shadow-pink-500/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Ingresar'}
            {!isSubmitting && <ArrowRight size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}

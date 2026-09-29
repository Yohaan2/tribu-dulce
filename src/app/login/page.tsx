'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { createClient } from '@/lib/supabase/client';
import { setClientAuth } from '@/lib/auth/client';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Manejar el parámetro de sesión expirada de forma segura para evitar problemas de compilación estática de Next.js
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reason') === 'session_expired') {
        setError('Tu sesión ha expirado');
      }
    }
  }, []);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const provider = (process.env.NEXT_PUBLIC_DATABASE_PROVIDER || 'postgres').toLowerCase();

    try {
      if (provider !== 'supabase') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Error al iniciar sesión');
        }

        const { token, user } = result.data;
        setClientAuth(token, user);
        setUser(user);
        router.push('/dashboard');
      } else {
        const supabase = createClient();
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
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#FCF8F7] px-6 py-12 select-none">
      <div className="w-full max-w-97.5">
        <div className="flex justify-center mb-8">
          <div>
            <Image
              src="/tribu-logo.png"
              alt="Tribu Dulce Logo"
              width={128}
              height={128}
              className="h-full w-full object-contain rounded-full"
              priority
            />
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#541919]">
            Bienvenido de nuevo
          </h1>
          <p className="mt-2 text-sm text-[#7A6E6D]">
            Ingresa a tu panel de administración
          </p>
        </div>

        <form onSubmit={handleCredentialsLogin} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 p-3.5 text-xs font-semibold text-rose-600 shadow-sm">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-bold text-[#7A6E6D]">
              Email
            </label>
            <div className="relative rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#7A6E6D]/50">
                <Mail size={18} />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@ejemplo.com"
                className="block w-full rounded-xl border border-stone-200 bg-white py-3.5 pl-11 pr-4 text-sm text-stone-800 placeholder-stone-400 outline-none transition-all focus:border-[#541919]/60 focus:ring-1 focus:ring-[#541919]/60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-bold text-[#7A6E6D]">
                Password
              </label>
              <button
                type="button"
                className="text-sm font-bold text-[#541919] hover:underline focus:outline-none"
              >
                Forgot Password
              </button>
            </div>
            <div className="relative rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#7A6E6D]/50">
                <Lock size={18} />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-xl border border-stone-200 bg-white py-3.5 pl-11 pr-11 text-sm text-stone-800 placeholder-stone-400 outline-none transition-all focus:border-[#541919]/60 focus:ring-1 focus:ring-[#541919]/60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-stone-400 hover:text-stone-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-[#541919] focus:ring-[#541919]/50"
            />
            <label htmlFor="remember-me" className="ml-2.5 text-sm font-bold text-[#7A6E6D]">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#541919] py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#421313] active:scale-[0.98] disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}</span>
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-sm font-bold text-[#7A6E6D]">
            ¿No tienes cuenta?{' '}
            <span className="font-extrabold text-[#541919] hover:underline cursor-pointer">
              Contacta al administrador
            </span>
          </p>
        </div>

      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { createClient } from '@/lib/supabase/client';
import { setClientAuth } from '@/lib/auth/client';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
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

  const handleQuickLogin = async (role: 'ADMIN' | 'EMPLOYEE') => {
    setLoading(true);
    setError('');

    const provider = (process.env.NEXT_PUBLIC_DATABASE_PROVIDER || 'postgres').toLowerCase();
    const testEmail = role === 'ADMIN' ? 'admin.tribudulce@gmail.com' : 'employee.tribudulce@gmail.com';
    const testPassword = 'test123456';

    try {
      if (provider !== 'supabase') {
        // Intentar iniciar sesión
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testEmail, password: testPassword }),
        });

        const loginResult = await loginRes.json();

        if (loginRes.ok && loginResult.success) {
          const { token, user } = loginResult.data;
          setClientAuth(token, user);
          setUser(user);
          router.push('/dashboard');
          return;
        }

        // Si falló por credenciales inválidas (el usuario no existe en Postgres local), lo registramos automáticamente
        if (loginRes.status === 401 || (loginResult.error && loginResult.error.includes('crede'))) {
          const registerRes = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: testEmail,
              password: testPassword,
              name: role === 'ADMIN' ? 'Tribu Admin (Gaby)' : 'Juan Vendedor',
              role: role,
            }),
          });

          const registerResult = await registerRes.json();
          if (!registerRes.ok || !registerResult.success) {
            throw new Error(registerResult.error || 'Error al registrar usuario de prueba');
          }

          const { token, user } = registerResult.data;
          setClientAuth(token, user);
          setUser(user);
          router.push('/dashboard');
        } else {
          throw new Error(loginResult.error || 'Error en inicio de sesión rápido');
        }
      } else {
        // Para desarrollo rápido, usar credenciales de prueba
        const supabase = createClient();
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
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión rápido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#FCF8F7] px-6 py-12 select-none">
      <div className="w-full max-w-[390px]">
        <div className="flex justify-center mb-8">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
            <div className="relative flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full border border-[#541919]/60 bg-white">
              <div className="absolute top-[12%] h-7 w-14 rounded-full bg-[#E5B5B2]/30 blur-[6px]" />
              <span className="z-10 text-[11px] font-extrabold tracking-wider text-[#541919] font-sans">
                TRIBU DULCE
              </span>
              <div className="mt-1 h-1.5 w-7 border-t-2 border-[#541919]/70 rounded-[50%]" />
            </div>
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

        <div className="mt-16 flex justify-center gap-4 text-[10px] text-stone-400/20">
          <button 
            type="button" 
            onClick={() => handleQuickLogin('ADMIN')}
            className="hover:text-stone-500 transition-colors"
          >
            • Admin
          </button>
          <button 
            type="button" 
            onClick={() => handleQuickLogin('EMPLOYEE')}
            className="hover:text-stone-500 transition-colors"
          >
            • Empleado
          </button>
        </div>
      </div>
    </div>
  );
}

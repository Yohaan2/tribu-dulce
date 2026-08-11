import { NextResponse } from 'next/server';
import { getDataSource, ProfileEntity } from '@/lib/db/postgres';
import { comparePassword } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/jwt';
import { AuditService } from '@/services/audit.service';

// Almacén básico en memoria para rate limiting
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5; // Máximo 5 intentos fallidos
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // Ventana de 15 minutos

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (!attempt) {
    return { allowed: true, remaining: RATE_LIMIT_MAX, resetTime: now + RATE_LIMIT_WINDOW };
  }

  if (now > attempt.resetTime) {
    loginAttempts.delete(ip);
    return { allowed: true, remaining: RATE_LIMIT_MAX, resetTime: now + RATE_LIMIT_WINDOW };
  }

  if (attempt.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetTime: attempt.resetTime };
  }

  return { allowed: true, remaining: RATE_LIMIT_MAX - attempt.count, resetTime: attempt.resetTime };
}

function incrementRateLimit(ip: string) {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (!attempt) {
    loginAttempts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    attempt.count += 1;
  }
}

function resetRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

export async function POST(request: Request) {
  // Obtener IP del cliente para el rate limiter
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  // Validar rate limiting
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    const minutesLeft = Math.ceil((rateLimit.resetTime - Date.now()) / 60000);
    return NextResponse.json(
      { 
        success: false, 
        error: `Demasiados intentos de inicio de sesión. Por favor, intenta de nuevo en ${minutesLeft} minutos.` 
      },
      { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000))
        }
      }
    );
  }

  try {
    const provider = process.env.DATABASE_PROVIDER?.toLowerCase() || 'postgres';
    if (provider === 'supabase') {
      return NextResponse.json(
        { success: false, error: 'Auth native endpoint not supported when using Supabase provider.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son requeridos.' },
        { status: 400 }
      );
    }

    const ds = await getDataSource();
    const profileRepo = ds.getRepository(ProfileEntity);

    // Buscar el usuario por email
    const user = await profileRepo.findOne({ where: { email } });
    if (!user) {
      incrementRateLimit(ip);
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas.' },
        { status: 401 }
      );
    }

    // Comparar la contraseña con el hash
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      incrementRateLimit(ip);
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas.' },
        { status: 401 }
      );
    }

    // Resetear rate limiting al iniciar sesión exitosamente
    resetRateLimit(ip);

    // Registrar inicio de sesión en auditoría
    await AuditService.record({
      user_id: user.id,
      action: 'USER_LOGIN',
      entity_type: 'user',
      entity_id: user.id,
      details: { email: user.email, role: user.role },
    });

    // Generar token JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Formatear datos de usuario de retorno (sin password_hash)
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: userResponse,
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('[src/app/api/auth/login/route.ts] status: 500, error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getDataSource, ProfileEntity } from '@/lib/db/postgres';
import { hashPassword } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/jwt';

export async function POST(request: Request) {
  try {
    const provider = process.env.DATABASE_PROVIDER?.toLowerCase() || 'postgres';
    if (provider === 'supabase') {
      return NextResponse.json(
        { success: false, error: 'Auth native endpoint not supported when using Supabase provider.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos (email, password, name) son requeridos.' },
        { status: 400 }
      );
    }

    const ds = await getDataSource();
    const profileRepo = ds.getRepository(ProfileEntity);

    // Verificar si el usuario ya existe
    const existingUser = await profileRepo.findOne({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'El email ya está registrado.' },
        { status: 400 }
      );
    }

    // Hashear contraseña
    const password_hash = await hashPassword(password);

    // Crear y guardar el perfil del usuario
    const newProfile = profileRepo.create({
      name,
      email,
      password_hash,
      role: role || 'EMPLOYEE',
    });

    const savedProfile = await profileRepo.save(newProfile);

    // Generar token JWT
    const token = generateToken({
      id: savedProfile.id,
      email: savedProfile.email,
      name: savedProfile.name,
      role: savedProfile.role,
    });

    // Retornar datos de respuesta del usuario (sin password_hash)
    const user = {
      id: savedProfile.id,
      name: savedProfile.name,
      email: savedProfile.email,
      role: savedProfile.role,
      created_at: savedProfile.created_at.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        token,
        user,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('[src/app/api/auth/register/route.ts] status: 500, error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al registrar usuario' },
      { status: 500 }
    );
  }
}

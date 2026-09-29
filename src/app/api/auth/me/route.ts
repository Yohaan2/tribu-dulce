import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/withAuth';
import { getDataSource, ProfileEntity } from '@/lib/db/postgres';
import { generateToken } from '@/lib/auth/jwt';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userPayload = req.user;
    if (!userPayload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: User payload not found' },
        { status: 401 }
      );
    }

    const ds = await getDataSource();
    const profileRepo = ds.getRepository(ProfileEntity);

    // Obtener los datos más frescos del usuario desde la DB
    const profile = await profileRepo.findOne({ where: { id: userPayload.id } });

    if (!profile || !profile.is_active || profile.deleted_at) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado en la base de datos' },
        { status: 404 }
      );
    }

    const user = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      is_active: profile.is_active,
      created_at: profile.created_at.toISOString(),
    };

    const token = generateToken({ id: profile.id, email: profile.email, name: profile.name, role: profile.role });
    const response = NextResponse.json({ success: true, data: { user, token } });
    response.cookies.set('auth_token', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 8 * 60 * 60,
    });
    return response;
  } catch (error: any) {
    console.error('[src/app/api/auth/me/route.ts] status: 500, error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener usuario actual' },
      { status: 500 }
    );
  }
});

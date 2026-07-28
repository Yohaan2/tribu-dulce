import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/withAuth';
import { getDataSource, ProfileEntity } from '@/lib/db/postgres';

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

    if (!profile) {
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
      created_at: profile.created_at.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error: any) {
    console.error('Error en /api/auth/me:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener usuario actual' },
      { status: 500 }
    );
  }
});

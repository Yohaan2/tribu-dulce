import { NextResponse } from 'next/server';
import { DashboardService } from '@/services/dashboard.service';
import { AuthenticatedRequest, withAuth } from '@/lib/auth/withAuth';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const stats = await DashboardService.getStats(request.user?.role === 'EMPLOYEE' ? request.user.id : undefined);
    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('[src/app/api/dashboard/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener estadísticas del dashboard' },
      { status: 500 }
    );
  }
});

import { NextResponse } from 'next/server';
import { DashboardService } from '@/services/dashboard.service';

export async function GET() {
  try {
    const stats = await DashboardService.getStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('[src/app/api/dashboard/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener estadísticas del dashboard' },
      { status: 500 }
    );
  }
}

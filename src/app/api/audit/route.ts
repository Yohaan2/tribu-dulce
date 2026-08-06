import { NextResponse } from 'next/server';
import { AuditService } from '@/services/audit.service';
import { withAuth, withRole } from '@/lib/auth/withAuth';

export const GET = withAuth(
  withRole('SUPERADMIN')(async () => {
    try {
      const logs = await AuditService.getAll(100);
      return NextResponse.json({ success: true, data: logs });
    } catch (error: any) {
      console.error('[src/app/api/audit/route.ts] status: 500, error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Error al obtener auditoría' },
        { status: 500 }
      );
    }
  })
);

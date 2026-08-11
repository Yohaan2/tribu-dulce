import { NextResponse } from 'next/server';
import { AuditService } from '@/services/audit.service';
import { withAuth, withRole, AuthenticatedRequest } from '@/lib/auth/withAuth';

export const GET = withAuth(
  withRole('SUPERADMIN')(async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const parsedPage = parseInt(searchParams.get('page') || '1', 10);
      const parsedLimit = parseInt(searchParams.get('limit') || '10', 10);
      const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
      const limit = Number.isNaN(parsedLimit) ? 10 : Math.max(1, parsedLimit);

      const startDate = searchParams.get('startDate') || undefined;
      const endDate = searchParams.get('endDate') || undefined;

      const { data, total, totalPages } = await AuditService.getAll(
        page,
        limit,
        startDate,
        endDate
      );

      return NextResponse.json({
        success: true,
        data,
        pagination: { page, limit, total, totalPages },
      });
    } catch (error: any) {
      console.error('[src/app/api/audit/route.ts] status: 500, error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Error al obtener auditoría' },
        { status: 500 }
      );
    }
  })
);

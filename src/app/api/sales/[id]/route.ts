import { NextResponse } from 'next/server';
import { SalesService } from '@/services/sales.service';
import { AuditService } from '@/services/audit.service';
import { AuthenticatedRequest, withAuth } from '@/lib/auth/withAuth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const sale = await SalesService.getById(id);
    return NextResponse.json({ success: true, data: sale });
  } catch (error: any) {
    console.error('[src/app/api/sales/[id]/route.ts] status: 404, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Venta no encontrada' },
      { status: 404 }
    );
  }
}

export const PATCH = withAuth(async (request: AuthenticatedRequest, { params }: RouteParams) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, items } = body;

    if (status && !['PAID', 'PENDING', 'PARTIAL'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Estado de venta inválido' },
        { status: 400 }
      );
    }

    if (items && !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Lista de productos inválida' },
        { status: 400 }
      );
    }

    const updatedSale = await SalesService.updateSale(id, { status, items });

    if (request.user) {
      await AuditService.record({
        user_id: request.user.id,
        action: 'SALE_UPDATED',
        entity_type: 'sale',
        entity_id: id,
        details: { status: updatedSale.status, total_usd: updatedSale.total_usd },
      });
    }

    return NextResponse.json({ success: true, data: updatedSale });
  } catch (error: any) {
    console.error('[src/app/api/sales/[id]/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar venta' },
      { status: 500 }
    );
  }
});

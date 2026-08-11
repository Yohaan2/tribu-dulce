import { NextResponse } from 'next/server';
import { SalesService } from '@/services/sales.service';
import { AuditService } from '@/services/audit.service';
import { CreateSaleSchema } from '@/schemas/sale.schema';
import { AuthenticatedRequest, withAuth } from '@/lib/auth/withAuth';

export async function GET() {
  try {
    const sales = await SalesService.getAll();
    return NextResponse.json({ success: true, data: sales });
  } catch (error: any) {
    console.error('[src/app/api/sales/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener ventas' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();

    const validation = CreateSaleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Datos de validación incorrectos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const newSale = await SalesService.create(validation.data);

    if (request.user) {
      await AuditService.record({
        user_id: request.user.id,
        action: 'SALE_CREATED',
        entity_type: 'sale',
        entity_id: newSale.id,
        details: { client_id: newSale.client_id, total_usd: newSale.total_usd },
      });
    }

    return NextResponse.json({ success: true, data: newSale }, { status: 201 });
  } catch (error: any) {
    console.error('[src/app/api/sales/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al registrar venta' },
      { status: 500 }
    );
  }
});

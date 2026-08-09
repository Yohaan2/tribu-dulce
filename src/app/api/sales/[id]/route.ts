import { NextResponse } from 'next/server';
import { SalesService } from '@/services/sales.service';

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

export async function PATCH(request: Request, { params }: RouteParams) {
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
    return NextResponse.json({ success: true, data: updatedSale });
  } catch (error: any) {
    console.error('[src/app/api/sales/[id]/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar venta' },
      { status: 500 }
    );
  }
}

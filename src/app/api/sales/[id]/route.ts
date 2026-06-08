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
    return NextResponse.json(
      { success: false, error: error.message || 'Venta no encontrada' },
      { status: 404 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    if (!status || !['PAID', 'PENDING', 'PARTIAL'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Estado de venta inválido' },
        { status: 400 }
      );
    }
    const updatedSale = await SalesService.updateStatus(id, status);
    return NextResponse.json({ success: true, data: updatedSale });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar estado de venta' },
      { status: 500 }
    );
  }
}

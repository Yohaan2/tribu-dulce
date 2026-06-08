import { NextResponse } from 'next/server';
import { PaymentsService } from '@/services/payments.service';

export async function GET() {
  try {
    const debts = await PaymentsService.getDebts();
    return NextResponse.json({ success: true, data: debts });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener deudas' },
      { status: 500 }
    );
  }
}

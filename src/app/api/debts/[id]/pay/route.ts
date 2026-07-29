import { NextResponse } from 'next/server';
import { PaymentsService } from '@/services/payments.service';
import { CreatePaymentSchema } from '@/schemas/payment.schema';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const paymentInput = {
      ...body,
      sale_id: id,
    };

    const validation = CreatePaymentSchema.safeParse(paymentInput);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Datos de validación incorrectos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const newPayment = await PaymentsService.createPayment(validation.data);
    return NextResponse.json({ success: true, data: newPayment });
  } catch (error: any) {
    console.error('[src/app/api/debts/[id]/pay/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al registrar pago' },
      { status: 500 }
    );
  }
}

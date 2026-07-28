import { NextResponse } from 'next/server';
import { PaymentsService } from '@/services/payments.service';
import { CreateClientPaymentSchema } from '@/schemas/payment.schema';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const paymentInput = {
      ...body,
      client_id: id,
    };

    const validation = CreateClientPaymentSchema.safeParse(paymentInput);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Datos de validación incorrectos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    await PaymentsService.createClientPayment(validation.data);
    return NextResponse.json({ success: true, message: 'Pago registrado con éxito' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al registrar pago' },
      { status: 500 }
    );
  }
}

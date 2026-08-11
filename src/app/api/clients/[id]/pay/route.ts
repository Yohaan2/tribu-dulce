import { NextResponse } from 'next/server';
import { PaymentsService } from '@/services/payments.service';
import { AuditService } from '@/services/audit.service';
import { CreateClientPaymentSchema } from '@/schemas/payment.schema';
import { AuthenticatedRequest, withAuth } from '@/lib/auth/withAuth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const POST = withAuth(async (request: AuthenticatedRequest, { params }: RouteParams) => {
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

    if (request.user) {
      await AuditService.record({
        user_id: request.user.id,
        action: 'CLIENT_PAYMENT_CREATED',
        entity_type: 'client_payment',
        entity_id: id,
        details: {
          client_id: id,
          amount_usd: validation.data.amount_usd,
          amount_bs: validation.data.amount_bs,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Pago registrado con éxito' });
  } catch (error: any) {
    console.error('[src/app/api/clients/[id]/pay/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al registrar pago' },
      { status: 500 }
    );
  }
});

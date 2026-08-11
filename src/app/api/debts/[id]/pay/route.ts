import { NextResponse } from 'next/server';
import { PaymentsService } from '@/services/payments.service';
import { AuditService } from '@/services/audit.service';
import { CreatePaymentSchema } from '@/schemas/payment.schema';
import { AuthenticatedRequest, withAuth } from '@/lib/auth/withAuth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const PATCH = withAuth(async (request: AuthenticatedRequest, { params }: RouteParams) => {
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

    if (request.user) {
      await AuditService.record({
        user_id: request.user.id,
        action: 'PAYMENT_CREATED',
        entity_type: 'payment',
        entity_id: newPayment.id,
        details: {
          sale_id: id,
          amount_usd: newPayment.amount_usd,
          amount_bs: newPayment.amount_bs,
        },
      });
    }

    return NextResponse.json({ success: true, data: newPayment });
  } catch (error: any) {
    console.error('[src/app/api/debts/[id]/pay/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al registrar pago' },
      { status: 500 }
    );
  }
});

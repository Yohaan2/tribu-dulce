import { NextResponse } from 'next/server';
import { PaymentsService } from '@/services/payments.service';
import { AuthenticatedRequest, withAuth } from '@/lib/auth/withAuth';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const debts = await PaymentsService.getDebts(request.user?.role === 'EMPLOYEE' ? request.user.id : undefined);
    return NextResponse.json({ success: true, data: debts });
  } catch (error: any) {
    console.error('[src/app/api/debts/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener deudas' },
      { status: 500 }
    );
  }
});

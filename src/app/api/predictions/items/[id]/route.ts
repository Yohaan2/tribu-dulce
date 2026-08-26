import { NextResponse } from 'next/server';
import { PredictionsService } from '@/services/predictions.service';
import { AuditService } from '@/services/audit.service';
import { AuthenticatedRequest, withAuth } from '@/lib/auth/withAuth';

export const DELETE = withAuth(async (request: AuthenticatedRequest, context: any) => {
  try {
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de item requerido' }, { status: 400 });
    }

    await PredictionsService.deleteItem(id);

    if (request.user) {
      await AuditService.record({
        user_id: request.user.id,
        action: 'PREDICTION_ITEM_DELETED',
        entity_type: 'prediction_item',
        entity_id: id,
      });
    }

    const updatedSummary = await PredictionsService.getActiveSummary();
    return NextResponse.json({ success: true, data: updatedSummary });
  } catch (error: any) {
    console.error('[src/app/api/predictions/items/[id]/route.ts] status: 500, error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al eliminar item de previsión' },
      { status: 500 }
    );
  }
});

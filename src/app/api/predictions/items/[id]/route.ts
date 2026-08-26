import { NextResponse } from 'next/server';
import { PredictionsService } from '@/services/predictions.service';
import { AuditService } from '@/services/audit.service';
import { UpdatePredictionItemSchema } from '@/schemas/prediction.schema';
import { AuthenticatedRequest, withAuth } from '@/lib/auth/withAuth';

export const PATCH = withAuth(async (request: AuthenticatedRequest, context: any) => {
  try {
    const params = await context.params;
    const { id } = params;
    const validation = UpdatePredictionItemSchema.safeParse(await request.json());

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de item requerido' }, { status: 400 });
    }

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Datos de validación incorrectos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    await PredictionsService.updateItem(id, validation.data);

    if (request.user) {
      await AuditService.record({
        user_id: request.user.id,
        action: 'PREDICTION_ITEM_UPDATED',
        entity_type: 'prediction_item',
        entity_id: id,
      });
    }
    const updatedSummary = await PredictionsService.getActiveSummary();
    return NextResponse.json({ success: true, data: updatedSummary });
  } catch (error: any) {
    console.error('[src/app/api/predictions/items/[id]/route.ts PATCH] status: 500, error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar item de previsión' },
      { status: 500 }
    );
  }
});

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

import { NextResponse } from 'next/server';
import { PredictionsService } from '@/services/predictions.service';
import { AuditService } from '@/services/audit.service';
import { CreatePredictionItemSchema } from '@/schemas/prediction.schema';
import { AuthenticatedRequest, withAuth } from '@/lib/auth/withAuth';

export async function GET() {
  try {
    const activeSummary = await PredictionsService.getActiveSummary();
    return NextResponse.json({ success: true, data: activeSummary });
  } catch (error: any) {
    console.error('[src/app/api/predictions/route.ts GET] status: 500, error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener la previsión activa' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();

    const validation = CreatePredictionItemSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Datos de validación incorrectos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updatedPrediction = await PredictionsService.addItem(validation.data);

    if (request.user) {
      await AuditService.record({
        user_id: request.user.id,
        action: 'PREDICTION_ITEM_ADDED',
        entity_type: 'prediction',
        entity_id: updatedPrediction.id,
        details: {
          product_id: validation.data.product_id,
          estimated_quantity: validation.data.estimated_quantity,
          unit_price: validation.data.unit_price,
          unit_cost: validation.data.unit_cost,
        },
      });
    }

    // Retornamos el resumen actualizado
    const activeSummary = await PredictionsService.getActiveSummary();
    return NextResponse.json({ success: true, data: activeSummary }, { status: 201 });
  } catch (error: any) {
    console.error('[src/app/api/predictions/route.ts POST] status: 500, error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar previsión' },
      { status: 500 }
    );
  }
});

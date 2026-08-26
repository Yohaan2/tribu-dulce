import { NextResponse } from 'next/server';
import { PredictionsService } from '@/services/predictions.service';
import { AuditService } from '@/services/audit.service';
import { ResetPredictionSchema } from '@/schemas/prediction.schema';
import { AuthenticatedRequest, withAuth } from '@/lib/auth/withAuth';

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const validation = ResetPredictionSchema.safeParse(body);
    const notes = validation.success ? validation.data.notes : undefined;

    const archived = await PredictionsService.reset(notes);

    if (archived && request.user) {
      await AuditService.record({
        user_id: request.user.id,
        action: 'PREDICTION_RESET',
        entity_type: 'prediction',
        entity_id: archived.id,
        details: { finished_at: archived.finished_at, notes },
      });
    }

    return NextResponse.json({ success: true, data: archived });
  } catch (error: any) {
    console.error('[src/app/api/predictions/reset/route.ts] status: 500, error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al reiniciar la previsión' },
      { status: 500 }
    );
  }
});

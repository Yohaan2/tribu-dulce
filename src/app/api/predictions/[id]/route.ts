import { NextResponse } from 'next/server';
import { PredictionsService } from '@/services/predictions.service';

export async function GET(request: Request, context: any) {
  try {
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de previsión requerido' }, { status: 400 });
    }

    const summary = await PredictionsService.getByIdSummary(id);
    if (!summary) {
      return NextResponse.json({ success: false, error: 'Previsión no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('[src/app/api/predictions/[id]/route.ts] status: 500, error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener la previsión' },
      { status: 500 }
    );
  }
}

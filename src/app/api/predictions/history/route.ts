import { NextResponse } from 'next/server';
import { PredictionsService } from '@/services/predictions.service';

export async function GET() {
  try {
    const history = await PredictionsService.getHistory();
    return NextResponse.json({ success: true, data: history });
  } catch (error: any) {
    console.error('[src/app/api/predictions/history/route.ts] status: 500, error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener el historial de previsiones' },
      { status: 500 }
    );
  }
}

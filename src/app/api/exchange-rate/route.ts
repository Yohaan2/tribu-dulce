import { NextResponse } from 'next/server';
import { ExchangeRateService } from '@/services/exchange-rate.service';

export async function GET() {
  try {
    const latestRate = await ExchangeRateService.getLatest();
    return NextResponse.json({ success: true, data: latestRate });
  } catch (error: any) {
    console.error('[src/app/api/exchange-rate/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener tasa de cambio' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rate, source } = body;

    if (!rate || isNaN(Number(rate)) || Number(rate) <= 0) {
      return NextResponse.json(
        { success: false, error: 'La tasa debe ser un número positivo' },
        { status: 400 }
      );
    }

    const newRate = await ExchangeRateService.create(Number(rate), source || 'Manual');
    return NextResponse.json({ success: true, data: newRate }, { status: 201 });
  } catch (error: any) {
    console.error('[src/app/api/exchange-rate/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al registrar tasa de cambio' },
      { status: 500 }
    );
  }
}

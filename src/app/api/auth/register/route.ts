import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ success: false, error: 'El registro público no está disponible' }, { status: 403 });
}

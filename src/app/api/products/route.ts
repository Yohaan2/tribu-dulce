import { NextResponse } from 'next/server';
import { ProductsService } from '@/services/products.service';
import { CreateProductSchema } from '@/schemas/product.schema';

export async function GET() {
  try {
    const products = await ProductsService.getAll();
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    console.error('[src/app/api/products/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener productos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = CreateProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Datos de validación incorrectos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const newProduct = await ProductsService.create(validation.data);
    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error('[src/app/api/products/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al crear producto' },
      { status: 500 }
    );
  }
}

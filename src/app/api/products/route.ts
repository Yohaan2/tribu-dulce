import { NextResponse } from 'next/server';
import { ProductsService } from '@/services/products.service';
import { AuditService } from '@/services/audit.service';
import { CreateProductSchema } from '@/schemas/product.schema';
import { AuthenticatedRequest, withAuth } from '@/lib/auth/withAuth';

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

export const POST = withAuth(async (request: AuthenticatedRequest) => {
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

    if (request.user) {
      await AuditService.record({
        user_id: request.user.id,
        action: 'PRODUCT_CREATED',
        entity_type: 'product',
        entity_id: newProduct.id,
        details: { name: newProduct.name, price_usd: newProduct.price_usd },
      });
    }

    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error('[src/app/api/products/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al crear producto' },
      { status: 500 }
    );
  }
});

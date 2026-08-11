import { NextResponse } from 'next/server';
import { ProductsService } from '@/services/products.service';
import { AuditService } from '@/services/audit.service';
import { UpdateProductSchema } from '@/schemas/product.schema';
import { AuthenticatedRequest, withAuth } from '@/lib/auth/withAuth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const PATCH = withAuth(async (request: AuthenticatedRequest, { params }: RouteParams) => {
  try {
    const { id } = await params;
    const body = await request.json();

    const validation = UpdateProductSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Datos de validación incorrectos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updatedProduct = await ProductsService.update(id, validation.data);

    if (request.user) {
      await AuditService.record({
        user_id: request.user.id,
        action: 'PRODUCT_UPDATED',
        entity_type: 'product',
        entity_id: id,
        details: { name: updatedProduct.name, price_usd: updatedProduct.price_usd },
      });
    }

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error: any) {
    console.error('[src/app/api/products/[id]/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar producto' },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (request: AuthenticatedRequest, { params }: RouteParams) => {
  try {
    const { id } = await params;
    await ProductsService.delete(id);

    if (request.user) {
      await AuditService.record({
        user_id: request.user.id,
        action: 'PRODUCT_DELETED',
        entity_type: 'product',
        entity_id: id,
        details: { product_id: id },
      });
    }

    return NextResponse.json({ success: true, message: 'Producto eliminado correctamente' });
  } catch (error: any) {
    console.error('[src/app/api/products/[id]/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al eliminar producto' },
      { status: 500 }
    );
  }
});

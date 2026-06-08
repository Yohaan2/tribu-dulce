import { NextResponse } from 'next/server';
import { ProductsService } from '@/services/products.service';
import { UpdateProductSchema } from '@/schemas/product.schema';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
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
    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar producto' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await ProductsService.delete(id);
    return NextResponse.json({ success: true, message: 'Producto eliminado correctamente' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al eliminar producto' },
      { status: 500 }
    );
  }
}

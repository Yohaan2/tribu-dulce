import { NextResponse } from 'next/server';
import { ClientsService } from '@/services/clients.service';
import { UpdateClientSchema } from '@/schemas/client.schema';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const client = await ClientsService.getById(id);
    return NextResponse.json({ success: true, data: client });
  } catch (error: any) {
    console.error('[src/app/api/clients/[id]/route.ts] status: 404, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Cliente no encontrado' },
      { status: 404 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validation = UpdateClientSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Datos de validación incorrectos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updatedClient = await ClientsService.update(id, validation.data);
    return NextResponse.json({ success: true, data: updatedClient });
  } catch (error: any) {
    console.error('[src/app/api/clients/[id]/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar cliente' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await ClientsService.delete(id);
    return NextResponse.json({ success: true, message: 'Cliente eliminado correctamente' });
  } catch (error: any) {
    console.error('[src/app/api/clients/[id]/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al eliminar cliente' },
      { status: 500 }
    );
  }
}

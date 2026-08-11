import { NextResponse } from 'next/server';
import { ClientsService } from '@/services/clients.service';
import { AuditService } from '@/services/audit.service';
import { UpdateClientSchema } from '@/schemas/client.schema';
import { AuthenticatedRequest, withAuth } from '@/lib/auth/withAuth';

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

export const PATCH = withAuth(async (request: AuthenticatedRequest, { params }: RouteParams) => {
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

    if (request.user) {
      await AuditService.record({
        user_id: request.user.id,
        action: 'CLIENT_UPDATED',
        entity_type: 'client',
        entity_id: id,
        details: { name: updatedClient.name, phone: updatedClient.phone },
      });
    }

    return NextResponse.json({ success: true, data: updatedClient });
  } catch (error: any) {
    console.error('[src/app/api/clients/[id]/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar cliente' },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (request: AuthenticatedRequest, { params }: RouteParams) => {
  try {
    const { id } = await params;
    await ClientsService.delete(id);

    if (request.user) {
      await AuditService.record({
        user_id: request.user.id,
        action: 'CLIENT_DELETED',
        entity_type: 'client',
        entity_id: id,
        details: { client_id: id },
      });
    }

    return NextResponse.json({ success: true, message: 'Cliente eliminado correctamente' });
  } catch (error: any) {
    console.error('[src/app/api/clients/[id]/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al eliminar cliente' },
      { status: 500 }
    );
  }
});

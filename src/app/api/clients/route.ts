import { NextResponse } from 'next/server';
import { ClientsService } from '@/services/clients.service';
import { AuditService } from '@/services/audit.service';
import { CreateClientSchema } from '@/schemas/client.schema';
import { AuthenticatedRequest, withAuth } from '@/lib/auth/withAuth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const search = searchParams.get('search')?.trim();

    if (name) {
      const client = await ClientsService.getByName(name);
      return NextResponse.json({ success: true, data: client });
    }

    const parsedPage = parseInt(searchParams.get('page') || '1', 10);
    const parsedLimit = parseInt(searchParams.get('limit') || '10', 10);
    const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
    const limit = Number.isNaN(parsedLimit) ? 10 : Math.max(1, parsedLimit);

    const { data, total } = await ClientsService.getClients(page, limit, search);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error: any) {
    console.error('[src/app/api/clients/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    
    // Validar esquema
    const validation = CreateClientSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Datos de validación incorrectos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const newClient = await ClientsService.create(validation.data);

    // Registrar la acción en auditoría
    if (request.user) {
      await AuditService.record({
        user_id: request.user.id,
        action: 'CLIENT_CREATED',
        entity_type: 'client',
        entity_id: newClient.id,
        details: { name: newClient.name, phone: newClient.phone },
      });
    }

    return NextResponse.json({ success: true, data: newClient }, { status: 201 });
  } catch (error: any) {
    console.error('[src/app/api/clients/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al crear cliente' },
      { status: 500 }
    );
  }
});


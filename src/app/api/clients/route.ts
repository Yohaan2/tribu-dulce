import { NextResponse } from 'next/server';
import { ClientsService } from '@/services/clients.service';
import { CreateClientSchema } from '@/schemas/client.schema';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (name) {
      const client = await ClientsService.getByName(name);
      return NextResponse.json({ success: true, data: client });
    }

    const parsedPage = parseInt(searchParams.get('page') || '1', 10);
    const parsedLimit = parseInt(searchParams.get('limit') || '10', 10);
    const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
    const limit = Number.isNaN(parsedLimit) ? 10 : Math.max(1, parsedLimit);

    const { data, total } = await ClientsService.getClients(page, limit);
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

export async function POST(request: Request) {
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
    return NextResponse.json({ success: true, data: newClient }, { status: 201 });
  } catch (error: any) {
    console.error('[src/app/api/clients/route.ts] status: 500, error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Error al crear cliente' },
      { status: 500 }
    );
  }
}

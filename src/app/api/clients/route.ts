import { NextResponse } from 'next/server';
import { ClientsService } from '@/services/clients.service';
import { CreateClientSchema } from '@/schemas/client.schema';

export async function GET() {
  try {
    const clients = await ClientsService.getAll();
    return NextResponse.json({ success: true, data: clients });
  } catch (error: any) {
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
    return NextResponse.json(
      { success: false, error: error.message || 'Error al crear cliente' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { withAuth, withRole, AuthenticatedRequest } from '@/lib/auth/withAuth';
import { UsersService } from '@/services/users.service';
import { UpdateUserSchema } from '@/schemas/user.schema';
import { AuditService } from '@/services/audit.service';

interface RouteParams { params: Promise<{ id: string }> }

export const PATCH = withAuth(withRole('SUPERADMIN')(async (req: AuthenticatedRequest, { params }: RouteParams) => {
  const { id } = await params;
  if (req.user!.id === id) return NextResponse.json({ success: false, error: 'No puedes modificar tu cuenta' }, { status: 403 });
  const parsed = UpdateUserSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
  try {
    const user = await UsersService.update(id, parsed.data);
    await AuditService.record({ user_id: req.user!.id, action: 'USER_UPDATED', entity_type: 'user', entity_id: id, details: { fields: Object.keys(parsed.data).filter((key) => key !== 'password') } });
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 409 });
  }
}));

export const DELETE = withAuth(withRole('SUPERADMIN')(async (req: AuthenticatedRequest, { params }: RouteParams) => {
  const { id } = await params;
  if (req.user!.id === id) return NextResponse.json({ success: false, error: 'No puedes eliminar tu cuenta' }, { status: 403 });
  try {
    const user = await UsersService.remove(id);
    await AuditService.record({ user_id: req.user!.id, action: 'USER_REMOVED', entity_type: 'user', entity_id: id });
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 409 });
  }
}));

import { NextResponse } from 'next/server';
import { withAuth, withRole, AuthenticatedRequest } from '@/lib/auth/withAuth';
import { UsersService } from '@/services/users.service';
import { CreateUserSchema } from '@/schemas/user.schema';
import { AuditService } from '@/services/audit.service';

export const GET = withAuth(withRole('ADMIN', 'SUPERADMIN')(async (req: AuthenticatedRequest) => {
  const scope = new URL(req.url).searchParams.get('scope');
  if (scope === 'sellers') return NextResponse.json({ success: true, data: await UsersService.sellers() });
  if (req.user?.role !== 'SUPERADMIN') return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
  return NextResponse.json({ success: true, data: await UsersService.list() });
}));

export const POST = withAuth(withRole('SUPERADMIN')(async (req: AuthenticatedRequest) => {
  const parsed = CreateUserSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
  try {
    const user = await UsersService.create(parsed.data);
    await AuditService.record({ user_id: req.user!.id, action: 'USER_CREATED', entity_type: 'user', entity_id: user.id, details: { role: user.role } });
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 409 });
  }
}));

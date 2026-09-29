import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDataSource, ProfileEntity, SaleEntity } from '@/lib/db/postgres';
import { withAuth, withRole, AuthenticatedRequest } from '@/lib/auth/withAuth';
import { AuditService } from '@/services/audit.service';

export const PATCH = withAuth(withRole('SUPERADMIN')(async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const input = z.object({ seller_id: z.uuid() }).safeParse(await req.json());
  if (!z.uuid().safeParse(id).success || !input.success) return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
  const ds = await getDataSource();
  const seller = await ds.getRepository(ProfileEntity).findOne({ where: { id: input.data.seller_id, role: 'EMPLOYEE' } });
  if (!seller || !seller.is_active || seller.deleted_at) return NextResponse.json({ success: false, error: 'Vendedor no disponible' }, { status: 404 });
  const result = await ds.getRepository(SaleEntity).createQueryBuilder().update().set({ created_by: seller.id })
    .where('id = :id AND created_by IS NULL', { id }).execute();
  if (!result.affected) return NextResponse.json({ success: false, error: 'Venta inexistente o ya asignada' }, { status: 409 });
  await AuditService.record({ user_id: req.user!.id, action: 'SALE_ASSIGNED', entity_type: 'sale', entity_id: id, details: { seller_id: seller.id } });
  return NextResponse.json({ success: true, data: { id, created_by: seller.id } });
}));

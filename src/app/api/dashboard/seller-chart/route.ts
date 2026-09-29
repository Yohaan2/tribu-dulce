import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { UsersService } from '@/services/users.service';
import { withAuth, withRole, AuthenticatedRequest } from '@/lib/auth/withAuth';

export const GET = withAuth(withRole('ADMIN', 'SUPERADMIN')(async (req: AuthenticatedRequest) => {
  const sellerId = new URL(req.url).searchParams.get('sellerId');
  if (!sellerId || !z.uuid().safeParse(sellerId).success) return NextResponse.json({ success: false, error: 'Vendedor inválido' }, { status: 400 });
  const sellers = await UsersService.sellers();
  if (!sellers.some((seller) => seller.id === sellerId)) return NextResponse.json({ success: false, error: 'Vendedor no encontrado' }, { status: 404 });
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  const end = new Date();
  end.setDate(end.getDate() + 1);
  const sales = await db.getSalesBetweenDates(start, end, sellerId);
  const data = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dayEnd = new Date(date);
    dayEnd.setDate(date.getDate() + 1);
    return {
      day: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
      amount: sales.filter((sale) => {
        const timestamp = new Date(sale.created_at);
        return timestamp >= date && timestamp < dayEnd;
      }).reduce((sum, sale) => sum + Number(sale.total_usd), 0),
    };
  });
  return NextResponse.json({ success: true, data });
}));

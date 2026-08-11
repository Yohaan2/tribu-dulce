import { NextResponse } from 'next/server';
import { AuditService } from '@/services/audit.service';
import { AuthenticatedRequest, withAuth } from '@/lib/auth/withAuth';

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  if (request.user) {
    await AuditService.record({
      user_id: request.user.id,
      action: 'USER_LOGOUT',
      entity_type: 'user',
      entity_id: request.user.id,
      details: { email: request.user.email },
    });
  }

  return NextResponse.json({
    success: true,
    message: 'Sesión cerrada correctamente'
  });
});

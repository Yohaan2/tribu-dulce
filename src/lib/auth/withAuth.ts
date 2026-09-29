import { NextResponse } from 'next/server';
import { verifyToken, TokenPayload } from './jwt';
import { getDataSource, ProfileEntity } from '@/lib/db/postgres';
import { UserRole } from '@/types';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  context?: any
) => Promise<Response> | Response;

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: Request, context?: any) => {
    // 1. Extraer token del header Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // 2. Verificar token con verifyToken()
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or expired token' },
        { status: 401 }
      );
    }

    const ds = await getDataSource();
    const profile = await ds.getRepository(ProfileEntity).findOne({ where: { id: payload.id } });
    if (!profile || !profile.is_active || profile.deleted_at) {
      const response = NextResponse.json({ success: false, error: 'Cuenta inactiva o no disponible' }, { status: 401 });
      response.cookies.set('auth_token', '', { path: '/', maxAge: 0 });
      return response;
    }

    // 4. Adjuntar user al request
    const authReq = req as AuthenticatedRequest;
    authReq.user = { id: profile.id, email: profile.email, name: profile.name, role: profile.role };

    // 5. Llamar handler(req, res)
    return handler(authReq, context);
  };
}

export function withRole(...roles: UserRole[]) {
  return (handler: AuthenticatedHandler): AuthenticatedHandler => {
    return async (req: AuthenticatedRequest, context?: any) => {
      if (!req.user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Authentication required' },
          { status: 401 }
        );
      }

      if (!roles.includes(req.user.role)) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }

      return handler(req, context);
    };
  };
}

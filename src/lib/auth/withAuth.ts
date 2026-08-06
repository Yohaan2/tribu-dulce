import { NextResponse } from 'next/server';
import { verifyToken, TokenPayload } from './jwt';

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

    // 4. Adjuntar user al request
    const authReq = req as AuthenticatedRequest;
    authReq.user = payload;

    // 5. Llamar handler(req, res)
    return handler(authReq, context);
  };
}

export function withRole(role: 'ADMIN' | 'EMPLOYEE' | 'SUPERADMIN') {
  return (handler: AuthenticatedHandler): AuthenticatedHandler => {
    return async (req: AuthenticatedRequest, context?: any) => {
      if (!req.user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Authentication required' },
          { status: 401 }
        );
      }

      // Si el rol es ADMIN, tiene acceso a todo. De lo contrario, debe coincidir exactamente.
      if (req.user.role !== role && req.user.role !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }

      return handler(req, context);
    };
  };
}

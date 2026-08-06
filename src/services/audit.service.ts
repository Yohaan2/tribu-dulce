import { db } from '@/lib/db';
import { AuditLog, CreateAuditLogInput } from '@/types';

export class AuditService {
  static async getAll(limit: number = 100): Promise<AuditLog[]> {
    return await db.getAuditLogs(limit);
  }

  static async record(input: CreateAuditLogInput): Promise<AuditLog> {
    return await db.createAuditLog(input);
  }
}

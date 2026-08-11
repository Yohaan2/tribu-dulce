import { db } from '@/lib/db';
import { AuditLog, CreateAuditLogInput } from '@/types';

export class AuditService {
  static async getAll(
    page: number = 1,
    limit: number = 10,
    startDate?: string,
    endDate?: string
  ): Promise<{ data: AuditLog[]; total: number; totalPages: number }> {
    const { data, total } = await db.getAuditLogs(page, limit, startDate, endDate);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { data, total, totalPages };
  }

  static async record(input: CreateAuditLogInput): Promise<AuditLog> {
    return await db.createAuditLog(input);
  }
}

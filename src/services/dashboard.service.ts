import { db } from '@/lib/db';
import { DashboardStats } from '@/types';

export class DashboardService {
  static async getStats(): Promise<DashboardStats> {
    // Obtener fechas clave en formato ISO
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    const weekStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysSinceMonday = (weekStartDate.getDay() + 6) % 7;
    weekStartDate.setDate(weekStartDate.getDate() - daysSinceMonday);
    const weekStart = weekStartDate.toISOString();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const monthStart = thirtyDaysAgo.toISOString();

    return await db.getDashboardStats(todayStart, weekStart, monthStart);
  }
}

import { createServerClient } from '@/lib/supabase/server';
import { DashboardStats } from '@/types';

export class DashboardService {
  static async getStats(): Promise<DashboardStats> {
    const supabase = await createServerClient();

    // Obtener fechas clave en formato ISO
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const weekStart = sevenDaysAgo.toISOString();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const monthStart = thirtyDaysAgo.toISOString();

    // 1. Ventas de Hoy
    const { data: todayData, error: todayError } = await supabase
      .from('sales')
      .select('total_usd')
      .gte('created_at', todayStart);

    if (todayError) throw new Error(todayError.message);
    const todaySales = (todayData || []).reduce((acc, curr) => acc + Number(curr.total_usd), 0);

    // 2. Ventas de la Semana
    const { data: weekData, error: weekError } = await supabase
      .from('sales')
      .select('total_usd')
      .gte('created_at', weekStart);

    if (weekError) throw new Error(weekError.message);
    const weekSales = (weekData || []).reduce((acc, curr) => acc + Number(curr.total_usd), 0);

    // 3. Ventas del Mes
    const { data: monthData, error: monthError } = await supabase
      .from('sales')
      .select('total_usd')
      .gte('created_at', monthStart);

    if (monthError) throw new Error(monthError.message);
    const monthSales = (monthData || []).reduce((acc, curr) => acc + Number(curr.total_usd), 0);

    // 4. Monto pendiente por cobrar (deudas)
    // Buscamos todas las ventas PENDING/PARTIAL
    const { data: pendingSales, error: pendingSalesError } = await supabase
      .from('sales')
      .select(`
        id,
        total_usd,
        payments(amount_usd)
      `)
      .in('status', ['PENDING', 'PARTIAL']);

    if (pendingSalesError) throw new Error(pendingSalesError.message);

    let pendingAmount = 0;
    if (pendingSales) {
      pendingSales.forEach((sale: any) => {
        const totalPaid = (sale.payments || []).reduce((acc: number, curr: any) => acc + Number(curr.amount_usd), 0);
        const outstanding = Number(sale.total_usd) - totalPaid;
        if (outstanding > 0) {
          pendingAmount += outstanding;
        }
      });
    }

    // 5. Clientes top (más compras)
    // Traemos ventas agrupadas. Dado que Supabase JS no tiene GROUP BY nativo completo,
    // traemos las ventas con sus clientes y agrupamos en memoria para este dashboard.
    const { data: allSalesWithClients, error: clientsError } = await supabase
      .from('sales')
      .select(`
        total_usd,
        client:clients(id, name)
      `);

    if (clientsError) throw new Error(clientsError.message);

    const clientMap: Record<string, { name: string; totalSpent: number; count: number }> = {};
    (allSalesWithClients || []).forEach((sale: any) => {
      if (sale.client) {
        const cId = sale.client.id;
        if (!clientMap[cId]) {
          clientMap[cId] = { name: sale.client.name, totalSpent: 0, count: 0 };
        }
        clientMap[cId].totalSpent += Number(sale.total_usd);
        clientMap[cId].count += 1;
      }
    });

    const topClients = Object.entries(clientMap)
      .map(([id, info]) => ({
        client_id: id,
        client_name: info.name,
        total_spent: info.totalSpent,
        sales_count: info.count,
      }))
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 5);

    // 6. Datos semanales para el gráfico
    // Generar últimos 7 días con montos acumulados
    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const weeklyChartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      const dayName = daysOfWeek[d.getDay()];
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      // Filtrar ventas de ese día
      const dayAmount = (weekData || []).reduce((acc: number, sale: any) => {
        const saleTime = new Date(sale.created_at || '').getTime();
        if (saleTime >= dayStart && saleTime < dayEnd) {
          return acc + Number(sale.total_usd);
        }
        return acc;
      }, 0);

      return {
        day: dayName,
        amount: dayAmount,
      };
    });

    return {
      todaySales,
      weekSales,
      monthSales,
      pendingAmount,
      topClients,
      weeklyChartData,
    };
  }
}

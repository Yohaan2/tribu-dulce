import { createServerClient } from '@/lib/supabase/server';
import { Client, Product, Sale, Payment, ExchangeRate, DashboardStats, SaleStatus, AuditLog, CreateAuditLogInput } from '@/types';
import { CreateClientInput, UpdateClientInput } from '@/schemas/client.schema';
import { CreateProductInput, UpdateProductInput } from '@/schemas/product.schema';
import { CreateSaleInput } from '@/schemas/sale.schema';
import { CreatePaymentInput } from '@/schemas/payment.schema';
import { DatabaseAdapter } from './interface';

export class SupabaseAdapter implements DatabaseAdapter {
  private async getClient() {
    return await createServerClient();
  }

  // --- CLIENTES ---
  async getClients(page?: number, limit?: number): Promise<{ data: Client[]; total: number }> {
    const supabase = await this.getClient();
    const start = page && limit ? (page - 1) * limit : 0;
    const end = page && limit ? start + limit - 1 : undefined;

    let query = supabase
      .from('clients')
      .select(
        `
        *,
        sales:sales(
          id,
          total_usd,
          status,
          payments(amount_usd)
        )
      `,
        { count: 'exact' }
      )
      .order('name', { ascending: true });

    if (end !== undefined) {
      query = query.range(start, end);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);
    return { data: (data || []) as Client[], total: count || 0 };
  }

  async getClientById(id: string): Promise<Client> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Cliente no encontrado: ${error.message}`);
    return data;
  }

  async getClientByName(name: string): Promise<Client> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('name', name)
      .single();

    if (error) throw new Error(`Cliente no encontrado: ${error.message}`);
    return data;
  }

  async createClient(input: CreateClientInput): Promise<Client> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('clients')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateClient(id: string, input: UpdateClientInput): Promise<Client> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('clients')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteClient(id: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  // --- PRODUCTOS ---
  async getProducts(): Promise<Product[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getProductById(id: string): Promise<Product> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Producto no encontrado: ${error.message}`);
    return data;
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('products')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('products')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteProduct(id: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  // --- VENTAS ---
  async getSales(): Promise<Sale[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        client:clients(*),
        items:sale_items(
          *,
          product:products(*)
        ),
        creator_profile:profiles(id, name, role)
      `)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getSaleById(id: string): Promise<Sale> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        client:clients(*),
        items:sale_items(
          *,
          product:products(*)
        ),
        payments(*),
        creator_profile:profiles(id, name, role)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(`Venta no encontrada: ${error.message}`);
    return data;
  }

  async createSale(input: CreateSaleInput): Promise<Sale> {
    const supabase = await this.getClient();
    
    // 1. Insertar cabecera de la venta
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({
        client_id: input.client_id,
        total_usd: input.total_usd,
        total_bs: input.total_bs,
        status: input.status,
        created_by: input.created_by || null,
      })
      .select()
      .single();

    if (saleError) throw new Error(saleError.message);
    const saleId = saleData.id;

    // 2. Insertar los items correspondientes
    const itemsToInsert = input.items.map((item) => ({
      sale_id: saleId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(itemsToInsert);

    if (itemsError) {
      // Intentar revertir si falla
      await supabase.from('sales').delete().eq('id', saleId);
      throw new Error(`Error registrando items: ${itemsError.message}`);
    }

    // 3. Registrar pago automático si aplica
    if (input.status === 'PAID') {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          sale_id: saleId,
          amount_usd: input.total_usd,
          amount_bs: input.total_bs,
        });
      
      if (paymentError) {
        console.error('Error registrando pago automático para venta pagada:', paymentError.message);
      }
    } else if (input.status === 'PARTIAL' && input.partial_payment_usd && input.partial_payment_usd > 0) {
      const partialUsd = input.partial_payment_usd;
      const rate = input.total_usd > 0 ? (input.total_bs / input.total_usd) : 0;
      const partialBs = Math.round(partialUsd * rate * 100) / 100;

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          sale_id: saleId,
          amount_usd: partialUsd,
          amount_bs: partialBs,
        });

      if (paymentError) {
        console.error('Error registrando pago parcial para venta:', paymentError.message);
      }
    }

    return this.getSaleById(saleId);
  }

  async updateSaleStatus(id: string, status: SaleStatus): Promise<Sale> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from('sales')
      .update({ status })
      .eq('id', id);

    if (error) throw new Error(error.message);
    return this.getSaleById(id);
  }

  async getDebts(): Promise<Sale[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        client:clients(*),
        payments(*),
        items:sale_items(
          *,
          product:products(*)
        ),
        creator_profile:profiles(id, name, role)
      `)
      .in('status', ['PENDING', 'PARTIAL'])
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getClientDebts(clientId: string): Promise<any[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('sales')
      .select(`
        id,
        total_usd,
        created_at,
        payments(amount_usd)
      `)
      .eq('client_id', clientId)
      .in('status', ['PENDING', 'PARTIAL'])
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  // --- PAGOS ---
  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('payments')
      .insert({
        sale_id: input.sale_id,
        amount_usd: input.amount_usd,
        amount_bs: input.amount_bs,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getPaymentsBySaleId(saleId: string): Promise<Payment[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('sale_id', saleId);

    if (error) throw new Error(error.message);
    return data || [];
  }

  // --- TASA DE CAMBIO ---
  async getLatestExchangeRate(): Promise<ExchangeRate | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching exchange rate from Supabase:', error.message);
    }
    return data && data.length > 0 ? data[0] : null;
  }

  async createExchangeRate(rate: number, source: string): Promise<ExchangeRate> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('exchange_rates')
      .insert({ rate, source })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // --- DASHBOARD ---
  async getDashboardStats(todayStart: string, weekStart: string, monthStart: string): Promise<DashboardStats> {
    const supabase = await this.getClient();

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

    // 5. Clientes top
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
    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const now = new Date();
    const weeklyChartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      const dayName = daysOfWeek[d.getDay()];
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

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

  // --- AUDITORIA ---
  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('audit_logs_view')
      .select('*')
      .limit(limit);

    if (error) throw new Error(error.message);
    return (data || []) as AuditLog[];
  }

  async createAuditLog(input: CreateAuditLogInput): Promise<AuditLog> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: input.user_id,
        action: input.action,
        entity_type: input.entity_type || null,
        entity_id: input.entity_id || null,
        details: input.details || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const { data: viewData, error: viewError } = await supabase
      .from('audit_logs_view')
      .select('*')
      .eq('id', data.id)
      .single();

    if (viewError) throw new Error(viewError.message);
    return viewData as AuditLog;
  }
}

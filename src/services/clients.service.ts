import { createServerClient } from '@/lib/supabase/server';
import { Client } from '@/types';
import { CreateClientInput, UpdateClientInput } from '@/schemas/client.schema';

export class ClientsService {
  static async getAll(): Promise<Client[]> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        sales:sales(
          id,
          total_usd,
          status,
          payments(amount_usd)
        )
      `)
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    
    // Calcular estadísticas por cliente
    const clientsWithStats = (data || []).map((client: any) => {
      const sales = client.sales || [];
      const totalPurchased = sales.reduce((acc: number, sale: any) => acc + Number(sale.total_usd), 0);
      
      // Calcular deuda pendiente (ventas PENDING/PARTIAL - pagos)
      const pendingSales = sales.filter((s: any) => s.status === 'PENDING' || s.status === 'PARTIAL');
      const totalPaid = pendingSales.reduce((acc: number, sale: any) => {
        const salePayments = sale.payments || [];
        return acc + salePayments.reduce((pAcc: number, p: any) => pAcc + Number(p.amount_usd), 0);
      }, 0);
      const totalPending = pendingSales.reduce((acc: number, sale: any) => acc + Number(sale.total_usd), 0);
      const debtPending = totalPending - totalPaid;

      return {
        ...client,
        total_purchased: totalPurchased,
        debt_pending: debtPending > 0 ? debtPending : 0,
      };
    });

    return clientsWithStats;
  }

  static async getById(id: string): Promise<Client> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Cliente no encontrado: ${error.message}`);
    return data;
  }

  static async create(input: CreateClientInput): Promise<Client> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('clients')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async update(id: string, input: UpdateClientInput): Promise<Client> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('clients')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async delete(id: string): Promise<void> {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}

import { db } from '@/lib/db';
import { Client } from '@/types';
import { CreateClientInput, UpdateClientInput } from '@/schemas/client.schema';

export class ClientsService {
  static async getAll(): Promise<Client[]> {
    const data = await db.getClients();
    
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
    return await db.getClientById(id);
  }

  static async create(input: CreateClientInput): Promise<Client> {
    return await db.createClient(input);
  }

  static async update(id: string, input: UpdateClientInput): Promise<Client> {
    return await db.updateClient(id, input);
  }

  static async delete(id: string): Promise<void> {
    await db.deleteClient(id);
  }
}

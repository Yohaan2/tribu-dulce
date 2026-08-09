import { db } from '@/lib/db';
import { Sale, SaleStatus } from '@/types';
import { CreateSaleInput } from '@/schemas/sale.schema';

export class SalesService {
  static async getAll(): Promise<Sale[]> {
    return await db.getSales();
  }

  static async getById(id: string): Promise<Sale> {
    return await db.getSaleById(id);
  }

  static async create(input: CreateSaleInput): Promise<Sale> {
    return await db.createSale(input);
  }

  static async updateStatus(id: string, status: 'PAID' | 'PENDING' | 'PARTIAL'): Promise<Sale> {
    return await db.updateSaleStatus(id, status);
  }

  static async updateSale(
    id: string,
    input: {
      status?: SaleStatus;
      items?: Array<{ product_id: string; quantity: number; unit_price: number }>;
    }
  ): Promise<Sale> {
    return await db.updateSale(id, input);
  }
}

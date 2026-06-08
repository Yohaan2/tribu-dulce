import { createServerClient } from '@/lib/supabase/server';
import { Sale } from '@/types';
import { CreateSaleInput } from '@/schemas/sale.schema';

export class SalesService {
  static async getAll(): Promise<Sale[]> {
    const supabase = await createServerClient();
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

  static async getById(id: string): Promise<Sale> {
    const supabase = await createServerClient();
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

  static async create(input: CreateSaleInput): Promise<Sale> {
    const supabase = await createServerClient();
    
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
      // Intentar revertir la venta creada si falla la inserción de items
      await supabase.from('sales').delete().eq('id', saleId);
      throw new Error(`Error registrando items: ${itemsError.message}`);
    }

    // Si el estado es PAID (Pagado), registrar automáticamente el primer pago
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
    }

    return this.getById(saleId);
  }

  static async updateStatus(id: string, status: 'PAID' | 'PENDING' | 'PARTIAL'): Promise<Sale> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('sales')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.getById(id);
  }
}

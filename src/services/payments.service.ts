import { createServerClient } from '@/lib/supabase/server';
import { Payment, Sale } from '@/types';
import { CreatePaymentInput } from '@/schemas/payment.schema';

export class PaymentsService {
  /**
   * Obtiene todas las deudas (ventas con estado PENDING o PARTIAL)
   */
  static async getDebts(): Promise<Sale[]> {
    const supabase = await createServerClient();
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

  /**
   * Registra un pago y recalcula el estado de la venta
   */
  static async createPayment(input: CreatePaymentInput): Promise<Payment> {
    const supabase = await createServerClient();

    // 1. Obtener los detalles actuales de la venta
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('total_usd')
      .eq('id', input.sale_id)
      .single();

    if (saleError || !sale) {
      throw new Error(`No se encontró la venta para el pago: ${saleError?.message}`);
    }

    // 2. Insertar el pago
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        sale_id: input.sale_id,
        amount_usd: input.amount_usd,
        amount_bs: input.amount_bs,
      })
      .select()
      .single();

    if (paymentError) throw new Error(paymentError.message);

    // 3. Obtener la suma total de pagos realizados a esta venta
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount_usd')
      .eq('sale_id', input.sale_id);

    if (paymentsError) throw new Error(paymentsError.message);

    const totalPaidUsd = (payments || []).reduce((acc, curr) => acc + Number(curr.amount_usd), 0);

    // 4. Actualizar el estado de la venta
    let newStatus: 'PAID' | 'PARTIAL' | 'PENDING' = 'PENDING';
    if (totalPaidUsd >= Number(sale.total_usd)) {
      newStatus = 'PAID';
    } else if (totalPaidUsd > 0) {
      newStatus = 'PARTIAL';
    }

    const { error: updateError } = await supabase
      .from('sales')
      .update({ status: newStatus })
      .eq('id', input.sale_id);

    if (updateError) {
      console.error('Error al actualizar el estado de la venta tras el pago:', updateError.message);
    }

    return payment;
  }
}

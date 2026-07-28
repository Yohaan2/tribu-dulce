import { db } from '@/lib/db';
import { Payment, Sale } from '@/types';
import { CreatePaymentInput, CreateClientPaymentInput } from '@/schemas/payment.schema';

export class PaymentsService {
  /**
   * Obtiene todas las deudas (ventas con estado PENDING o PARTIAL)
   */
  static async getDebts(): Promise<Sale[]> {
    return await db.getDebts();
  }

  /**
   * Registra un pago y recalcula el estado de la venta
   */
  static async createPayment(input: CreatePaymentInput): Promise<Payment> {
    // 1. Obtener los detalles actuales de la venta
    const sale = await db.getSaleById(input.sale_id);
    if (!sale) {
      throw new Error(`No se encontró la venta para el pago: ${input.sale_id}`);
    }

    // 2. Insertar el pago
    const payment = await db.createPayment(input);

    // 3. Obtener la suma total de pagos realizados a esta venta
    const payments = await db.getPaymentsBySaleId(input.sale_id);
    const totalPaidUsd = (payments || []).reduce((acc, curr) => acc + Number(curr.amount_usd), 0);

    // 4. Actualizar el estado de la venta
    let newStatus: 'PAID' | 'PARTIAL' | 'PENDING' = 'PENDING';
    if (totalPaidUsd >= Number(sale.total_usd)) {
      newStatus = 'PAID';
    } else if (totalPaidUsd > 0) {
      newStatus = 'PARTIAL';
    }

    try {
      await db.updateSaleStatus(input.sale_id, newStatus);
    } catch (updateError: any) {
      console.error('Error al actualizar el estado de la venta tras el pago:', updateError.message);
    }

    return payment;
  }

  /**
   * Registra un pago de cliente distribuido entre sus ventas pendientes (más antiguas primero)
   */
  static async createClientPayment(input: CreateClientPaymentInput): Promise<void> {
    const { client_id, amount_usd, amount_bs } = input;

    // 1. Obtener todas las deudas pendientes del cliente (más antiguas primero)
    const sales = await db.getClientDebts(client_id);
    if (!sales || sales.length === 0) {
      throw new Error('El cliente no tiene deudas pendientes.');
    }

    let remainingUsd = amount_usd;
    let remainingBs = amount_bs;

    // Calcular la deuda total pendiente de cobro en USD
    let totalOutstandingUsd = 0;
    const salesWithOutstanding = sales.map((sale: any) => {
      const totalPaid = (sale.payments || []).reduce((acc: number, curr: any) => acc + Number(curr.amount_usd), 0);
      const outstanding = Number(sale.total_usd) - totalPaid;
      totalOutstandingUsd += outstanding;
      return {
        ...sale,
        totalPaidBefore: totalPaid,
        outstanding,
      };
    });

    // Validar si el pago supera la deuda
    if (remainingUsd > totalOutstandingUsd + 0.015) {
      throw new Error(`El monto del pago ($${remainingUsd.toFixed(2)}) supera la deuda total del cliente ($${totalOutstandingUsd.toFixed(2)}).`);
    }

    // 2. Distribuir el pago entre las ventas
    for (const sale of salesWithOutstanding) {
      if (remainingUsd <= 0.005) break;

      const outstanding = sale.outstanding;
      if (outstanding <= 0) continue;

      const payUsd = Math.min(remainingUsd, outstanding);
      let payBs = 0;
      if (amount_usd > 0) {
        payBs = (payUsd / amount_usd) * amount_bs;
      }

      const roundedPayUsd = Math.round(payUsd * 100) / 100;
      const roundedPayBs = Math.round(payBs * 100) / 100;

      if (roundedPayUsd > 0) {
        // Registrar pago para esta venta
        try {
          await db.createPayment({
            sale_id: sale.id,
            amount_usd: roundedPayUsd,
            amount_bs: roundedPayBs,
          });
        } catch (paymentError: any) {
          throw new Error(`Error al registrar pago de venta ${sale.id}: ${paymentError.message}`);
        }

        // Actualizar estado de la venta
        const totalPaidAfter = sale.totalPaidBefore + roundedPayUsd;
        let newStatus: 'PAID' | 'PARTIAL' | 'PENDING' = 'PENDING';
        if (totalPaidAfter >= Number(sale.total_usd) - 0.005) {
          newStatus = 'PAID';
        } else if (totalPaidAfter > 0) {
          newStatus = 'PARTIAL';
        }

        try {
          await db.updateSaleStatus(sale.id, newStatus);
        } catch (updateError: any) {
          console.error(`Error al actualizar estado de venta ${sale.id}:`, updateError.message);
        }

        remainingUsd -= roundedPayUsd;
        remainingBs -= roundedPayBs;
      }
    }
  }
}


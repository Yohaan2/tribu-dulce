import { z } from 'zod';

export const CreatePaymentSchema = z.object({
  sale_id: z.string().uuid({ message: 'El ID de la venta debe ser un UUID válido.' }),
  amount_usd: z.number().min(0, { message: 'El monto en dólares debe ser positivo.' }),
  amount_bs: z.number().min(0, { message: 'El monto en bolívares debe ser positivo.' }),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

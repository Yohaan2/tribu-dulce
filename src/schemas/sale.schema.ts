import { z } from 'zod';

export const CreateSaleItemSchema = z.object({
  product_id: z.string().uuid({ message: 'El ID de producto debe ser un UUID válido.' }),
  quantity: z.number().int().positive({ message: 'La cantidad debe ser mayor a 0.' }),
  unit_price: z.number().min(0, { message: 'El precio unitario debe ser positivo.' }),
});

export const CreateSaleSchema = z.object({
  client_id: z.string().uuid({ message: 'Debe seleccionar un cliente válido.' }),
  items: z.array(CreateSaleItemSchema).min(1, { message: 'Debe agregar al menos un producto a la venta.' }),
  total_usd: z.number().min(0, { message: 'El total en dólares debe ser positivo.' }),
  total_bs: z.number().min(0, { message: 'El total en bolívares debe ser positivo.' }),
  status: z.enum(['PAID', 'PENDING', 'PARTIAL'], { message: 'Estado de venta no válido.' }),
  created_by: z.string().uuid().optional().nullable(),
  partial_payment_usd: z.number().min(0, { message: 'El abono parcial debe ser positivo.' }).optional().nullable(),
});

export type CreateSaleInput = z.infer<typeof CreateSaleSchema>;
export type CreateSaleItemInput = z.infer<typeof CreateSaleItemSchema>;

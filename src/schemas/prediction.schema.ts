import { z } from 'zod';

export const CreatePredictionItemSchema = z.object({
  product_id: z.string().uuid({ message: 'ID de producto inválido' }),
  estimated_quantity: z.number().int().positive({ message: 'La cantidad estimada debe ser mayor a 0' }),
  unit_price: z.number().nonnegative({ message: 'El precio unitario no puede ser negativo' }).optional(),
  total_cost: z.number().nonnegative({ message: 'El costo total no puede ser negativo' }).default(0),
  unit_cost: z.number().nonnegative({ message: 'El costo unitario no puede ser negativo' }).optional(),
});

export const UpdatePredictionItemSchema = z.object({
  estimated_quantity: z.number().int().positive({ message: 'La cantidad estimada debe ser mayor a 0' }).optional(),
  unit_price: z.number().nonnegative({ message: 'El precio unitario no puede ser negativo' }).optional(),
  total_cost: z.number().nonnegative({ message: 'El costo total no puede ser negativo' }).optional(),
  unit_cost: z.number().nonnegative({ message: 'El costo unitario no puede ser negativo' }).optional(),
});


export const ResetPredictionSchema = z.object({
  notes: z.string().optional(),
});

export type CreatePredictionItemInput = z.infer<typeof CreatePredictionItemSchema>;
export type UpdatePredictionItemInput = z.infer<typeof UpdatePredictionItemSchema>;
export type ResetPredictionInput = z.infer<typeof ResetPredictionSchema>;

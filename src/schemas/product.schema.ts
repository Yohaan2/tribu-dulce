import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string().min(2, { message: 'El nombre del producto debe tener al menos 2 caracteres.' }),
  price_usd: z.number().min(0, { message: 'El precio debe ser un número positivo.' }),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

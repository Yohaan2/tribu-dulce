import { z } from 'zod';

export const CreateClientSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().optional().nullable().or(z.literal('')),
});

export const UpdateClientSchema = CreateClientSchema.partial();

export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;

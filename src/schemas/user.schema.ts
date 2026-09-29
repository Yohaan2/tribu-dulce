import { z } from 'zod';

export const CreateUserSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email().transform((email) => email.toLowerCase()),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'EMPLOYEE']),
});

export const UpdateUserSchema = CreateUserSchema.omit({ password: true }).partial().extend({
  password: z.string().min(8).optional(),
  is_active: z.boolean().optional(),
}).refine((input) => Object.keys(input).length > 0);

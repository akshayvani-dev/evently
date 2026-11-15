import { z } from 'zod';

export const listUserRegistrationsQuerySchema = z.object({
  status: z.enum(['active', 'canceled']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const listEventAttendeesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type ListUserRegistrationsQuery = z.infer<typeof listUserRegistrationsQuerySchema>;
export type ListEventAttendeesQuery = z.infer<typeof listEventAttendeesQuerySchema>;

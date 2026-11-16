import { z } from 'zod';

const eventListPaginationSchema = z.object({
  title: z.string().trim().max(255, 'title cannot exceed 255 characters').optional(),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const publicEventListQuerySchema = eventListPaginationSchema.extend({
  dateFilter: z.enum(['all', 'this-week', 'this-month', 'next-3-months']).optional(),
});

export const organizerEventListQuerySchema = eventListPaginationSchema.extend({
  status: z.enum(['all', 'published', 'draft', 'canceled', 'completed']).default('all'),
});

const isValidIanaTimezone = (tz: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const timezoneSchema = z
  .string({ required_error: 'timezone is required' })
  .trim()
  .refine(isValidIanaTimezone, {
    message: 'timezone must be a valid IANA timezone (e.g., UTC, America/New_York, Asia/Kolkata)',
  });

const futureDateSchema = z
  .string({ required_error: 'startAt is required' })
  .refine((val) => !isNaN(Date.parse(val)), {
    message: 'startAt must be a valid date string',
  })
  .refine((val) => new Date(val).getTime() > Date.now(), {
    message: 'startAt must be a valid future date',
  });

export const createEventSchema = z
  .object({
    title: z
      .string({ required_error: 'title is required' })
      .trim()
      .min(1, 'title is required')
      .max(255, 'title cannot exceed 255 characters'),
    description: z
      .string({ required_error: 'description is required' })
      .trim()
      .min(1, 'description is required'),
    startAt: futureDateSchema,
    timezone: timezoneSchema,
    location: z
      .string({ required_error: 'location is required' })
      .trim()
      .min(1, 'location is required')
      .max(255, 'location cannot exceed 255 characters'),
    capacity: z
      .number({ required_error: 'capacity is required' })
      .int('capacity must be an integer')
      .positive('capacity must be a positive integer'),
    status: z.enum(['draft', 'published', 'canceled']).default('draft'),
  })
  .strict();

export const updateEventSchema = z
  .object({
    title: z
      .string({ required_error: 'title is required' })
      .trim()
      .min(1, 'title is required')
      .max(255, 'title cannot exceed 255 characters'),
    description: z
      .string({ required_error: 'description is required' })
      .trim()
      .min(1, 'description is required'),
    startAt: futureDateSchema,
    timezone: timezoneSchema,
    location: z
      .string({ required_error: 'location is required' })
      .trim()
      .min(1, 'location is required')
      .max(255, 'location cannot exceed 255 characters'),
    capacity: z
      .number({ required_error: 'capacity is required' })
      .int('capacity must be an integer')
      .positive('capacity must be a positive integer'),
    status: z.enum(['draft', 'published', 'canceled'], {
      required_error: 'status is required',
    }),
  })
  .strict();

export const patchEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'title cannot be empty')
      .max(255, 'title cannot exceed 255 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .min(1, 'description cannot be empty')
      .optional(),
    startAt: futureDateSchema.optional(),
    timezone: timezoneSchema.optional(),
    location: z
      .string()
      .trim()
      .min(1, 'location cannot be empty')
      .max(255, 'location cannot exceed 255 characters')
      .optional(),
    capacity: z
      .number()
      .int('capacity must be an integer')
      .positive('capacity must be a positive integer')
      .optional(),
    status: z.enum(['draft', 'published', 'canceled', 'completed']).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type PatchEventInput = z.infer<typeof patchEventSchema>;
export type PublicEventListQuery = z.infer<typeof publicEventListQuerySchema>;
export type OrganizerEventListQuery = z.infer<typeof organizerEventListQuerySchema>;
export interface EventListFilters {
  title?: string;
  dateFilter?: 'all' | 'this-week' | 'this-month' | 'next-3-months';
  page: number;
  limit: number;
}

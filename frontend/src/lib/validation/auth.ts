import { z } from 'zod';

export type AuthTab = 'signin' | 'signup';
export type UserRole = 'attendee' | 'organizer';

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required')
    .max(500, 'Email must be 500 characters or fewer')
    .email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be 100 characters or fewer'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required')
    .max(500, 'Email must be 500 characters or fewer')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  role: z.enum(['attendee', 'organizer'], {
    error: 'Please select how you will use Evently',
  }),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;

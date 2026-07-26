import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .regex(/[a-z]/, 'Add a lowercase letter')
  .regex(/[A-Z]/, 'Add an uppercase letter')
  .regex(/[0-9]/, 'Add a number');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const postSchema = z.object({
  caption: z
    .string()
    .trim()
    .min(1, 'Add a caption')
    .max(2200, 'Captions are limited to 2,200 characters'),
  imageUrl: z.string().url('Add a valid image URL').or(z.literal('')),
});

export type PostFormValues = z.infer<typeof postSchema>;

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, 'Name is required').max(50),
  username: z
    .string()
    .trim()
    .min(2, 'At least 2 characters')
    .max(20, 'At most 20 characters')
    .regex(/^[a-z0-9_.]+$/i, 'Letters, numbers, dot and underscore only'),
  bio: z.string().trim().max(160, 'Bio is limited to 160 characters'),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message: 'You must accept the terms to continue',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;

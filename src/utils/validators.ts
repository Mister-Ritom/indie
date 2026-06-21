import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a number'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be 30 characters or fewer')
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
  full_name: z.string().min(1, 'Enter your name').max(60),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[0-9]/, 'Must include a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const editProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Minimum 3 characters')
    .max(30, 'Maximum 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
  full_name: z.string().max(60, 'Maximum 60 characters').optional(),
  bio: z.string().max(160, 'Bio must be 160 characters or fewer').optional(),
  website: z
    .string()
    .url('Enter a valid URL')
    .optional()
    .or(z.literal('')),
});

export const createPinSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  link: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  alt_text: z.string().max(255).optional(),
  interest_id: z.string().uuid('Please select a category'),
  board_id: z.string().uuid().optional().or(z.literal('')),
});

export const createBoardSchema = z.object({
  name: z.string().min(1, 'Board name is required').max(50),
  description: z.string().max(200).optional(),
  is_private: z.boolean(),
});

export const commentSchema = z.object({
  text: z.string().min(1, 'Comment cannot be empty').max(500),
});

export type SignUpForm = z.infer<typeof signUpSchema>;
export type LoginForm = z.infer<typeof loginSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
export type EditProfileForm = z.infer<typeof editProfileSchema>;
export type CreatePinForm = z.infer<typeof createPinSchema>;
export type CreateBoardForm = z.infer<typeof createBoardSchema>;
export type CommentForm = z.infer<typeof commentSchema>;

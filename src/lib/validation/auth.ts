import { z } from 'zod';

const hasLetter = /[A-Za-z]/;
const hasDigit = /\d/;

export const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().email(),
    password: z
      .string()
      .min(8)
      .regex(hasLetter, 'Password must contain a letter')
      .regex(hasDigit, 'Password must contain a digit'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

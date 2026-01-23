import { z } from "zod";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 4;

// Login schema
export const loginSchema = z.object({
  email: z.string().min(1, "Podaj adres email.").regex(EMAIL_PATTERN, "Podaj poprawny adres email."),
  password: z.string().min(PASSWORD_MIN_LENGTH, `Hasło powinno mieć co najmniej ${PASSWORD_MIN_LENGTH} znaków.`),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// Register schema
export const registerSchema = z
  .object({
    email: z.string().min(1, "Podaj adres email.").regex(EMAIL_PATTERN, "Podaj poprawny adres email."),
    password: z.string().min(PASSWORD_MIN_LENGTH, `Hasło powinno mieć co najmniej ${PASSWORD_MIN_LENGTH} znaków.`),
    confirmPassword: z.string().min(1, "Potwierdź hasło."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne.",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Podaj adres email.").regex(EMAIL_PATTERN, "Podaj poprawny adres email."),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

// Reset password schema
export const resetPasswordSchema = z
  .object({
    password: z.string().min(PASSWORD_MIN_LENGTH, `Hasło powinno mieć co najmniej ${PASSWORD_MIN_LENGTH} znaków.`),
    confirmPassword: z.string().min(1, "Potwierdź hasło."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne.",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

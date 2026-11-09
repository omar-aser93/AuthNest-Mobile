import { z } from "zod";

// ─── Shared email field (Trims + lowercases the input before validation.) Same as the web client.
const emailField = z.string().trim().toLowerCase().pipe(z.email("Invalid email format").max(100, "Email cannot exceed 100 characters"));


// ─── Register ───────────────────────────────────────────────────────────────
export const registerSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name cannot exceed 50 characters"),
    email: emailField,
    password: z.string().min(6, "Password must be at least 6 characters").max(72, "Password cannot exceed 72 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type RegisterType = z.infer<typeof registerSchema>;


// ─── Login ──────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginType = z.infer<typeof loginSchema>;


// ─── Forgot password (request OTP) ──────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: emailField,
});
export type ForgotPasswordType = z.infer<typeof forgotPasswordSchema>;


// ─── Verify OTP ─────────────────────────────────────────────────────────────
export const otpSchema = z.object({
  email: emailField,
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d{6}$/, "OTP must contain only digits"),
});
export type OtpType = z.infer<typeof otpSchema>;


// ─── Reset password ─────────────────────────────────────────────────────────
export const resetPasswordSchema = z
  .object({
    email: emailField,
    resetToken: z.uuid("Invalid reset token"),
    newPassword: z.string().min(6, "New password must be at least 6 characters").max(72, "New password cannot exceed 72 characters"),
    confirmNewPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "Passwords do not match",
  });
export type ResetPasswordType = z.infer<typeof resetPasswordSchema>;
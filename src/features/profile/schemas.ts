import { z } from 'zod';

// ---------------------- UPDATE PROFILE ----------------------
export const updateProfileSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name cannot exceed 50 characters'),
  bio: z.string().max(200, 'Bio cannot exceed 200 characters').optional().nullable(),
  // NOTE: `image` is intentionally omitted. On web it's `z.instanceof(File)`.
  // On mobile the image comes from `expo-image-picker` as an ImagePickerAsset, which is handled outside RHF state, and is appended to FormData alongside name/bio.
});
export type UpdateProfileType = z.infer<typeof updateProfileSchema>;


// ---------------------- CHANGE PASSWORD (FROM PROFILE) ----------------------
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Current password must be at least 6 characters'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters').max(72, 'New password cannot exceed 72 characters'),
    confirmNewPassword: z.string().min(6, 'Confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    path: ['confirmNewPassword'],
    message: 'Passwords do not match',
  });
export type ChangePasswordType = z.infer<typeof changePasswordSchema>;
import { queryOptions, useMutation,} from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User } from '@/features/auth/types';
import type { MyStats } from './types';
import type { ImagePickerAsset } from 'expo-image-picker';
import type { UpdateProfileType, ChangePasswordType } from './schemas';

// ─── Query keys ──────────────────────────────────────────────────────────────
export const profileKeys = {
  all: ['profile'] as const,
  stats: () => [...profileKeys.all, 'stats'] as const,
  publicProfile: (userId: string) => [...profileKeys.all, 'public', userId] as const,
};


// ─── Fetch my stats ──────────────────────────────────────────────────────────
async function fetchMyStats(): Promise<MyStats> {
  const res = await api.get<MyStats>('/users/me/stats');
  return res.data;
}

export const myStatsQueryOptions = queryOptions({
  queryKey: profileKeys.stats(),
  queryFn: fetchMyStats,
  staleTime: 30_000,
});


// ─── Update profile ──────────────────────────────────────────────────────────
// The API only receives (name, bio) — image is managed separately.
type UpdateProfilePayload = Omit<UpdateProfileType, 'image'> & { id: string; imageAsset?: ImagePickerAsset | null;};

async function updateProfileRequest(payload: UpdateProfilePayload): Promise<User> {
  const { id, name, bio, imageAsset } = payload;
  const body = imageAsset ? buildProfileFormData({ name, bio, imageAsset }) : { name, bio };
  const res = await api.put(`/users/${id}`, body);
  return res.data;
}

function buildProfileFormData({ name, bio, imageAsset }: { name: string; bio?: string | null; imageAsset: ImagePickerAsset;}): FormData {
  const fd = new FormData();
  fd.append('name', name);
  // Always append bio — an empty string means "clear the bio" server-side.
  fd.append('bio', bio ?? '');
  // React Native's FormData accepts a plain object with (uri, name, type).. This is NOT a Blob — the RN native bridge knows how to handle it.
  fd.append('image', {
    uri: imageAsset.uri,
    name: imageAsset.fileName ?? `avatar.${(imageAsset.mimeType ?? 'image/jpeg').split('/')[1]}`,
    type: imageAsset.mimeType ?? 'image/jpeg',
  } as unknown as Blob);
  return fd;
}

export function useUpdateProfile() {
  return useMutation({ mutationFn: updateProfileRequest });
  // Note: caller (EditProfileScreen) is responsible for syncing AuthProvider via refreshUser() after success — stats don't change on profile update.
}


// ─── Change password ─────────────────────────────────────────────────────────
// The API only receives (currentPassword, newPassword) — confirmNewPassword is form-only.
type ChangePasswordPayload = Omit<ChangePasswordType, 'confirmNewPassword'> & { id: string };

async function changePasswordRequest(payload: ChangePasswordPayload): Promise<void> {
  const { id, currentPassword, newPassword } = payload;
  await api.post(`/users/${id}/change-password`, { currentPassword, newPassword });
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePasswordRequest });
}


// ─── Resend verification email ──────────────────────────────────────────────
async function resendVerificationRequest(): Promise<void> {
  await api.post('/auth/resend-verification');
}

export function useResendVerification() {
  return useMutation({ mutationFn: resendVerificationRequest });
}


// ─── Delete account ──────────────────────────────────────────────────────────
async function deleteAccountRequest(userId: string): Promise<void> {
  await api.delete(`/users/${userId}`);
}

export function useDeleteAccount() {
  return useMutation({ mutationFn: deleteAccountRequest });
}


// ─── Public user profile (for UserProfileScreen) ─────────────────────────────
export type PublicUserProfile = {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  createdAt: string;
};

async function fetchPublicProfile(userId: string): Promise<PublicUserProfile> {
  const res = await api.get<PublicUserProfile>(`/users/${userId}`);
  return res.data;
}

export const publicProfileQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: [...profileKeys.all, 'public', userId],
    queryFn: () => fetchPublicProfile(userId),
    staleTime: 5 * 60_000,   // profile data changes slowly
  });
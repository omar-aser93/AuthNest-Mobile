import { z } from 'zod';

// Create/Update Post Schema
export const createPostSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120, 'Title cannot exceed 120 characters'),
  content: z.string().trim().min(10, 'Content must be at least 10 characters'),
  privacy: z.enum(['PUBLIC', 'FRIENDS', 'ONLY_ME', 'CUSTOM']),
});
export type CreatePostType = z.infer<typeof createPostSchema>;


// ─── Share ───────────────────────────────────────────────────────────────────
// Share — creation flow only (used by ShareModal), Backend accepts PUBLIC | FRIENDS | ONLY_ME for shares (CUSTOM is not allowed — sharing is not a first-class post; the API rejects it). Blocked users are optional.
export const shareSchema = z.object({
  message: z.string().trim().max(300, 'Message cannot exceed 300 characters').optional().or(z.literal('')),
  privacy: z.enum(['PUBLIC', 'FRIENDS', 'ONLY_ME']),
});
export type ShareType = z.infer<typeof shareSchema>;


// Shared post edit — the "content" field IS the share message (optional, max 300), No title validation (shared posts have no title, backend ignores it).
export const updateSharedPostSchema = z.object({
  title: z.string().optional().or(z.literal('')),
  content: z.string().trim().max(300, 'Message cannot exceed 300 characters').optional().or(z.literal('')),
  privacy: z.enum(['PUBLIC', 'FRIENDS', 'ONLY_ME', 'CUSTOM']),
});
export type UpdateSharedPostType = z.infer<typeof updateSharedPostSchema>;



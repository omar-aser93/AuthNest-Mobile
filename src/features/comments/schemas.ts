import { z } from 'zod';

// Only `content` goes through the form. `parentId` and `taggedUsers` are
// props / external state — they never change while the form is mounted.
export const commentSchema = z.object({
  content: z.string().trim().min(1, 'Comment cannot be empty').max(700, 'Comment cannot exceed 700 characters'),
});
export type CommentType = z.infer<typeof commentSchema>;
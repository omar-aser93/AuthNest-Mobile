import type { ReactionType } from '@/features/reactions/types';

export type CommentAuthor = {
  id: string;
  name: string | null;
  image: string | null;
};

export type Comment = {
  id: string;
  content: string;
  postId: string;
  parentId: string | null;
  user: CommentAuthor;
  isEdited: boolean;
  createdAt: string;
  updatedAt?: string;
  myReaction?: ReactionType | null;
  reactionCount: number;
  replyCount: number;
};

export type CommentsPage = {
  comments: Comment[];
  nextCursor: string | null;
};
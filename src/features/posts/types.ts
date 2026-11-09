import type { ReactionType } from '@/features/reactions/types';

export type PostPrivacy = 'PUBLIC' | 'FRIENDS' | 'ONLY_ME' | 'CUSTOM';

export type PostAuthor = {
  id: string;
  name: string | null;
  image: string | null;
};

export type Post = {
  id: string;
  title: string | null;
  content: string | null;
  image: string | null;
  privacy: PostPrivacy;
  allowed: string[];
  blocked: string[];
  hashtags: string[];
  author: PostAuthor;

  // Shared post relation (self-referencing)
  originalPost?: Post | null;
  isShared?: boolean;

  isEdited: boolean;
  createdAt: string;
  updatedAt?: string;
  savedAt?: string;          // only in saved-posts responses

  myReaction?: ReactionType | null;
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  hasShared?: boolean;       // did the current user already share this
};


// ─── Edit history Types (shared by posts, comments, and messages) ────────────
export type EditHistoryEntry = {
  id: string;
  editedAt: string;
  oldContent: string;
  newContent: string;
  editor: {
    id: string;
    name: string;
    image: string | null;
  };
};

export type EditHistoryResponse = {
  edits: EditHistoryEntry[];
};


// ─── Share Post Types ────────────────────────────────────────────────────────
export type SharePostPayload = {
  postId:  string;
  message?: string;
  privacy: 'PUBLIC' | 'FRIENDS' | 'ONLY_ME';
  blocked?: string[];
};
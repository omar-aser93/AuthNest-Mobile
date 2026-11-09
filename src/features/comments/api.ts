import { infiniteQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { editHistoryKeys } from '@/features/posts/api';
import type { EditHistoryEntry, EditHistoryResponse } from '@/features/posts/types';
import type { Comment, CommentsPage } from './types';
import type { ReactionType } from '@/features/reactions/types';
import { postKeys } from '@/features/posts/api';

// ─── Query keys ──────────────────────────────────────────────────────────────
export const commentKeys = {
  all: ['comments'] as const,
  list: (postId: string) => [...commentKeys.all, 'post', postId, 'list'] as const,
  replies: (parentId: string) => [...commentKeys.all, 'replies', parentId] as const,
};


// ─── Fetchers ────────────────────────────────────────────────────────────────
// Backend: GET /api/v1/comments/posts/:postId/comments?limit&cursor&parentId
// parentId absent → top-level comments; parentId set → replies for that comment.
async function fetchComments(
  postId: string,
  cursor?: string,
  parentId?: string,
): Promise<CommentsPage> {
  const res = await api.get<CommentsPage>(`/comments/posts/${postId}/comments`, {
    params: { limit: 10, cursor, parentId },
  });
  return res.data;
}

// ─── Infinite query factories ────────────────────────────────────────────────
export const postCommentsQueryOptions = (postId: string) =>
  infiniteQueryOptions({
    queryKey: commentKeys.list(postId),
    queryFn: ({ pageParam }) => fetchComments(postId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });

export const commentRepliesQueryOptions = (postId: string, parentId: string) =>
  infiniteQueryOptions({
    queryKey: commentKeys.replies(parentId),
    queryFn: ({ pageParam }) => fetchComments(postId, pageParam, parentId),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });


// ─── Create comment ──────────────────────────────────────────────────────────
type CreateCommentPayload = {
  postId: string;
  content: string;
  parentId?: string | null;
  taggedUsers?: string[];
};

async function createCommentRequest(p: CreateCommentPayload): Promise<Comment> {
  const res = await api.post<Comment>(`/comments/posts/${p.postId}/comments`, {
    content: p.content,
    parentId: p.parentId,
    taggedUsers: p.taggedUsers,
  });
  return res.data;
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCommentRequest,
    onSuccess: (newComment, variables) => {
      // Prepend to the correct list so the new comment appears immediately.
      // Web does the same thing via setComments((prev) => [newComment, ...prev]).
      const key = variables.parentId
        ? commentKeys.replies(variables.parentId)
        : commentKeys.list(variables.postId);

      qc.setQueryData(key, (old: { pages: CommentsPage[]; pageParams: unknown[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: [
            { ...old.pages[0], comments: [newComment, ...old.pages[0].comments] },
            ...old.pages.slice(1),
          ],
        };
      });

      // Reply → parent top-level comment's replyCount changed.
      if (variables.parentId) {
        qc.invalidateQueries({ queryKey: commentKeys.list(variables.postId) });
      }

      // Post's commentCount changed → refetch the post detail.
      qc.invalidateQueries({ queryKey: postKeys.detail(variables.postId) });
    },
  });
}


// ─── Update comment ──────────────────────────────────────────────────────────
type UpdateCommentPayload = {
  commentId: string;
  postId: string;
  parentId?: string | null;
  content: string;
  taggedUsers?: string[];
};

async function updateCommentRequest(p: UpdateCommentPayload): Promise<Comment> {
  const res = await api.put<Comment>(`/comments/${p.commentId}`, {
    content: p.content,
    taggedUsers: p.taggedUsers,
  });
  return res.data;
}

export function useUpdateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateCommentRequest,
    onSuccess: (_comment, variables) => {
      // Invalidate the containing list. isEdited may have flipped, and content changed 
      //  best to refetch so any adjacent cache (e.g. reply previews) stays in sync.
      if (variables.parentId) {
        qc.invalidateQueries({ queryKey: commentKeys.replies(variables.parentId) });
      }
      qc.invalidateQueries({ queryKey: commentKeys.list(variables.postId) });
      qc.invalidateQueries({ queryKey: editHistoryKeys.comment(variables.commentId) });
    },
  });
}


// ─── Delete comment ──────────────────────────────────────────────────────────
type DeleteCommentPayload = {
  commentId: string;
  postId: string;
  parentId?: string | null;
};

async function deleteCommentRequest(p: DeleteCommentPayload): Promise<void> {
  await api.delete(`/comments/${p.commentId}`);
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCommentRequest,
    onSuccess: (_void, variables) => {
      // Backend cascades: deleting a top-level comment removes all its replies.
      // Reply → parent's replyCount changes.
      if (variables.parentId) {
        qc.invalidateQueries({ queryKey: commentKeys.replies(variables.parentId) });
      }
      qc.invalidateQueries({ queryKey: commentKeys.list(variables.postId) });
      // Post's commentCount changed.
      qc.invalidateQueries({ queryKey: postKeys.detail(variables.postId) });
    },
  });
}


// ─── React to comment ────────────────────────────────────────────────────────
type ReactCommentPayload = {
  commentId: string;
  postId: string;
  parentId?: string | null;
  type: ReactionType | null;
};

async function reactToCommentRequest(p: ReactCommentPayload): Promise<void> {
  if (p.type) {
    await api.post(`/reactions/comments/${p.commentId}/reactions`, { type: p.type });
  } else {
    await api.delete(`/reactions/comments/${p.commentId}/reactions`);
  }
}

// Helper to Patch the comment in the cache.
function patchCommentInCache( qc: ReturnType<typeof useQueryClient>, key: readonly unknown[], commentId: string, patch: (c: Comment) => Comment ) {
  qc.setQueryData<{ pages: CommentsPage[]; pageParams: unknown[] }>(key, (old) =>
    old && {
      ...old,
      pages: old.pages.map((page) => (
        { ...page, comments: page.comments.map((c) => (c.id === commentId ? patch(c) : c)) }
      )),
    },
  );
}

export function useReactToComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reactToCommentRequest,
    onSuccess: (_void, v) => {
      const key = v.parentId ? commentKeys.replies(v.parentId) : commentKeys.list(v.postId);
      patchCommentInCache(qc, key, v.commentId, (c) => ({
        ...c,
        myReaction: v.type,
        reactionCount: (c.reactionCount ?? 0) + (v.type ? 1 : 0) - (c.myReaction ? 1 : 0),
      }));
    },
  });
}


// ─── Comment edit history ────────────────────────────────────────────────────
// Backend: GET /api/v1/edit-history/comments/:commentId/edits → { edits }
// Shares the key prefix with post edit history so invalidation can target both via ['edit-history'] if ever needed.
async function fetchCommentEditHistory(commentId: string): Promise<EditHistoryEntry[]> {
  const res = await api.get<EditHistoryResponse>(`/edit-history/comments/${commentId}/edits`);
  return res.data.edits;
}

export function useCommentEditHistory(commentId: string, enabled: boolean) {
  return useQuery({
    queryKey: editHistoryKeys.comment(commentId),
    queryFn: () => fetchCommentEditHistory(commentId),
    enabled,
    staleTime: 60_000,
  });
}
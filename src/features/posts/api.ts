import { queryOptions, useMutation, useQueryClient, infiniteQueryOptions, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Post, PostPrivacy, EditHistoryEntry, EditHistoryResponse, SharePostPayload } from './types';
import type { ReactionType } from '@/features/reactions/types';
import type { CreatePostType } from './schemas';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';

// ─── Query keys ──────────────────────────────────────────────────────────────
export const postKeys = {
  all: ['posts'] as const,
  feed: () => [...postKeys.all, 'feed'] as const,
  detail: (id: string) => [...postKeys.all, 'detail', id] as const,
  myPosts: () => [...postKeys.all, 'my'] as const,
  saved: () => [...postKeys.all, 'saved'] as const,
  byUser: (userId: string) => [...postKeys.all, 'user', userId] as const,
  byHashtag: (tag: string) => [...postKeys.all, 'hashtag', tag] as const,
};

export const editHistoryKeys = {
  all: ['edit-history'] as const,
  post: (postId: string) => [...editHistoryKeys.all, 'post', postId] as const,
  comment: (commentId: string) => [...editHistoryKeys.all, 'comment', commentId] as const,
};


// ─── Shared FormData builder ─────────────────────────────────────────────────
// Multipart for both create and update — image is optional, backend uses multer.
// `privacy` is widened to PostPrivacy (4 values) because the form schema's narrow
// 3-option enum can't represent CUSTOM — the edit form preserves it via `preservedCustom`.
type PostPayload = Omit<CreatePostType, 'privacy'> & {
  privacy: PostPrivacy;
  allowed?: string[];
  blocked?: string[];
  taggedUsers?: string[];
  imageUri?: string;
  imageName?: string;
  imageType?: string;
};

function buildPostFormData(p: PostPayload): FormData {
  const fd = new FormData();
  // Skip empty title/content: the backend's updatePostSchema rejects ''. The schema's .optional() accepts missing fields as "don't update". This is required for shared post edit
  if (p.title) fd.append('title', p.title);
  if (p.content) fd.append('content', p.content);
  fd.append('privacy', p.privacy);
  p.taggedUsers?.forEach((id) => fd.append('taggedUsers[]', id));
  p.allowed?.forEach((id) => fd.append('allowed[]', id));
  p.blocked?.forEach((id) => fd.append('blocked[]', id));

  if (p.imageUri) {
    // React Native's FormData accepts { uri, name, type } — the native bridge handles file:// URIs. Not a real Blob; TS only sees the API surface.
    fd.append('image', {
      uri: p.imageUri,
      name: p.imageName ?? 'photo.jpg',
      type: p.imageType ?? 'image/jpeg',
    } as unknown as Blob);
  }
  return fd;
}

// ─── Single post detail (used by EditPostScreen and, later, PostDetailScreen) ─
async function fetchPostDetail(id: string): Promise<Post> {
  const res = await api.get<Post>(`/posts/${id}`);
  return res.data;
}

export const postDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: postKeys.detail(id),
    queryFn: () => fetchPostDetail(id),
    staleTime: 30_000,
  });


// ─── Create post ─────────────────────────────────────────────────────────────
async function createPostRequest(p: PostPayload): Promise<Post> {
  const res = await api.post<Post>('/posts', buildPostFormData(p));
  return res.data;
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPostRequest,
    onSuccess: (post) => {
      qc.invalidateQueries({ queryKey: postKeys.feed() });
      qc.invalidateQueries({ queryKey: postKeys.myPosts() });
      // In case the user is viewing their own public profile from another screen
      qc.invalidateQueries({ queryKey: postKeys.byUser(post.author.id) });
      qc.invalidateQueries({ queryKey: ['profile', 'stats'] });   // posts count +1
    },
  });
}


// ─── Update post ─────────────────────────────────────────────────────────────
async function updatePostRequest(p: PostPayload & { id: string }): Promise<Post> {
  const { id, ...rest } = p;
  const res = await api.put<Post>(`/posts/${id}`, buildPostFormData(rest));
  return res.data;
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePostRequest,
    onSuccess: (post) => {
      qc.invalidateQueries({ queryKey: postKeys.detail(post.id) });
      qc.invalidateQueries({ queryKey: postKeys.feed() });
      qc.invalidateQueries({ queryKey: postKeys.myPosts() });
      qc.invalidateQueries({ queryKey: postKeys.byUser(post.author.id) });
      qc.invalidateQueries({ queryKey: editHistoryKeys.post(post.id) });
      // Hashtag feeds: not invalidated here — an edit could add/remove tags, but we don't have the old hashtag list without an extra cache read.
    },
  });
}


// ─── Delete post ─────────────────────────────────────────────────────────────
async function deletePostRequest(id: string): Promise<void> {
  await api.delete(`/posts/${id}`);
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePostRequest,
    onSuccess: (_void, id) => {
      // Purge the detail cache — a subsequent navigation to /posts/:id should 404
      qc.removeQueries({ queryKey: postKeys.detail(id) });
      // Everything else (feed, my, saved, byUser, byHashtag) needs to drop the post
      qc.invalidateQueries({ queryKey: postKeys.all });
      qc.invalidateQueries({ queryKey: ['profile', 'stats'] });   // posts count -1
    },
  });
}


// ─── Toggle save ─────────────────────────────────────────────────────────────
async function toggleSaveRequest(id: string): Promise<{ saved: boolean }> {
  const res = await api.post<{ saved: boolean }>(`/saved-posts/${id}/toggle`);
  return res.data;
}

export function useToggleSavePost() {
  const qc = useQueryClient();
  const { user, updateUser } = useAuth();
  const userIdRef = useRef(user?.id);

  useEffect(() => { userIdRef.current = user?.id; }, [user?.id]);

  return useMutation({
    mutationFn: toggleSaveRequest,
    onSuccess: (data, postId) => {
      qc.invalidateQueries({ queryKey: postKeys.saved() });
      qc.invalidateQueries({ queryKey: ['profile', 'stats'] });
      // Sync the auth user's savedPosts list so `isSaved` props on OTHER cards reflect the change after any refetch. 
      // Guard against a stale closure if the user logged out while this request was in flight.
      if (!user || user.id !== userIdRef.current) return;
      const savedPosts = data.saved ? user.savedPosts.some((sp) => sp.postId === postId)
          ? user.savedPosts : [...user.savedPosts, { postId }]
        : user.savedPosts.filter((sp) => sp.postId !== postId);

      updateUser({ ...user, savedPosts });
    },
  });
}


// ─── React to post ───────────────────────────────────────────────────────────
type ReactPayload = { postId: string; type: ReactionType | null };

async function reactToPostRequest({ postId, type }: ReactPayload): Promise<void> {
  if (type) {
    await api.post(`/reactions/posts/${postId}/reactions`, { type });
  } else {
    await api.delete(`/reactions/posts/${postId}/reactions`);
  }
}

// Helper to Patch the post in the cache.
function patchPost(old: unknown, postId: string, fn: (p: Post) => Post): unknown {
  if (!old || typeof old !== 'object') return old;
  const o = old as any;
  if (Array.isArray(o.pages)) {                     // infinite lists: feed, my, saved, byUser, hashtag
    return { ...o, pages: o.pages.map((pg: PostsPage) => ({ ...pg, posts: pg.posts.map((p) => (p.id === postId ? fn(p) : p)) })) };
  }
  if (o.id === postId) return fn(o as Post);         
  return old;
}

export function useReactToPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reactToPostRequest,
    onSuccess: (_void, { postId, type }) => {
      qc.setQueriesData({ queryKey: postKeys.all }, (old) =>
        patchPost(old, postId, (p) => ({
          ...p,
          myReaction: type,
          reactionCount: (p.reactionCount ?? 0) + (type ? 1 : 0) - (p.myReaction ? 1 : 0),
        })),
      );
    },
  });
}


// ─── Post edit history ───────────────────────────────────────────────────────
// Backend: GET /api/v1/edit-history/posts/:postId/edits → { edits }
// Lazy: only fires when the trigger button opens the modal (enabled flag).
async function fetchPostEditHistory(postId: string): Promise<EditHistoryEntry[]> {
  const res = await api.get<EditHistoryResponse>(`/edit-history/posts/${postId}/edits`);
  return res.data.edits;
}

export function usePostEditHistory(postId: string, enabled: boolean) {
  return useQuery({
    queryKey: editHistoryKeys.post(postId),
    queryFn: () => fetchPostEditHistory(postId),
    enabled,
    staleTime: 60_000,
  });
}  


// ─── Share post ──────────────────────────────────────────────────────────────
async function sharePostRequest(p: SharePostPayload): Promise<void> {
  await api.post(`/shares/posts/${p.postId}/shares`, {
    message: p.message,
    privacy: p.privacy,
    blocked: p.blocked ?? [],
  });
}

export function useSharePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sharePostRequest,
    onSuccess: (_void, variables) => {
      // Backend creates a new Post row (isShared=true, originalPostId = variables.postId),
      // so the feed & my-posts both gain one row, and the original's detail cache now
      // has a stale shareCount + hasShared flag.
      qc.invalidateQueries({ queryKey: postKeys.feed() });
      qc.invalidateQueries({ queryKey: postKeys.myPosts() });
      qc.invalidateQueries({ queryKey: postKeys.detail(variables.postId) });
      qc.invalidateQueries({ queryKey: ['profile', 'stats'] });   // posts count +1
    },
  });
}


// ─── Unshare post ────────────────────────────────────────────────────────────
// `originalPostId` — matches the backend route `DELETE /shares/posts/:originalPostId`.
// Do NOT pass the outer share post's id; the API looks up by (userId, originalPostId).
async function unsharePostRequest(originalPostId: string): Promise<void> {
  await api.delete(`/shares/posts/${originalPostId}`);
}

export function useUnsharePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unsharePostRequest,
    onSuccess: (_void, originalPostId) => {
      qc.invalidateQueries({ queryKey: postKeys.feed() });
      qc.invalidateQueries({ queryKey: postKeys.myPosts() });
      qc.invalidateQueries({ queryKey: postKeys.detail(originalPostId) });
      qc.invalidateQueries({ queryKey: ['profile', 'stats'] });   // posts count -1
    },
  });
}



// ─── Paginated post list shape ───────────────────────────────────────────────
type PostsPage = { posts: Post[]; nextCursor: string | null };

// ─── Fetchers ────────────────────────────────────────────────────────────────
async function fetchFeed(cursor?: string): Promise<PostsPage> {
  const res = await api.get<PostsPage>('/posts', { params: { limit: 10, cursor } });
  return res.data;
}

async function fetchMyPosts(cursor?: string): Promise<PostsPage> {
  const res = await api.get<PostsPage>('/posts/me', { params: { limit: 10, cursor } });
  return res.data;
}

async function fetchSavedPosts(cursor?: string): Promise<PostsPage> {
  const res = await api.get<PostsPage>('/saved-posts', { params: { limit: 10, cursor } });
  return res.data;
}

async function fetchPostsByHashtag(tag: string, cursor?: string): Promise<PostsPage> {
  const res = await api.get<PostsPage>(`/posts/hashtag/${tag}`, { params: { limit: 10, cursor } });
  return res.data;
}

async function fetchPostsByUser(userId: string, cursor?: string): Promise<PostsPage> {
  const res = await api.get<PostsPage>(`/posts/user/${userId}`, { params: { limit: 10, cursor } });
  return res.data;
}

// ─── Infinite query factories ────────────────────────────────────────────────
// Personalized feeds — staleTime 30s (fast-changing data).
export const feedInfiniteQueryOptions = () =>
  infiniteQueryOptions({
    queryKey: postKeys.feed(),
    queryFn: ({ pageParam }) => fetchFeed(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });

export const myPostsInfiniteQueryOptions = () =>
  infiniteQueryOptions({
    queryKey: postKeys.myPosts(),
    queryFn: ({ pageParam }) => fetchMyPosts(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });

export const savedPostsInfiniteQueryOptions = () =>
  infiniteQueryOptions({
    queryKey: postKeys.saved(),
    queryFn: ({ pageParam }) => fetchSavedPosts(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });

// Public data — staleTime 60s (matches web's revalidate: 60).
export const hashtagInfiniteQueryOptions = (tag: string) =>
  infiniteQueryOptions({
    queryKey: postKeys.byHashtag(tag),
    queryFn: ({ pageParam }) => fetchPostsByHashtag(tag, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 60_000,
  });

export const userPostsInfiniteQueryOptions = (userId: string) =>
  infiniteQueryOptions({
    queryKey: postKeys.byUser(userId),
    queryFn: ({ pageParam }) => fetchPostsByUser(userId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 60_000,
  });



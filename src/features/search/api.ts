import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { postKeys } from '@/features/posts/api';
import type { Post } from '@/features/posts/types';

// ─── Query keys ──────────────────────────────────────────────────────────────
export const searchKeys = {
  all: ['search'] as const,
  users: (q: string) => [...searchKeys.all, 'users', q] as const,
  hashtags: (q: string) => [...searchKeys.all, 'hashtags', q] as const,
  trending: () => [...searchKeys.all, 'trending'] as const,
  // Posts search uses `postKeys.all` as its prefix so `useDeletePost` /
  // `useUpdatePost` / `useCreatePost` invalidation (`['posts']`) automatically
  // refreshes any stale search result rows.
  posts: (q: string) => [...postKeys.all, 'search', q] as const,
};


// ═════════════════════════════════════════════════════════════════════════════
// POSTS — GET /posts?search=…&limit&cursor
// Backend route: getAllPosts() → reads `req.query.search`
// ═════════════════════════════════════════════════════════════════════════════
type PostsPage = { posts: Post[]; nextCursor: string | null };

async function fetchSearchPosts(q: string, cursor?: string): Promise<PostsPage> {
  const res = await api.get<PostsPage>('/posts', {
    params: { search: q, limit: 10, cursor },
  });
  return res.data;
}

export const searchPostsInfiniteQueryOptions = (q: string) =>
  infiniteQueryOptions({
    queryKey: searchKeys.posts(q),
    queryFn: ({ pageParam }) => fetchSearchPosts(q, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });


// ═════════════════════════════════════════════════════════════════════════════
// USERS — GET /users/search-users?q=…&limit&cursor
// Backend route: searchUsers() → reads `req.query.q`
// ═════════════════════════════════════════════════════════════════════════════
export type SearchUser = {
  id: string;
  name: string | null;
  image: string | null;
  bio?: string | null;
};

type UsersPage = { users: SearchUser[]; nextCursor: string | null };

async function fetchSearchUsers(q: string, cursor?: string): Promise<UsersPage> {
  const res = await api.get<UsersPage>('/users/search-users', {
    params: { q, limit: 20, cursor },
  });
  return res.data;
}

export const searchUsersInfiniteQueryOptions = (q: string) =>
  infiniteQueryOptions({
    queryKey: searchKeys.users(q),
    queryFn: ({ pageParam }) => fetchSearchUsers(q, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 60_000,
  });


// ═════════════════════════════════════════════════════════════════════════════
// HASHTAGS — GET /posts/search/hashtags?q=…&limit&page
// Backend route: searchHashtags() — offset pagination (page, not cursor)
// ═════════════════════════════════════════════════════════════════════════════
export type HashtagHit = { hashtag: string; count: number };

type HashtagsPage = {
  hashtags: HashtagHit[];
  totalPages: number;
  currentPage: number;
};

async function fetchSearchHashtags(q: string, page: number): Promise<HashtagsPage> {
  const res = await api.get<HashtagsPage>('/posts/search/hashtags', {
    params: { q, limit: 20, page },
  });
  return res.data;
}

export const searchHashtagsInfiniteQueryOptions = (q: string) =>
  infiniteQueryOptions({
    queryKey: searchKeys.hashtags(q),
    queryFn: ({ pageParam }) => fetchSearchHashtags(q, pageParam),
    initialPageParam: 1 as number,
    getNextPageParam: (last) =>
      last.currentPage < last.totalPages ? last.currentPage + 1 : undefined,
    staleTime: 60_000,
  });


// ═════════════════════════════════════════════════════════════════════════════
// TRENDING — GET /posts/trending?limit
// Public, no auth. Returns [{ hashtag, count }, …] top-N by post count.
// ═════════════════════════════════════════════════════════════════════════════
async function fetchTrending(): Promise<HashtagHit[]> {
  const res = await api.get<HashtagHit[]>('/posts/trending', {
    params: { limit: 10 },
  });
  return Array.isArray(res.data) ? res.data : [];
}

export const trendingHashtagsQueryOptions = () =>
  queryOptions({
    queryKey: searchKeys.trending(),
    queryFn: fetchTrending,
    staleTime: 5 * 60_000,   // trending doesn't shift every minute
  });
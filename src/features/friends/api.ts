import { queryOptions, infiniteQueryOptions, useInfiniteQuery, useMutation, useQueryClient, type QueryClient,} from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { FriendsResponse, FriendshipStatusResponse, RequestsResponse, SuggestionsResponse, BlockedUsersResponse,} from './types';


// ─── Query keys ──────────────────────────────────────────────────────────────
export const friendKeys = {
  all: ['friends'] as const,
  list: (q: string) => [...friendKeys.all, 'list', q] as const,
  status: (userId: string) => [...friendKeys.all, 'status', userId] as const,
  requests: (type: 'received' | 'sent') => [...friendKeys.all, 'requests', type] as const,
  suggestions: () => [...friendKeys.all, 'suggestions'] as const,
  blocked: () => [...friendKeys.all, 'blocked'] as const,
};


// ─── Shared invalidation helper ──────────────────────────────────────────────
function invalidateFriendCaches(qc: QueryClient, opts: { targetUserId?: string; affectsPosts?: boolean } = {}) {
  qc.invalidateQueries({ queryKey: friendKeys.all });
  qc.invalidateQueries({ queryKey: ['profile', 'stats'] });   // friends count
  if (opts.targetUserId) {
    qc.invalidateQueries({ queryKey: friendKeys.status(opts.targetUserId) });
  }
  if (opts.affectsPosts) {
    // Blocking/unblocking changes feed visibility
    qc.invalidateQueries({ queryKey: ['posts', 'feed'] });
  }
}


// ═════════════════════════════════════════════════════════════════════════════
// QUERIES
// ═════════════════════════════════════════════════════════════════════════════

// ─── Friends (paginated + searchable) ───────────────────────────────────────
async function fetchFriends(q: string, cursor?: string): Promise<FriendsResponse> {
  const res = await api.get<FriendsResponse>('/social/friends', {
    params: { limit: 20, cursor, q: q || undefined },
  });
  return res.data;
}

export const friendsInfiniteQueryOptions = (q: string) =>
  infiniteQueryOptions({
    queryKey: friendKeys.list(q),
    queryFn: ({ pageParam }) => fetchFriends(q, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

// Kept for `FriendPrivacySelector` — same shape it already consumes.
export function useInfiniteFriends(q: string) {
  return useInfiniteQuery(friendsInfiniteQueryOptions(q));
}


// ─── Friend requests ────────────────────────────────────────────────────────
async function fetchRequests(type: 'received' | 'sent', cursor?: string): Promise<RequestsResponse> {
  const res = await api.get<RequestsResponse>('/social/friends/requests', {
    params: { type, limit: 20, cursor },
  });
  return res.data;
}

export const requestsInfiniteQueryOptions = (type: 'received' | 'sent') =>
  infiniteQueryOptions({
    queryKey: friendKeys.requests(type),
    queryFn: ({ pageParam }) => fetchRequests(type, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });


// ─── Suggestions (non-paginated) ────────────────────────────────────────────
async function fetchSuggestions(): Promise<SuggestionsResponse> {
  const res = await api.get<SuggestionsResponse>('/social/friends/suggestions', {
    params: { limit: 20 },
  });
  return res.data;
}

export const suggestionsQueryOptions = () =>
  queryOptions({
    queryKey: friendKeys.suggestions(),
    queryFn: fetchSuggestions,
    staleTime: 60_000,   // suggestions don't change fast
  });


// ─── Blocked users ──────────────────────────────────────────────────────────
async function fetchBlockedUsers(cursor?: string): Promise<BlockedUsersResponse> {
  const res = await api.get<BlockedUsersResponse>('/social/friends/blocked', {
    params: { limit: 20, cursor },
  });
  return res.data;
}

export const blockedUsersInfiniteQueryOptions = () =>
  infiniteQueryOptions({
    queryKey: friendKeys.blocked(),
    queryFn: ({ pageParam }) => fetchBlockedUsers(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });


// ─── Friendship status (for FriendshipButton + UserProfileScreen) ───────────
async function fetchFriendshipStatus(userId: string): Promise<FriendshipStatusResponse> {
  try {
    const res = await api.get<FriendshipStatusResponse>(`/social/friends/status/${userId}`);
    return res.data;
  } catch {
    // Matches web behavior — treat any error as "no friendship".
    return { status: null };
  }
}

export const friendshipStatusQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: friendKeys.status(userId),
    queryFn: () => fetchFriendshipStatus(userId),
    staleTime: 30_000,
  });


// ═════════════════════════════════════════════════════════════════════════════
// MUTATIONS
// ═════════════════════════════════════════════════════════════════════════════

// ─── Send friend request ────────────────────────────────────────────────────
export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => api.post(`/social/friends/${targetUserId}/request`),
    onSuccess: (_res, targetUserId) => invalidateFriendCaches(qc, { targetUserId }),
  });
}

// ─── Cancel my sent request ─────────────────────────────────────────────────
export function useCancelFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => api.post(`/social/friends/${requestId}/cancel`),
    onSuccess: () => invalidateFriendCaches(qc),
  });
}

// ─── Accept a received request ──────────────────────────────────────────────
export function useAcceptFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => api.post(`/social/friends/${requestId}/accept`),
    onSuccess: () => invalidateFriendCaches(qc),
  });
}

// ─── Decline a received request ─────────────────────────────────────────────
export function useDeclineFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => api.post(`/social/friends/${requestId}/decline`),
    onSuccess: () => invalidateFriendCaches(qc),
  });
}

// ─── Remove friend ──────────────────────────────────────────────────────────
export function useRemoveFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => api.delete(`/social/friends/${targetUserId}`),
    onSuccess: (_res, targetUserId) => invalidateFriendCaches(qc, { targetUserId }),
  });
}

// ─── Block user ─────────────────────────────────────────────────────────────
export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => api.post(`/social/friends/${targetUserId}/block`),
    onSuccess: (_res, targetUserId) =>
      invalidateFriendCaches(qc, { targetUserId, affectsPosts: true }),
  });
}

// ─── Unblock user ───────────────────────────────────────────────────────────
export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => api.post(`/social/friends/${targetUserId}/unblock`),
    onSuccess: (_res, targetUserId) =>
      invalidateFriendCaches(qc, { targetUserId, affectsPosts: true }),
  });
}
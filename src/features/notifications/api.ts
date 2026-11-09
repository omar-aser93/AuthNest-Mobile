import { infiniteQueryOptions, queryOptions, useMutation, useQueryClient} from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { NotificationsPage } from './types';

// ─── Query keys ──────────────────────────────────────────────────────────────
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (unreadOnly: boolean) => [...notificationKeys.all, 'list', unreadOnly] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};


// ─── List (infinite, cursor-paginated) ──────────────────────────────────────
async function fetchNotifications(unreadOnly: boolean, cursor?: string): Promise<NotificationsPage> {
  const res = await api.get<NotificationsPage>('/notifications', {
    params: { limit: 20, cursor, unread: unreadOnly ? 'true' : undefined },
  });
  return res.data;
}

export const notificationsInfiniteQueryOptions = (unreadOnly = false) =>
  infiniteQueryOptions({
    queryKey: notificationKeys.list(unreadOnly),
    queryFn: ({ pageParam }) => fetchNotifications(unreadOnly, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });


// ─── Unread count (bell badge) ───────────────────────────────────────────────
// Poll every 60s. When chat lands, add a socket listener that calls `queryClient.invalidateQueries(notificationKeys.unreadCount())` on `new_notification` 
async function fetchUnreadCount(): Promise<number> {
  const res = await api.get<{ count: number }>('/notifications/unread-count');
  return res.data.count;
}

export const unreadCountQueryOptions = queryOptions({
  queryKey: notificationKeys.unreadCount(),
  queryFn: fetchUnreadCount,
  staleTime: 20_000,
  refetchInterval: 180_000,
});


// ─── Mark one as read ────────────────────────────────────────────────────────
export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: notificationKeys.all });
      const prevCount = qc.getQueryData<number>(notificationKeys.unreadCount());

      // 1. Decrement the bell badge
      qc.setQueryData(notificationKeys.unreadCount(), (old: number | undefined) =>
        Math.max(0, (old ?? 1) - 1),
      );

      // 2. All-notifications list → keep the row, flip isRead
      qc.setQueryData(
        notificationKeys.list(false),
        (old: { pages: NotificationsPage[]; pageParams: unknown[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              notifications: page.notifications.map((n) =>
                n.id === id ? { ...n, isRead: true } : n,
              ),
            })),
          };
        },
      );

      // 3. Unread-only list → row must disappear (it's no longer unread)
      qc.setQueryData(
        notificationKeys.list(true),
        (old: { pages: NotificationsPage[]; pageParams: unknown[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              notifications: page.notifications.filter((n) => n.id !== id),
            })),
          };
        },
      );

      return { prevCount };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.prevCount !== undefined) {
        qc.setQueryData(notificationKeys.unreadCount(), ctx.prevCount);
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}


// ─── Mark all as read ────────────────────────────────────────────────────────
export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => {
      qc.setQueryData(notificationKeys.unreadCount(), 0);
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}


// ─── Delete ──────────────────────────────────────────────────────────────────
export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
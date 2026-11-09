import { useMutation, useQueryClient, queryOptions, infiniteQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Conversation, ConversationPreview, MessagesPage } from './types';
import { ReactionType } from '../reactions/types';
import { useAuth } from '../auth/AuthProvider';

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...chatKeys.all, 'conversation', id] as const,
  messages: (id: string) => [...chatKeys.all, 'messages', id] as const,
  unread: () => [...chatKeys.all, 'unread'] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────
async function fetchConversations(): Promise<{ conversations: ConversationPreview[] }> {
  const res = await api.get<{ conversations: ConversationPreview[] }>('/chat/conversations');
  return res.data;
}

export const conversationsQueryOptions = () =>
  queryOptions({
    queryKey: chatKeys.conversations(),
    queryFn: fetchConversations,
    staleTime: 30_000,
  });

async function fetchConversation(id: string): Promise<{ conversation: Conversation }> {
  const res = await api.get<{ conversation: Conversation }>(`/chat/conversations/${id}`);
  return res.data;
}

export const conversationQueryOptions = (id: string) =>
  queryOptions({
    queryKey: chatKeys.conversation(id),
    queryFn: () => fetchConversation(id),
    staleTime: 60_000,
  });

async function fetchMessages(conversationId: string, cursor?: string): Promise<MessagesPage> {
  const res = await api.get<MessagesPage>(`/chat/conversations/${conversationId}/messages`, {
    params: { limit: 30, cursor },
  });
  return res.data;
}

export const messagesInfiniteQueryOptions = (conversationId: string) =>
  infiniteQueryOptions({
    queryKey: chatKeys.messages(conversationId),
    queryFn: ({ pageParam }) => fetchMessages(conversationId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
  });

// ─── Mutations ───────────────────────────────────────────────────────────────
export function useGetOrCreateDM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (targetUserId: string) => {
      const res = await api.post<{ conversation: Conversation; created: boolean }>(
        '/chat/conversations/dm',
        { targetUserId },
      );
      return res.data;              // ← unwrap
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.conversations() }),
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; participantIds: string[] }) => {
      const res = await api.post<{ conversation: Conversation }>(
        '/chat/conversations/group',
        payload,
      );
      return res.data;              // ← unwrap
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.conversations() }),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/chat/conversations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.conversations() }),
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/chat/conversations/${id}/participants`),
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.conversations() }),
  });
}

// Send with attachments (multipart). Files use RN's { uri, name, type } shape.
export function useSendMessageWithFiles(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { content: string; files: { uri: string; name: string; type: string }[]; taggedUserIds?: string[] }) => {
      const fd = new FormData();
      if (payload.content.trim()) fd.append('content', payload.content.trim());
      payload.files.forEach((f) => fd.append('attachments', f as unknown as Blob));
      payload.taggedUserIds?.forEach((id) => fd.append('taggedUserIds', id));
      const res = await api.post(`/chat/conversations/${conversationId}/messages`, fd);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.messages(conversationId) }),
  });
}


export function useSendGif(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (url: string) => {
      const res = await api.post(`/chat/conversations/${conversationId}/gif`, { url });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.messages(conversationId) }),
  });
}


// ─── React to message ────────────────────────────────────────────────────────────
type ReactMessagePayload = {
  messageId: string;
  conversationId: string;
  type: ReactionType | null;
};

async function reactToMessageRequest(p: ReactMessagePayload): Promise<{ summary: Record<string, number> }> {
  if (p.type) {
    const res = await api.post(`/reactions/messages/${p.messageId}/reactions`, { type: p.type });
    return { summary: res.data.summary };
  } else {
    const res = await api.delete(`/reactions/messages/${p.messageId}/reactions`);
    return { summary: res.data.summary };
  }
}

export function useReactToMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: reactToMessageRequest,
    onSuccess: ({ summary }, { conversationId, messageId, type }) => {
      const count = Object.values(summary).reduce((a, b) => a + b, 0);

      qc.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] }>(
        chatKeys.messages(conversationId),
        (old) =>
          old && { ...old, pages: old.pages.map((pg) => ({
              ...pg,
              messages: pg.messages.map((m) => {
                if (m.id !== messageId) return m;

                // Rebuild the reactions array: keep everyone else's, replace ours.
                const others = m.reactions.filter((r) => r.userId !== user?.id);
                const mine = type && user
                  ? [{ id: `temp-${user.id}-${Date.now()}`, type, userId: user.id,
                      user: { id: user.id, name: user.name ?? '', image: user.image },
                    }]
                  : [];

                return {...m, reactionSummary: summary, reactionCount: count, reactions: [...others, ...mine]};
              }),
            })),
          },
      );
    },
  });
}
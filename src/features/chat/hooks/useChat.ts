import { useCallback, useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/lib/socket/SocketProvider';
import { messagesInfiniteQueryOptions, chatKeys } from '../api';
import type { Message } from '../types';

export function useChat(conversationId: string) {
  const { socketRef, isConnected } = useSocket();
  const qc = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = useInfiniteQuery(messagesInfiniteQueryOptions(conversationId));

  // Flatten messages. Backend returns them chronological per page (oldest→newest),
  // and cursor goes "backward" in time. So pages[0] = most recent, pages[1] = older.
  // For the inverted FlatList, newest must come first — flatten and reverse.
  const allMessages: Message[] = [...(query.data?.pages ?? [])].reverse().flatMap((p) => p.messages);

  // ─── Socket listeners ────────────────────────────────────────────────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected || !conversationId) return;

    socket.emit('mark_read', { conversationId });

    const patchMessages = (fn: (msgs: Message[]) => Message[]) => {
      qc.setQueryData(chatKeys.messages(conversationId), (old: any) => {
        if (!old) return old;
        // Reverse pages to chronological, patch, then reverse back to keep shape.
        const chronological = old.pages.flatMap((p: any) => p.messages);
        const next = fn(chronological);
        // Re-chunk back into pages, preserving page count
        const pages: any[] = [];
        let cursor = 0;
        for (const p of old.pages) {
          pages.push({ ...p, messages: next.slice(cursor, cursor + p.messages.length) });
          cursor += p.messages.length;
        }
        return { ...old, pages };
      });
    };

    const onNew = (msg: Message) => {
      if (msg.conversationId !== conversationId) return;
      // Simple approach: invalidate to refetch (handles dedupe, ordering).
      qc.invalidateQueries({ queryKey: chatKeys.messages(conversationId) });
      socket.emit('mark_read', { conversationId });
    };

    const onEdited = (msg: Message) => {
      if (msg.conversationId !== conversationId) return;
      patchMessages((msgs) => msgs.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)));
    };

    const onDeleted = ({ messageId }: { messageId: string }) => {
      patchMessages((msgs) =>
        msgs.map((m) => (m.id === messageId ? { ...m, content: null, attachments: [] } : m)),
      );
    };

    const onTyping = ({ userId, conversationId: c }: any) => {
      if (c !== conversationId) return;
      setTypingUsers((p) => new Set(p).add(userId));
    };
    const onStopTyping = ({ userId, conversationId: c }: any) => {
      if (c !== conversationId) return;
      setTypingUsers((p) => { const n = new Set(p); n.delete(userId); return n; });
    };

    const onRead = ({ userId, readAt, conversationId: c }: any) => {
      if (c !== conversationId) return;
      patchMessages((msgs) =>
        msgs.map((m) =>
          m.reads.some((r) => r.userId === userId)
            ? m
            : { ...m, reads: [...m.reads, { userId, readAt, user: { id: userId, name: '', image: null } }] },
        ),
      );
    };

    const onReactionUpdated = ({ messageId, conversationId: c, summary, count }: {
      messageId: string;
      conversationId: string;
      summary: Record<string, number>;
      count: number;
    }) => {
      if (c !== conversationId) return;
      patchMessages((msgs) =>
        msgs.map((m) => m.id === messageId ? { ...m, reactionSummary: summary, reactionCount: count }: m ),
      );
    };

    socket.on('new_message', onNew);
    socket.on('message_edited', onEdited);
    socket.on('message_deleted', onDeleted);
    socket.on('user_typing', onTyping);
    socket.on('user_stopped_typing', onStopTyping);
    socket.on('messages_read', onRead);
    socket.on('message_reaction_updated', onReactionUpdated);

    return () => {
      socket.off('new_message', onNew);
      socket.off('message_edited', onEdited);
      socket.off('message_deleted', onDeleted);
      socket.off('user_typing', onTyping);
      socket.off('user_stopped_typing', onStopTyping);
      socket.off('messages_read', onRead);
      socket.off('message_reaction_updated', onReactionUpdated);
    };
  }, [conversationId, socketRef, isConnected, qc]);

  // ─── Actions ─────────────────────────────────────────────────────────────
  const sendTextMessage = useCallback(
    (content: string, taggedUserIds?: string[]) => {
      const socket = socketRef.current;
      if (!socket || !content.trim()) return;
      socket.emit('send_message', { conversationId, content: content.trim(), taggedUserIds });
    },
    [conversationId, socketRef],
  );

  const emitTypingStart = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit('typing_start', { conversationId });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => socket.emit('typing_stop', { conversationId }), 1500);
  }, [conversationId, socketRef]);

  const emitTypingStop = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    socket.emit('typing_stop', { conversationId });
  }, [conversationId, socketRef]);

  const editMessage = useCallback(
    (messageId: string, data: { content: string; taggedUserIds?: string[] }) => {
      socketRef.current?.emit('edit_message', { messageId, ...data });
    },
    [socketRef],
  );

  const softDeleteMessage = useCallback(
    (messageId: string) => {
      socketRef.current?.emit('delete_message', { messageId });
    },
    [socketRef],
  );

  return {
    messages: allMessages,
    isLoading: query.isLoading,
    isError: query.isError,
    hasMore: !!query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: query.fetchNextPage,
    refetch: query.refetch,
    typingUsers,
    sendTextMessage,
    emitTypingStart,
    emitTypingStop,
    editMessage,
    softDeleteMessage,
  };
}
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useSocket } from './SocketProvider';
import { useAuth } from '@/features/auth/AuthProvider';
import { api } from '@/lib/api';

type UnreadContextType = {
  unreadMap: Record<string, number>;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
  totalUnread: number;
};

const UnreadContext = createContext<UnreadContextType | undefined>(undefined);

export const useUnreadCount = () => {
  const ctx = useContext(UnreadContext);
  if (!ctx) throw new Error('useUnreadCount must be used within UnreadCountProvider');
  return ctx;
};


export function UnreadCountProvider({ children }: { children: ReactNode }) {
  const { socketRef, isConnected } = useSocket();
  const { user } = useAuth();
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  const incrementUnread = useCallback((conversationId: string) => {
    setUnreadMap((p) => ({ ...p, [conversationId]: (p[conversationId] ?? 0) + 1 }));
  }, []);

  const clearUnread = useCallback((conversationId: string) => {
    setUnreadMap((p) => {
      const n = { ...p };
      delete n[conversationId];
      return n;
    });
  }, []);

  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);

  // Fetch initial unread map
  useEffect(() => {
    if (!user?.id) return;
    api.get<{ unreadMap: Record<string, number> }>('/chat/unread')
      .then((r) => setUnreadMap(r.data.unreadMap ?? {}))
      .catch(() => {});
  }, [user?.id]);

  // Socket listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected) return;

    const onNew = (msg: { conversationId: string; senderId: string }) => {
      if (msg.senderId !== user?.id) incrementUnread(msg.conversationId);
    };
    const onRead = ({ userId, conversationId }: { userId: string; conversationId: string }) => {
      if (userId === user?.id) clearUnread(conversationId);
    };
    const onRemoved = ({ conversationId }: { conversationId: string }) => clearUnread(conversationId);

    socket.on('new_message', onNew);
    socket.on('messages_read', onRead);
    socket.on('removed_from_conversation', onRemoved);
    return () => {
      socket.off('new_message', onNew);
      socket.off('messages_read', onRead);
      socket.off('removed_from_conversation', onRemoved);
    };
  }, [socketRef, isConnected, user?.id, incrementUnread, clearUnread]);

  return (
    <UnreadContext.Provider value={{ unreadMap, incrementUnread, clearUnread, totalUnread }}>
      {children}
    </UnreadContext.Provider>
  );
}
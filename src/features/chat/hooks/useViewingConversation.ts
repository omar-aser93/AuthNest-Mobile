import { useCallback } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSocket } from '@/lib/socket/SocketProvider';

export function useViewingConversation(conversationId: string | null) {
  const { socketRef, isConnected } = useSocket();

  useFocusEffect(
    useCallback(() => {
      const socket = socketRef.current;
      if (!socket || !isConnected || !conversationId) return;

      const set = (id: string | null) =>
        socket.emit('viewing_conversation', { conversationId: id });

      if (AppState.currentState === 'active') set(conversationId);

      const sub = AppState.addEventListener('change', (s) =>
        set(s === 'active' ? conversationId : null)
      );

      return () => { sub.remove(); set(null); };
    }, [conversationId, socketRef, isConnected]),
  );
}
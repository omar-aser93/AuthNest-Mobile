import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './SocketProvider';

/**
 * Wires the socket `new_notification` event to React Query invalidation.
 *
 * Backend emits `new_notification` to `user:${id}` room whenever a notification row is created (via `notificationHelper.js`). 
 * Any notification query under the `['notifications']` key gets invalidated — both the list & the unread-count badge — so they refetch from the server and pick up the new row + new count.
 */
export function useNotificationSocket() {
  const { socketRef, isConnected } = useSocket();
  const qc = useQueryClient();

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected) return;

    const invalidate = () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('new_notification', invalidate);
    return () => {
      socket.off('new_notification', invalidate);
    };
  }, [socketRef, isConnected, qc]);
}
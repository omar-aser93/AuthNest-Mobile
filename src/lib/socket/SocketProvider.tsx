import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '@/features/auth/AuthProvider';
import { getAccessToken, getRefreshToken, saveTokens } from '@/lib/storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL!;
const SOCKET_URL = API_URL.replace(/\/api\/v1\/?$/, '');   // strip the API prefix for socket URL

type IncomingCall = {
  callId: string;
  conversationId: string;
  from: string;
  fromName: string;
  callType: 'audio' | 'video';
} | null;

type SocketContextValue = {
  socketRef: React.MutableRefObject<Socket | null>;
  isConnected: boolean;
  onlineUsers: Set<string>;
  incomingCall: IncomingCall;
  setIncomingCall: (c: IncomingCall) => void;
};

// create the context
const SocketContext = createContext<SocketContextValue | null>(null);


// The provider component
export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [incomingCall, setIncomingCall] = useState<IncomingCall>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    let retries = 0;

    const socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
      auth: (cb) => {
        // Fresh token on every (re)connect. Fall back to refresh if access expired.
        const token = getAccessToken();
        if (token) return cb({ token });
        const rt = getRefreshToken();
        if (!rt) return cb({ token: undefined });
        axios.post(`${API_URL}/auth/refresh-token`, null, { headers: { Authorization: `Bearer ${rt}` } })
          .then(async (r) => {
            await saveTokens(r.data.accessToken, r.data.refreshToken);
            cb({ token: r.data.accessToken });
          })
          .catch(() => cb({ token: undefined }));
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => { retries = 0; setIsConnected(true); });
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('connect_error', async (err) => {
      if (err.message === 'Your account has been suspended') return;
      if (err.message === 'User not found') return;
      if (err.message === 'No access token provided, please login') return;
      if (retries++ >= 3) return;
      await new Promise((r) => setTimeout(r, 1000 * retries));
      if (cancelled) return;
      socket.connect();
    });

    socket.on('online_users', ({ users }: { users: string[] }) => setOnlineUsers(new Set(users)));
    socket.on('user_online', ({ userId }: { userId: string }) => setOnlineUsers((p) => new Set(p).add(userId)));
    socket.on('user_offline', ({ userId }: { userId: string }) => setOnlineUsers((p) => { const n = new Set(p); n.delete(userId); return n; }));

    // Call signaling
    socket.on('incoming_call', (data) => setIncomingCall(data));
    socket.on('call_answered', () => setIncomingCall(null));
    socket.on('call_rejected', () => setIncomingCall(null));
    socket.on('call_ended_all', () => setIncomingCall(null));

    // Auto-join newly-created conversation rooms
    socket.on('join_new_conversation', ({ conversationId }: { conversationId: string }) => {
      socket.emit('join_conversation', { conversationId });
    });
    socket.on('removed_from_conversation', ({ conversationId }: { conversationId: string }) => {
      socket.emit('leave_conversation', { conversationId });
    });

    socket.connect();

    return () => {
      cancelled = true;
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setOnlineUsers(new Set());
      setIncomingCall(null);
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ socketRef, isConnected, onlineUsers, incomingCall, setIncomingCall }}>
      {children}
    </SocketContext.Provider>
  );
}

// The hook
export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside <SocketProvider>');
  return ctx;
}
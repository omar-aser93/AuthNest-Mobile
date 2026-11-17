import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Calls from 'expo-callkit-telecom';
import * as Crypto from 'expo-crypto';
import { useAuth } from '@/features/auth/AuthProvider';
import { useSocket } from '@/lib/socket/SocketProvider';
import { api } from '@/lib/api';
import { CallRoom } from '@/features/chat/components/CallRoom';

type ActiveCall = {
  sessionId: string;        // native (OS) call session id
  callId: string;           // YOUR server Call.id
  token: string;
  url: string;
  callType: 'audio' | 'video';
  requestId: string;        // needed to fulfill the answer
};

export function NativeCallHost() {
  const { user } = useAuth();
  const { socketRef, isConnected, incomingCall, setIncomingCall } = useSocket();
  const [active, setActive] = useState<ActiveCall | null>(null);
  const activeRef = useRef<ActiveCall | null>(null);
  const emittedRef = useRef<Set<string>>(new Set());
  activeRef.current = active;

  // ── 1. Socket fallback: report the call to the OS if FCM didn't already ──────
  // (web → mobile with no FCM token, or the socket beat the push). The module allows ONE
  // session at a time, so a duplicate report is ignored; we also dedupe by serverCallId.
  useEffect(() => {
    if (!incomingCall || !user) return;
    (async () => {
      const existing = await Calls.getActiveCallSession();
      if (!existing) {
        await Calls.reportIncomingCall({
          eventId: Crypto.randomUUID(),
          serverCallId: incomingCall.callId,
          hasVideo: incomingCall.callType === 'video',
          startedAt: new Date().toISOString(),
          caller: { id: incomingCall.from, displayName: incomingCall.fromName },
          metadata: { conversationId: incomingCall.conversationId },
        });
      }
      setIncomingCall(null);   // native UI owns the ring now
    })().catch(() => setIncomingCall(null));
  }, [incomingCall, user]);

  // ── 2. User tapped ANSWER on the system call screen ─────────────────────────
  // Only listen once auth is ready, so the API call has a valid token even on a cold start.
  useEffect(() => {
    if (!user) return;
    const sub = Calls.addCallAnsweredListener(async ({ id, requestId }) => {
      const session = await Calls.getActiveCallSession();
      const ev = session?.incomingCallEvent;
      const conversationId = ev?.metadata?.conversationId as string | undefined;
      if (!ev || !conversationId) { await Calls.failIncomingCallConnected(id, requestId); return; }

      try {
        const { data } = await api.post('/chat/token', { conversationId });
        setActive({
          sessionId: id, callId: ev.serverCallId, token: data.token, url: data.url,
          callType: ev.hasVideo ? 'video' : 'audio', requestId,
        });
        socketRef.current?.emit('call_answer', { callId: ev.serverCallId });   // buffered by socket.io until connected
      } catch {
        socketRef.current?.emit('call_reject', { callId: ev.serverCallId });
        await Calls.failIncomingCallConnected(id, requestId).catch(() => {});
        Alert.alert('Error', 'Could not join the call');
      }
    });
    return () => sub.remove();
  }, [user?.id, socketRef]);

  // ── 3. Call ended by the LOCAL side (decline / hang up from system UI or our button) ──
  useEffect(() => {
    if (!user) return;
    const sub = Calls.addCallEndedListener(({ session }) => {
      const callId = session.incomingCallEvent?.serverCallId;
      if (callId && !emittedRef.current.has(session.id)) {
        emittedRef.current.add(session.id);
        const wasAnswered = activeRef.current?.sessionId === session.id;
        socketRef.current?.emit(wasAnswered ? 'call_leave' : 'call_reject', { callId });
      }
      setActive((a) => (a?.sessionId === session.id ? null : a));
    });
    return () => sub.remove();
  }, [user?.id, socketRef]);

  // ── 4. Call ended by the REMOTE side (callEnded push handled natively, or reportCallEnded) ──
  useEffect(() => {
    if (!user) return;
    const sub = Calls.addReportedCallEndedListener(({ session }) => {
      setActive((a) => (a?.sessionId === session.id ? null : a));
    });
    return () => sub.remove();
  }, [user?.id]);

  // ── 5. Server says the call is over (socket) → close native UI + our room ──
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected) return;
    const onEnded = async ({ callId }: { callId: string }) => {
      const session = await Calls.getActiveCallSession();
      if (!session) return;
      const sid = session.incomingCallEvent?.serverCallId ?? activeRef.current?.callId;
      if (sid === callId) await Calls.reportCallEnded(session.id, 'remoteEnded').catch(() => {});
    };
    socket.on('call_ended_all', onEnded);
    return () => { socket.off('call_ended_all', onEnded); };
  }, [socketRef, isConnected]);

  // ── Active room (after answering) ───────────────────────────────────────────
  if (!active) return null;
  return (
    <CallRoom
      serverUrl={active.url}
      token={active.token}
      callType={active.callType}
      sessionId={active.sessionId}
      onConnected={() => { Calls.fulfillIncomingCallConnected(active.requestId).catch(() => {}); }}
      onLeave={() => { Calls.endCall(active.sessionId).catch(() => {}); }}   // → step 3 emits call_leave
    />
  );
}
import { useState, useEffect } from 'react';
import { View, Pressable, Alert, } from 'react-native';
import { Phone, Video, } from '@/components/ui/icons';
import { AudioSession } from '@livekit/react-native';
import { useSocket } from '@/lib/socket/SocketProvider';
import { api } from '@/lib/api';
import { useCallSound } from '../hooks/useCallSound';
import { CallRoom } from './CallRoom';

type CallType = 'audio' | 'video';

export function CallUI({ conversationId }: { conversationId: string }) {
  const { socketRef, setIncomingCall } = useSocket();
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [callType, setCallType] = useState<CallType>('audio');
  const [callId, setCallId] = useState<string | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);

  useCallSound(isWaiting ? 'calling' : null);

  // Start outgoing call
  const startCall = (type: CallType) => {
    setCallType(type);
    socketRef.current?.emit(
      'call_user',
      { conversationId, callType: type },
      async (ack: { callId?: string; error?: string }) => {
        if (ack?.error) return Alert.alert('Error', ack.error);
        if (!ack?.callId) return;
        try {
          const res = await api.post('/chat/token', { conversationId });
          await AudioSession.startAudioSession();   
          setToken(res.data.token);
          setServerUrl(res.data.url);
          setCallId(ack.callId);
          setIsWaiting(true);
        } catch {
          Alert.alert('Error', 'Could not start call');
          socketRef.current?.emit('call_leave', { callId: ack.callId });
        }
      },
    );
  };

  // Leave active call
  const leaveCall = () => {
    if (callId) socketRef.current?.emit('call_leave', { callId });
    AudioSession.stopAudioSession();
    setToken(null);
    setServerUrl(null);
    setCallId(null);
    setIsWaiting(false);
    setIncomingCall(null);
  };

  // Stop dial tone when call is answered/missed/ended
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const stop = () => setIsWaiting(false);
    socket.on('call_answered', stop);
    socket.on('call_missed', stop);
    socket.on('call_ended_all', stop);
    return () => {
      socket.off('call_answered', stop);
      socket.off('call_missed', stop);
      socket.off('call_ended_all', stop);
    };
  }, [socketRef]);

  // Active call UI
  if (token && serverUrl) {
    return <CallRoom serverUrl={serverUrl} token={token} callType={callType} onLeave={leaveCall} />;
  }

  // Idle: show call buttons
  return (
    <View className="flex-row gap-2">
      <Pressable onPress={() => startCall('audio')} hitSlop={8} className="p-2">
        <Phone size={20} className="text-foreground" />
      </Pressable>
      <Pressable onPress={() => startCall('video')} hitSlop={8} className="p-2">
        <Video size={20} className="text-foreground" />
      </Pressable>
    </View>
  );
}


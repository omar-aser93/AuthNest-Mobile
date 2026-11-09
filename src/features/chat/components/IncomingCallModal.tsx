import { useState } from 'react';
import { Modal, View, Pressable, Text, Alert, FlatList } from 'react-native';
import { Phone, PhoneOff } from '@/components/ui/icons';
import { LiveKitRoom, VideoTrack, useTracks, isTrackReference, AudioSession } from '@livekit/react-native';
import { Track } from 'livekit-client';
import { useSocket } from '@/lib/socket/SocketProvider';
import { api } from '@/lib/api';
import { useCallSound } from '../hooks/useCallSound';
import { CallRoom } from './CallRoom';

export function IncomingCallModal() {
  const { incomingCall, setIncomingCall, socketRef } = useSocket();
  const [activeCall, setActiveCall] = useState<{
    token: string;
    url: string;
    callType: 'audio' | 'video';
    callId: string;
  } | null>(null);

  // Ringtone only while an incoming call is waiting (not while in the active room)
  useCallSound(incomingCall && !activeCall ? 'ringtone' : null);

  if (!incomingCall && !activeCall) return null;

  const accept = async () => {
    if (!incomingCall) return;
    try {
      const res = await api.post('/chat/token', { conversationId: incomingCall.conversationId });
      await AudioSession.startAudioSession();
      socketRef.current?.emit('call_answer', { callId: incomingCall.callId });
      setActiveCall({
        token: res.data.token,
        url: res.data.url,
        callType: incomingCall.callType,
        callId: incomingCall.callId,
      });
      setIncomingCall(null);
    } catch {
      Alert.alert('Error', 'Could not join the call');
      socketRef.current?.emit('call_reject', { callId: incomingCall.callId });
      setIncomingCall(null);
    }
  };

  const reject = () => {
    if (!incomingCall) return;
    socketRef.current?.emit('call_reject', { callId: incomingCall.callId });
    setIncomingCall(null);
  };

  const leaveActive = () => {
    if (activeCall) socketRef.current?.emit('call_leave', { callId: activeCall.callId });
    AudioSession.stopAudioSession();
    setActiveCall(null);
  };

  // ─── Active room (after accepting) ──────────────────────────────────────
  if (activeCall) {
    return <CallRoom serverUrl={activeCall.url} token={activeCall.token} callType={activeCall.callType} onLeave={leaveActive} />;
  }

  // ─── Incoming call UI ───────────────────────────────────────────────────
  return (
    <Modal visible transparent animationType="slide">
      <View className="flex-1 items-center justify-center bg-black/80 p-6">
        <View className="bg-card rounded-2xl p-6 items-center gap-4 w-full max-w-sm">
          <Text className="text-lg font-semibold text-foreground">{incomingCall!.fromName}</Text>
          <Text className="text-sm text-muted-foreground">
            Incoming {incomingCall!.callType} call…
          </Text>
          <View className="flex-row gap-6 mt-4">
            <Pressable onPress={reject} className="bg-destructive rounded-full p-4">
              <PhoneOff size={24} className="text-destructive-foreground" />
            </Pressable>
            <Pressable onPress={accept} className="bg-primary rounded-full p-4">
              <Phone size={24} className="text-primary-foreground" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}


import { useState } from 'react';
import { Modal, View, Pressable } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiveKitRoom, VideoTrack, useTracks, useLocalParticipant, isTrackReference } from '@livekit/react-native';
import { Track, type LocalVideoTrack } from 'livekit-client';
import { Text } from '@/components/ui/text';
import { Mic, MicOff, Video, VideoOff, PhoneOff, SwitchCamera } from '@/components/ui/icons';

type Props = {
  serverUrl: string;
  token: string;
  callType: 'audio' | 'video';
  onLeave: () => void;
};

export function CallRoom({ serverUrl, token, callType, onLeave }: Props) {
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onLeave}
    >
      {/* Modal is a separate window on Android → needs its own insets provider */}
      <SafeAreaProvider>
        <LiveKitRoom
          serverUrl={serverUrl}
          token={token}
          connect
          video={callType === 'video'}
          audio
          onDisconnected={onLeave}
          options={{ adaptiveStream: { pixelDensity: 'screen' } }}
        >
          <RoomView callType={callType} onLeave={onLeave} />
        </LiveKitRoom>
      </SafeAreaProvider>
    </Modal>
  );
}

function RoundBtn({ onPress, active = true, danger, children }: {
  onPress: () => void; active?: boolean; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-14 w-14 items-center justify-center rounded-full ${
        danger ? 'bg-red-500' : active ? 'bg-white/20' : 'bg-white'
      }`}
    >
      {children}
    </Pressable>
  );
}

function RoomView({ callType, onLeave }: { callType: 'audio' | 'video'; onLeave: () => void }) {
  const insets = useSafeAreaInsets();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const tracks = useTracks([Track.Source.Camera]);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');

  const remote = tracks.find((t) => !t.participant.isLocal);
  const local = tracks.find((t) => t.participant.isLocal);

  const flipCamera = async () => {
    const track = localParticipant.getTrackPublication(Track.Source.Camera)?.track as LocalVideoTrack | undefined;
    if (!track) return;
    const next = facing === 'user' ? 'environment' : 'user';
    await track.restartTrack({ facingMode: next });
    setFacing(next);
  };

  return (
    <View className="flex-1 bg-black">
      {/* Remote participant — full screen */}
      {callType === 'video' && remote && isTrackReference(remote) && remote.publication?.isSubscribed ? (
        <VideoTrack trackRef={remote} style={{ flex: 1 }} objectFit="cover" />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-white">
            {callType === 'video' ? 'Waiting for video…' : 'Voice call in progress…'}
          </Text>
        </View>
      )}

      {/* Me — small preview, top right */}
      {callType === 'video' && local && isTrackReference(local) && isCameraEnabled && (
        <View
          className="absolute right-3 overflow-hidden rounded-xl border border-white/30"
          style={{ top: insets.top + 12, width: 110, height: 160 }}
        >
          <VideoTrack trackRef={local} style={{ flex: 1 }} objectFit="cover" mirror={facing === 'user'} zOrder={1} />
        </View>
      )}

      {/* Controls — lifted above the system nav bar */}
      <View
        className="absolute left-0 right-0 flex-row items-center justify-center gap-5"
        style={{ bottom: insets.bottom + 24 }}
      >
        <RoundBtn active={isMicrophoneEnabled} onPress={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}>
          {isMicrophoneEnabled ? <Mic size={24} className="text-white" /> : <MicOff size={24} className="text-black" />}
        </RoundBtn>

        {callType === 'video' && (
          <>
            <RoundBtn active={isCameraEnabled} onPress={() => localParticipant.setCameraEnabled(!isCameraEnabled)}>
              {isCameraEnabled ? <Video size={24} className="text-white" /> : <VideoOff size={24} className="text-black" />}
            </RoundBtn>
            <RoundBtn onPress={flipCamera}>
              <SwitchCamera size={24} className="text-white" />
            </RoundBtn>
          </>
        )}

        <RoundBtn danger onPress={onLeave}>
          <PhoneOff size={26} className="text-white" />
        </RoundBtn>
      </View>
    </View>
  );
}
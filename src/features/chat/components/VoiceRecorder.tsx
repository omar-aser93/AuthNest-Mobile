import { useState } from 'react';
import { Pressable, View, Alert } from 'react-native';
import { Mic, Square } from '@/components/ui/icons';
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import { Text } from '@/components/ui/text';

type Props = {
  onSend: (uri: string) => void;
  disabled?: boolean;
};

export function VoiceRecorder({ onSend, disabled }: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder, 250); // re-render every 250ms for the timer
  const [isStarting, setIsStarting] = useState(false);

  const start = async () => {
    try {
      setIsStarting(true);
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission required', 'Microphone access is required to record voice messages.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      Alert.alert('Error', 'Could not start recording.');
    } finally {
      setIsStarting(false);
    }
  };

  const stop = async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      // Restore playback mode (route audio to speaker instead of earpiece on iOS)
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (uri) onSend(uri);
    } catch {
      // no-op
    }
  };

  const toggle = () => {
    if (disabled || isStarting) return;
    if (state.isRecording) stop();
    else start();
  };

  const seconds = Math.floor((state.durationMillis ?? 0) / 1000);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <Pressable onPress={toggle} disabled={disabled} hitSlop={6}
      className={`p-2 rounded-md active:bg-secondary ${state.isRecording ? 'bg-destructive/10' : ''}`}
    >
      {state.isRecording ? (
        <View className="flex-row items-center gap-1">
          <Square size={14} className="text-destructive" />
          <Text className="text-xs text-destructive">{fmt(seconds)}</Text>
        </View>
      ) : (
        <Mic size={20} className="text-muted-foreground" />
      )}
    </Pressable>
  );
}
import { useEffect } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

const ringtoneSource = require('../../../../assets/sounds/ringtone.mp3');
const callingSource = require('../../../../assets/sounds/calling.mp3');

export function useCallSound(type: 'ringtone' | 'calling' | null) {
  const ringtone = useAudioPlayer(ringtoneSource);
  const calling = useAudioPlayer(callingSource);

  // Configure both players once
  useEffect(() => {
    ringtone.loop = true;
    ringtone.volume = 0.5;
    calling.loop = true;
    calling.volume = 0.5;

    // Ensure ringtone plays even with the silent switch on (iOS)
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, [ringtone, calling]);

  // React to type changes
  useEffect(() => {
    // Stop whatever was playing
    try { ringtone.pause(); } catch {}
    try { calling.pause(); } catch {}

    if (type === 'ringtone') {
      try { ringtone.seekTo(0); ringtone.play(); } catch {}
    } else if (type === 'calling') {
      try { calling.seekTo(0); calling.play(); } catch {}
    }

    // Cleanup on unmount or type change
    return () => {
      try { ringtone.pause(); } catch {}
      try { calling.pause(); } catch {}
    };
  }, [type, ringtone, calling]);
}
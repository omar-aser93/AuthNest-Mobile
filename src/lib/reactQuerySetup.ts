import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';

// Foreground/background → TanStack "focus"
AppState.addEventListener('change', (status) => {
  focusManager.setFocused(status === 'active');
});

// Network connectivity → TanStack "online"
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(state.isConnected !== false);
  });
});
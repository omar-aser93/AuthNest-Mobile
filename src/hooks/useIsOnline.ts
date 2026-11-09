import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

// A custom Hook, used to check if user is online or offline
export function useIsOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false); 
    });
    return () => unsubscribe();
  }, []);

  return online;
}
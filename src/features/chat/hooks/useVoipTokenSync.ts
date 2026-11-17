import { useEffect } from 'react';
import { Platform } from 'react-native';
import { registerVoIPPush, useVoIPPushToken } from 'expo-callkit-telecom';
import { api } from '@/lib/api';

let registered = false;
let lastToken: string | null = null;    // cached so logout can unregister without any native call

export function useVoipTokenSync(userId?: string) {
  const voip = useVoIPPushToken();

  // Ask the module for the token (once per app run)
  useEffect(() => {
    if (Platform.OS !== 'android' || registered) return;
    registered = true;
    registerVoIPPush();
  }, []);

  // Upload whenever we have a user + token (login, cold start, token rotation)
  useEffect(() => {
    if (!userId || !voip) return;
    lastToken = voip.token;
    api.post('/users/voip-token', { token: voip.token, type: voip.type }).catch(() => {});
  }, [userId, voip?.token]);
}

export async function unregisterVoipToken() {
  if (!lastToken) return;
  try { await api.delete('/users/voip-token', { data: { token: lastToken } }); } catch { /* best-effort */ }
  lastToken = null;
}
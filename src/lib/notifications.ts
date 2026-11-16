import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from '@/lib/api';

// Foreground handler — fires when a notification arrives while the app is open.
// Chat pushes already suppress when the user is viewing (server-side), so an arriving chat push means the user is NOT viewing — showing a banner is correct.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Module-level cache — lets logout unregister without re-requesting permission.
let cachedToken: string | null = null;

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[push] Physical device required');
    return null;
  }

  // Android 13+ REQUIRES the channel to exist before asking for permission.
  // Get this order wrong and the permission prompt doesn't appear.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#208AEF',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') {
    console.warn('[push] Permission denied');
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;
  if (!projectId) {
    console.warn('[push] projectId missing from app.json');
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  cachedToken = token;
  return token;
}

// Called on every app start AND on login. Idempotent — the backend upserts.
export async function syncPushToken(): Promise<void> {
  try {
    const token = await registerForPushNotifications();
    if (!token) return;
    await api.post('/users/push-token', { token, platform: Platform.OS });
  } catch (err) {
    console.warn('[push] sync failed:', err);
  }
}

// Called on logout. Uses cached token — never re-prompts.
export async function unregisterPushToken(): Promise<void> {
  if (!cachedToken) return;
  try {
    await api.delete('/users/push-token', { data: { token: cachedToken } });
  } catch { /* best-effort */ } finally {
    cachedToken = null;
  }
}
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@/features/auth/types';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const CACHED_USER_KEY = 'cachedUser';

// variables for In-memory cache (populated once at startup, kept in sync by save/clear)
let accessToken: string | null = null;
let refreshToken: string | null = null;

// Load tokens - Called once at app boot (inside AuthProvider before the splash hides)
export async function loadTokens() {
  accessToken = await SecureStore.getItemAsync(ACCESS_KEY);
  refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
}

// Synchronous reads — no Keychain round-trip per request
export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

// saveTokens: set tokens, updates memory AND SecureStore
export async function saveTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

// Clear tokens and cached user
export async function clearTokens() {
  accessToken = null;
  refreshToken = null;
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await AsyncStorage.removeItem(CACHED_USER_KEY);
}


// ─── Cached user (Stored in AsyncStorage, NOT SecureStore -> small for user large data) ──────────────────
// Purpose: boot offline / through a cold start with the last known profile, then refresh in the background.
export async function saveCachedUser(user: User) {
  try {
    await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
  } catch {
    // Best-effort. A missing cache just means a slower next boot, not a broken one.
  }
}

export async function loadCachedUser(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHED_USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}
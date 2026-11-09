import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './storage';

const baseURL = process.env.EXPO_PUBLIC_API_URL!;

// Typed error so callers can check err.status (401 vs 403 vs no network)
export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// Auth layer registers this so it can react when the session actually dies.
// Without it, clearTokens() runs but Stack.Protected never flips — the user stays "logged in" on a dead session and every request keeps failing.
let onSessionExpired: (() => void) | null = null;
export const setSessionExpiredHandler = (fn: () => void) => {
  onSessionExpired = fn;
};

export const api = axios.create({ baseURL, timeout: 15_000 });     // axios instance

// ─── Request interceptor ─────────────────────────────────────────────────────
// Attaches Bearer token from memory (fast). Skips if the request already set an Authorization header (so the refresh call doesn't get overwritten).
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !config.headers.Authorization) { config.headers.Authorization = `Bearer ${token}`; }
  return config;
});

// ─── Response interceptor — 401 refresh with lock ────────────────────────────
// Refresh lock: if multiple requests 401 at the same time, only ONE refresh fires.
let refreshPromise: Promise<string | null> | null = null;

function refreshSession(): Promise<string | null> {
  refreshPromise ??= (async () => {
    const rt = getRefreshToken();
    if (!rt) return null;

    try {
      // IMPORTANT: plain axios, NOT the `api` instance.
      // Using `api` would run the request interceptor and overwrite the Authorization header with the expired access token → 401 forever.
      const { data } = await axios.post(
        `${baseURL}/auth/refresh-token`, null, { headers: { Authorization: `Bearer ${rt}` }, timeout: 15_000 }
      );
      await saveTokens(data.accessToken, data.refreshToken);
      return data.accessToken as string;
    } catch (e) {
      const status = (e as AxiosError).response?.status;
      // Only clear tokens on a *definite* auth failure.
      // Network errors and 5xx keep the tokens — user may just be offline.
      if (status === 401 || status === 403 || status === 409) {
        await clearTokens();
        onSessionExpired?.();
        return null;
      }
      throw e;
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// Auth endpoints that should NOT trigger a refresh attempt — their 401s are real auth failures, not expired sessions.
// Note: using the broad `.includes('/auth/')` would wrongly skip /auth/resend-verification, which requires a logged-in user.
const NO_REFRESH = ['/auth/login', '/auth/signup', '/auth/refresh-token', '/auth/logout', '/auth/forgot-password', '/auth/verify-otp', '/auth/reset-password', '/auth/oauth'];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ message?: string }>) => {
    const original = error.config as | (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;

    // ─── Banned user — treat as dead session ────────────────────────────
    if (status === 403 && /suspended/i.test(error.response?.data?.message ?? '')) {
      await clearTokens();
      onSessionExpired?.();
    }

    if (status === 401 && original && !original._retried && !NO_REFRESH.some((p) => original.url?.includes(p))) {
      original._retried = true;
      // If another request already refreshed while this one was in flight, Just retry with the new one.
      const sent = original.headers.Authorization;
      const current = getAccessToken();
      if (current && sent !== `Bearer ${current}`) {
        original.headers.Authorization = `Bearer ${current}`;
        return api(original);
      }
      // Otherwise, do the refresh (or await the in-flight one)
      const token = await refreshSession().catch(() => null);      
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);   // retry once with the fresh token
      }
      // refresh failed — fall through and reject
    }

    const message = error.response?.data?.message ??
      (error.response ? 'Something went wrong. Please try again.' : 'No connection. Check your internet.');

    return Promise.reject(new ApiError(message, status));
  }
);
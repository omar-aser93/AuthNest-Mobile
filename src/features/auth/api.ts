import { api } from '@/lib/api';
import { saveTokens, clearTokens, getRefreshToken } from '@/lib/storage';
import type { AuthResponse, User } from './types';
import type { LoginType, RegisterType } from './schemas';

// ─── Login ──────────────────────────────────────────────────────────────────
// Full flow: POST request with credentials → save tokens → fetch the full profile.
// The login response only includes a partial user (id, name, email, role), but screens need the full object (savedPosts, isEmailVerified, ...).
export async function login(credentials: LoginType): Promise<User> {
  const res = await api.post<AuthResponse>('/auth/login', {
    email: credentials.email,
    password: credentials.password,
    remember: true,   // mobile: 30-day session unless logged out (backend enforces via Session.expiresAt)
  });
  // save the tokens using "lib/storage" utility
  await saveTokens(res.data.accessToken, res.data.refreshToken);
  // fetch the full profile, if failed (network blip just after login but tokens already saved), clear the tokens and rethrow (to keep system in sync)
  try {
    return await getMe();
  } catch (e) {
    await clearTokens();
    throw e;
  }
}


// ─── Register ───────────────────────────────────────────────────────────────
// Same pattern: signup returns tokens, then we fetch the full profile.
export async function register(
  data: Omit<RegisterType, 'confirmPassword'>,
): Promise<User> {
  const res = await api.post<AuthResponse>('/auth/signup', {
    name: data.name,
    email: data.email,
    password: data.password,
  });
  // save the tokens using "lib/storage" utility
  await saveTokens(res.data.accessToken, res.data.refreshToken);
  // get the full profile, if failed, clear the tokens and rethrow (to keep system in sync)
  try {
    return await getMe();
  } catch (e) {
    await clearTokens();
    throw e;
  }
}


// ─── Fetch current user ─────────────────────────────────────────────────────
// The request interceptor attaches the Bearer token from memory.
export async function getMe(): Promise<User> {
  const res = await api.get<User>('/users/me');
  return res.data;
}


// ─── Logout ─────────────────────────────────────────────────────────────────
// Tell the backend to delete this session, then wipe local tokens.
// Sends the refresh token as a Bearer header because mobile has no cookies — the backend's /auth/logout controller reads it from Authorization first.
export async function logout(): Promise<void> {
  const rt = getRefreshToken();

  try {
    if (rt) {
      await api.post('/auth/logout', null, { headers: { Authorization: `Bearer ${rt}` } });
    }
  } catch {
    // Swallow — the user expects to be logged out immediately. If the server is unreachable, we still clear locally and clean up on next login.
  }

  await clearTokens();          // it clears the tokens and cached user as well
}


// ─── Google mobile OAuth (ID token) ─────────────────────────────────────────
// The native SDK returns an ID token; the backend verifies it and returns either tokens (signed-in) or a 202 (link-email-sent — existing password account needs to merge).
export type SocialLoginResult =
  | { status: 'signed-in'; user: User }
  | { status: 'link-email-sent'; message: string };

export async function loginWithGoogle(idToken: string): Promise<SocialLoginResult> {
  // API call to the google-mobile endpoint
  const res = await api.post('/auth/oauth/google/mobile', { idToken });

  // 202 = an email/password account exists; the backend emailed a link-account message.
  if (res.status === 202) { return { status: 'link-email-sent', message: res.data.message }; }
  // save the tokens using "lib/storage" utility, then fetch the full profile... if failed, clear the tokens and rethrow (to keep system in sync)
  await saveTokens(res.data.accessToken, res.data.refreshToken);
  try {
    return { status: 'signed-in', user: await getMe() };
  } catch (e) {
    await clearTokens();
    throw e;
  }
}


// ─── GitHub mobile OAuth (code + PKCE verifier) ────────────────────────────
// GitHub requires code_verifier because expo-auth-session sends a code_challenge.
export async function loginWithGitHub(code: string, codeVerifier: string,): Promise<SocialLoginResult> {
  // API call to the github-mobile endpoint
  const res = await api.post('/auth/oauth/github/mobile', { code, codeVerifier });
  if (res.status === 202) return { status: 'link-email-sent', message: res.data.message };
  // save the tokens using "lib/storage" utility, then fetch the full profile... if failed, clear the tokens and rethrow (to keep system in sync)
  await saveTokens(res.data.accessToken, res.data.refreshToken);
  try {
    return { status: 'signed-in', user: await getMe() };
  } catch (e) {
    await clearTokens();
    throw e;
  }
}
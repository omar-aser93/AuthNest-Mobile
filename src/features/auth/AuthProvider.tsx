import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { setSessionExpiredHandler } from '@/lib/api';
import { loadTokens, getAccessToken, getRefreshToken, loadCachedUser, saveCachedUser } from '@/lib/storage';
import { queryClient } from '@/lib/queryClient';
import { googleSignOut } from './google';
import { login as loginApi, register as registerApi,logout as logoutApi, getMe, loginWithGoogle as loginWithGoogleApi, loginWithGitHub as loginWithGitHubApi, type SocialLoginResult } from './api';
import type { User } from './types';
import type { LoginType, RegisterType } from './schemas';

// ─── Context ────────────────────────────────────────────────────────────────
type AuthValue = {
  user: User | null;
  isLoading: boolean;
  signIn: (credentials: LoginType) => Promise<void>;
  signUp: (data: Omit<RegisterType, 'confirmPassword'>) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<SocialLoginResult>;
  signInWithGitHub: (code: string, codeVerifier: string) => Promise<SocialLoginResult>;
  updateUser: (user: User) => Promise<void>;
};

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Session-expired handler FIRST — must run before boot so a 401 on cold start flips to guest instead of leaving a broken state.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      queryClient.clear();
    });
  }, []);

  // Boot: restore session from SecureStore
  useEffect(() => {
    (async () => {
      try {
        await loadTokens();
        if (!getAccessToken() && !getRefreshToken()) {
          setIsLoading(false);
          return;
        }

        const cached = await loadCachedUser();
        if (cached) {
          setUser(cached);
          setIsLoading(false);
          getMe().then((me) => { setUser(me); saveCachedUser(me); }).catch(() => {});
          return;
        }

        try {
          const me = await getMe();
          setUser(me);
          saveCachedUser(me);
        } catch {
          // Offline with no cache — show as guest, keep tokens for next launch
        } finally {
          setIsLoading(false);
        }
      } catch {
        setUser(null);
        setIsLoading(false);
      }
    })();
  }, []);

  // ─── Actions ─────────────────────────────────────────────────────────────
  const signIn = useCallback(async (credentials: LoginType) => {
    const me = await loginApi(credentials);
    setUser(me);
    saveCachedUser(me);
    queryClient.invalidateQueries();
  }, []);

  const signUp = useCallback(async (data: Omit<RegisterType, 'confirmPassword'>) => {
    const me = await registerApi(data);
    setUser(me);
    saveCachedUser(me);
    queryClient.invalidateQueries();
  }, []);

  const signOut = useCallback(async () => {
    await logoutApi();         // server best-effort + clearTokens
    await googleSignOut();     // native Google session cleanup (no-op in Expo Go)
    setUser(null);
    queryClient.clear();
  }, []);

  const signInWithGoogle = useCallback(async (idToken: string) => {
    const result = await loginWithGoogleApi(idToken);
    if (result.status === 'signed-in') {
      setUser(result.user);
      saveCachedUser(result.user);
      queryClient.invalidateQueries();
    }
    return result;
  }, []);

  const signInWithGitHub = useCallback(async (code: string, codeVerifier: string) => {
    const result = await loginWithGitHubApi(code, codeVerifier);
    if (result.status === 'signed-in') {
      setUser(result.user);
      saveCachedUser(result.user);
      queryClient.invalidateQueries();
    }
    return result;
  }, []);

  const updateUser = useCallback(async (freshUser: User) => {
    setUser(freshUser);
    await saveCachedUser(freshUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, signInWithGoogle, signInWithGitHub, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
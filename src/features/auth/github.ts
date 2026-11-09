import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export type GitHubAuth = { code: string; codeVerifier: string };

// Returns null if the user cancelled. Throws on error.
export async function getGitHubAuth(): Promise<GitHubAuth | null> {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'authnest', path: 'oauth/github' });

  const discovery = {
    authorizationEndpoint: 'https://github.com/login/oauth/authorize',
    tokenEndpoint: 'https://github.com/login/oauth/access_token',
  };

  const request = new AuthSession.AuthRequest({
    clientId: process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID!,
    scopes: ['read:user', 'user:email'],
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    // usePKCE defaults to true. Do NOT disable — GitHub requires code_verifier
    // if a code_challenge was sent, and PKCE protects custom-scheme redirects from being hijacked by another app on Android.
  });

  const result = await request.promptAsync(discovery);

  if (result.type === 'error') {
    throw new Error(result.error?.message ?? 'GitHub sign-in failed');
  }
  if (result.type !== 'success') return null; // cancelled / dismissed

  const code = result.params.code;
  if (!code) throw new Error('GitHub did not return a code');
  if (!request.codeVerifier) throw new Error('GitHub did not return a PKCE verifier');

  return { code, codeVerifier: request.codeVerifier };
}
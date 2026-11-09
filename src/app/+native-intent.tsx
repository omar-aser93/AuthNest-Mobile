// Intercepts OS-initiated deep links before Expo Router tries to resolve them.
// Return `null` to prevent navigation — lets `WebBrowser.maybeCompleteAuthSession` (from expo-web-browser) handle the URL instead.

export function redirectSystemPath({ path }: { path: string; initial: boolean; }): string | null {
  try {
    // OAuth callbacks: expo-auth-session handles these via Linking.
    // Blocking navigation here lets the auth-session helper pick them up.
    if (
      path.startsWith('oauth/') ||
      path.startsWith('authnest://oauth/') ||
      path.includes('/oauth/github') ||
      path.includes('/oauth/google')
    ) {
      return null;
    }
    return path;
  } catch {
    return '/';
  }
}
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '../AuthProvider';
import { getGoogleIdToken } from '../google';
import { getGitHubAuth } from '../github';

type BusyProvider = 'google' | 'github' | null;

export function SocialButtons() {
  const { signInWithGoogle, signInWithGitHub } = useAuth();
  const [busy, setBusy] = useState<BusyProvider>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const onGoogle = async () => {
    setError(null);
    setNotice(null);
    setBusy('google');
    try {
      const idToken = await getGoogleIdToken();
      if (!idToken) return;                       // cancelled
      const result = await signInWithGoogle(idToken);
      if (result.status === 'link-email-sent') {
        setNotice(`${result.message} Open the link, then tap Google again.`);
      }
      // 'signed-in' → (auth) unmounts via Stack.Protected
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setBusy(null);
    }
  };

  const onGitHub = async () => {
    setError(null);
    setNotice(null);
    setBusy('github');
    try {
      const auth = await getGitHubAuth();
      if (!auth) return;                          // cancelled
      const result = await signInWithGitHub(auth.code, auth.codeVerifier);
      if (result.status === 'link-email-sent') {
        setNotice(`${result.message} Open the link, then tap GitHub again.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GitHub sign-in failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View className="gap-3">
      <Button variant="outline" onPress={onGoogle} disabled={busy !== null}>
        <Text>{busy === 'google' ? 'Connecting…' : 'Continue with Google'}</Text>
      </Button>
      <Button variant="outline" onPress={onGitHub} disabled={busy !== null}>
        <Text>{busy === 'github' ? 'Connecting…' : 'Continue with GitHub'}</Text>
      </Button>

      {notice && (
        <Text className="text-center text-sm text-muted-foreground">{notice}</Text>
      )}
      {error && (
        <Text className="text-center text-sm text-destructive">{error}</Text>
      )}
    </View>
  );
}
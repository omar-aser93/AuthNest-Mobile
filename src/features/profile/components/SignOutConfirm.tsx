import { Alert } from 'react-native';
import { useAuth } from '@/features/auth/AuthProvider';

// Component to display the sign out Alert
export function useSignOutConfirm() {
  const { signOut } = useAuth();

  return () =>
    Alert.alert(
      'Sign out?',
      "You'll need to sign in again to access your account.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
      ],
    );
}
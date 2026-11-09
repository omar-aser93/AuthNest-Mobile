import { useAuth } from '@/features/auth/AuthProvider';
import { SignInPrompt } from '@/components/layout/SignInPrompt';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';

export default function ProfileRoute() {
  const { user } = useAuth();
  if (!user) return <SignInPrompt message="Sign in to see your profile" />;
  return <ProfileScreen />;
}
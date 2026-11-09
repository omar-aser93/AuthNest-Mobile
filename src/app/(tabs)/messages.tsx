import { useAuth } from '@/features/auth/AuthProvider';
import { SignInPrompt } from '@/components/layout/SignInPrompt';
import { MessagesScreen } from '@/features/chat/screens/MessagesScreen';

export default function MessagesRoute() {
  const { user } = useAuth();
  if (!user) return <SignInPrompt message="Sign in to see your messages" />;
  return <MessagesScreen />;
}
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ReactionButton } from '@/features/reactions/components/ReactionButton';
import { useAuth } from '@/features/auth/AuthProvider';
import type { ReactionType } from '@/features/reactions/types';
import { useReactToMessage } from '../api';

export function MessageReactionButton({ messageId, conversationId, initialReaction, initialCount, initialSummary }: {
  messageId: string;
  conversationId: string;
  initialReaction?: ReactionType | null;
  initialCount: number;
  initialSummary?: Partial<Record<ReactionType, number>>;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const react = useReactToMessage();

  const onReact = async (type: ReactionType | null) => {
    if (!user) {
      Alert.alert('Sign in to react', 'Create an account or sign in to react.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push('/login') },
      ]);
      throw new Error('Not signed in');
    }
    await react.mutateAsync({ messageId, conversationId, type });
  };

  return (
    <ReactionButton initialReaction={initialReaction} initialCount={initialCount} initialSummary={initialSummary} onReact={onReact} />
  );
}
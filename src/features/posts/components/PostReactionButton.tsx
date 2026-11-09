import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ReactionButton } from '@/features/reactions/components/ReactionButton';
import type { ReactionType } from '@/features/reactions/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { useReactToPost } from '../api';

export function PostReactionButton({ postId, initialReaction, initialCount }: {
  postId: string;
  initialReaction?: ReactionType | null;
  initialCount: number;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const react = useReactToPost();

  const onReact = async (type: ReactionType | null) => {
    if (!user) {
      Alert.alert('Sign in to react', 'Create an account or sign in to react to posts.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push('/login') },
      ]);
      // Throwing triggers the rollback inside ReactionButton — the count returns to what it was before the tap.
      throw new Error('Not signed in');
    }
    await react.mutateAsync({ postId, type });
  };

  return (
    <ReactionButton initialReaction={initialReaction} initialCount={initialCount} onReact={onReact} />
  );
}
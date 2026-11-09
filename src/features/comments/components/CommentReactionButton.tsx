import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ReactionButton } from '@/features/reactions/components/ReactionButton';
import type { ReactionType } from '@/features/reactions/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { useReactToComment } from '../api';

export function CommentReactionButton({ commentId, postId, parentId, initialReaction, initialCount }: {
  commentId: string;
  postId: string;
  parentId?: string | null;
  initialReaction?: ReactionType | null;
  initialCount: number;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const react = useReactToComment();

  const onReact = async (type: ReactionType | null) => {
    if (!user) {
      Alert.alert('Sign in to react', 'Create an account or sign in to react to comments.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push('/login') },
      ]);
      throw new Error('Not signed in');
    }
    await react.mutateAsync({ commentId, postId, parentId, type });
  };

  return (
    <ReactionButton initialReaction={initialReaction} initialCount={initialCount} onReact={onReact} />
  );
}
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageCircle, Share2, Check } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthProvider';
import type { Post } from '../types';
import { PostReactionButton } from './PostReactionButton';
import { SaveButton } from './SaveButton';
import { ShareModal } from './ShareModal';
import { useUnsharePost } from '../api';

export function PostFooter({ post, isSaved }: { post: Post; isSaved: boolean }) {
  const router = useRouter();
  const { user } = useAuth();
  const unsharePost = useUnsharePost();
  const [modalOpen, setModalOpen] = useState(false);

  const isOwnPost = post.author.id === user?.id;
  const alreadyShared = post.hasShared ?? false;

  const onComment = () => router.push({ pathname: '/posts/[id]', params: { id: post.id } });

  const onShare = () => {
    if (!user) {
      Alert.alert('Sign in to share', 'Create an account or sign in to share posts.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push('/login') },
      ]);
      return;
    }
    if (isOwnPost) {
      Alert.alert('Cannot share', 'You cannot share your own post.');
      return;
    }
    if (alreadyShared) {
      Alert.alert(
        'Unshare this post?',
        'This will remove your share from your feed and decrease the share count.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unshare', style: 'destructive',
            onPress: () =>
              unsharePost.mutate(post.id, { onError: (err) => Alert.alert('Error', err instanceof ApiError ? err.message : 'Unshare failed') }),
          },
        ],
      );
      return;
    }
    setModalOpen(true);
  };

  return (
    <>
      <View className="flex-row items-center justify-between border-t border-border pt-2 mt-3">
        <PostReactionButton postId={post.id} initialReaction={post.myReaction ?? null} initialCount={post.reactionCount} />

        <Pressable onPress={onComment} className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-md active:bg-secondary">
          <MessageCircle size={18} className="text-muted-foreground" />
          <Text className="text-sm text-muted-foreground">{post.commentCount}</Text>
        </Pressable>

        <Pressable onPress={onShare} className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-md active:bg-secondary ${ alreadyShared ? 'bg-green-50 dark:bg-green-900/20' : '' }`} >
          {alreadyShared ? <Check size={18} className="text-green-600" /> : <Share2 size={18} className="text-muted-foreground" />}
          <Text className={`text-sm ${alreadyShared ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
            {post.shareCount}
          </Text>
        </Pressable>

        <SaveButton postId={post.id} isSaved={isSaved} />
      </View>

      <ShareModal post={post} visible={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
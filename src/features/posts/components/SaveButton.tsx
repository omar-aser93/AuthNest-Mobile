import { useState, useEffect } from 'react';    
import { Pressable, Alert } from 'react-native';
import { Bookmark } from '@/components/ui/icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/AuthProvider';
import { ApiError } from '@/lib/api';
import { useToggleSavePost } from '../api';

export function SaveButton({ postId, isSaved }: { postId: string; isSaved: boolean }) {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(isSaved);
  const toggle = useToggleSavePost();

  // Sync when the parent's derived `isSaved` changes (auth user's savedPosts updated elsewhere, or a refetch brought fresh state).
  useEffect(() => { setSaved(isSaved); }, [isSaved]);

  const onPress = () => {
    if (!user) {
      Alert.alert('Sign in to save posts', 'Create an account or sign in to save posts for later.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push('/login') },
      ]);
      return;
    }
    const prev = saved;
    setSaved(!prev);
    toggle.mutate(postId, {
      onError: (err) => {
        setSaved(prev);
        Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to save post');
      },
    });
  };

  return (
    <Pressable onPress={onPress} className="p-2 rounded-md active:bg-secondary">
      <Bookmark size={20} color={saved ? '#3b82f6' : '#737373'} fill={saved ? '#3b82f6' : 'none'} />
    </Pressable>
  );
}
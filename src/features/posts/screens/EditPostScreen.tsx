import { View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { postDetailQueryOptions } from '../api';
import { PostForm } from '../components/PostForm';

export function EditPostScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: post, isLoading, isError, refetch } = useQuery(postDetailQueryOptions(id));

  if (isLoading) {
    return (
      <Screen edges={['bottom']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </Screen>
    );
  }

  if (isError || !post) {
    return (
      <Screen edges={['bottom']}>
        <View className="flex-1 items-center justify-center gap-3 p-6">
          <Text className="text-lg font-semibold text-foreground">Couldn't load post</Text>
          <Button onPress={() => refetch()} className="mt-2">
            <Text>Retry</Text>
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <PostForm post={post} onSuccess={() => router.back()} />
    </Screen>
  );
}
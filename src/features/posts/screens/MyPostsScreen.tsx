import { ActivityIndicator, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { myPostsInfiniteQueryOptions } from '../api';
import { PostFeedList } from '../components/PostFeedList';

export function MyPostsScreen() {
  const router = useRouter();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } = useInfiniteQuery(myPostsInfiniteQueryOptions());

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  if (isLoading) {
    return (
      <Screen edges={['bottom']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  // Custom empty state with a CTA — the default PostFeedList empty state doesn't have a button, and this is the one screen where it's needed.
  if (posts.length === 0 && !isRefetching) {
    return (
      <Screen edges={['bottom']}>
        <View className="flex-1 items-center justify-center gap-4 p-6">
          <Text className="text-lg font-semibold text-foreground">No posts yet</Text>
          <Text className="text-sm text-muted-foreground text-center max-w-xs">
            Your posts will appear here once you start creating them.
          </Text>
          <Button onPress={() => router.push('/create-post')}>
            <Text>Create your first post</Text>
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable={false} edges={['bottom']}>
      <PostFeedList
        posts={posts}  
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={!!hasNextPage}
        fetchNextPage={fetchNextPage}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        emptyTitle="No posts yet"
      />
    </Screen>
  );
}
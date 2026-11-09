import { View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Text } from '@/components/ui/text';
import { PostFeedList } from '@/features/posts/components/PostFeedList';
import { searchPostsInfiniteQueryOptions } from '../api';

export function PostsTab({ query }: { query: string }) {
  const q = useInfiniteQuery(searchPostsInfiniteQueryOptions(query));
  const posts = q.data?.pages.flatMap((p) => p.posts) ?? [];

  if (q.isError) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-base font-semibold text-foreground">
          Couldn't load posts
        </Text>
        <Text className="text-sm text-muted-foreground text-center mt-1">
          Pull down to try again.
        </Text>
      </View>
    );
  }

  return (
    <PostFeedList
      posts={posts}
      isLoading={q.isLoading}
      isFetchingNextPage={q.isFetchingNextPage}
      hasNextPage={!!q.hasNextPage}
      fetchNextPage={q.fetchNextPage}
      onRefresh={() => q.refetch()}
      isRefreshing={q.isRefetching && !q.isFetchingNextPage}
      emptyTitle="No posts found"
      emptyMessage={`No posts match "${query}".`}
    />
  );
}
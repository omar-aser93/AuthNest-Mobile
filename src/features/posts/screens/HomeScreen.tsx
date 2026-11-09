import { useInfiniteQuery } from '@tanstack/react-query';
import { Screen } from '@/components/layout/Screen';
import { feedInfiniteQueryOptions } from '../api';
import { PostFeedList } from '../components/PostFeedList';

export function HomeScreen() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } = useInfiniteQuery(feedInfiniteQueryOptions());

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  return (
    <Screen scrollable={false} edges={[]}>
      <PostFeedList
        posts={posts}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={!!hasNextPage}
        fetchNextPage={fetchNextPage}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        emptyTitle="No posts yet"
        emptyMessage="Check back later or follow some people to fill your feed."
      />
    </Screen>
  );
}
import { useInfiniteQuery } from '@tanstack/react-query';
import { Screen } from '@/components/layout/Screen';
import { savedPostsInfiniteQueryOptions } from '../api';
import { PostFeedList } from '../components/PostFeedList';

export function SavedPostsScreen() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } = useInfiniteQuery(savedPostsInfiniteQueryOptions());

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  return (
    <Screen scrollable={false} edges={['bottom']}>
      <PostFeedList
        posts={posts}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={!!hasNextPage}
        fetchNextPage={fetchNextPage}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        emptyTitle="No saved posts"
        emptyMessage="Tap the bookmark icon on any post to save it for later."
        showSavedAt
      />
    </Screen>
  );
}
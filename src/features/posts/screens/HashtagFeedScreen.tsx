import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { hashtagInfiniteQueryOptions } from '../api';
import { PostFeedList } from '../components/PostFeedList';

export function HashtagFeedScreen() {
  const { tag } = useLocalSearchParams<{ tag: string }>();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } = useInfiniteQuery(hashtagInfiniteQueryOptions(tag));

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
        emptyTitle={`No posts with #${tag}`}
        emptyMessage="Be the first to post with this hashtag."
      />
    </Screen>
  );
}
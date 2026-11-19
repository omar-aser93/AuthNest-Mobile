import { View, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { PostCard } from './PostCard';
import { PostCardSkeleton, PostFeedSkeleton } from './PostCardSkeleton';
import type { Post } from '../types';

type Props = {
  posts: Post[];
  isLoading?: boolean; 
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  emptyTitle: string;
  emptyMessage?: string;
  showSavedAt?: boolean;
  header?: React.ReactElement;
};

// Any Posts List component with infinite scroll
export function PostFeedList({ posts, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, onRefresh, isRefreshing, emptyTitle, emptyMessage, showSavedAt, header }: Props) {
  
  const showSkeleton = !!isLoading && posts.length === 0;  // Show skeleton while initial data is fetching

  return (
    <FlatList
      data={posts}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => (
        <View className="px-3 mb-3">
          <PostCard post={item} showSavedAt={showSavedAt} />
        </View>
      )}
      ListHeaderComponent={header}
      contentContainerClassName={posts.length === 0 && !header && !showSkeleton ? 'grow justify-center items-center p-6' : 'pt-3 pb-3'}
      onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
      onEndReachedThreshold={0.5}
      scrollEnabled={!showSkeleton}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        showSkeleton ? (
          <PostFeedSkeleton />
        ) : (
          <View className="items-center gap-2">
            <Text className="text-lg font-semibold text-foreground">{emptyTitle}</Text>
            {emptyMessage && <Text className="text-sm text-muted-foreground text-center max-w-xs">{emptyMessage}</Text>}
          </View>
        )
      }
      // Next page: one skeleton card instead of a spinner
      ListFooterComponent={isFetchingNextPage ? <View className="px-3"><PostCardSkeleton /></View> : null}
    />
  );
}

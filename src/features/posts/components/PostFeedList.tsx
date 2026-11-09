import { View, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { PostCard } from './PostCard';
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

export function PostFeedList({ posts, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, onRefresh, isRefreshing, emptyTitle, emptyMessage, showSavedAt, header }: Props) {
  
  // ─── Show loader while initial data is fetching ─────────────────────
  if (isLoading && !header) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }
  
  return (
    <FlatList data={posts} keyExtractor={(p) => p.id}
      renderItem={({ item }) => (
        <View className="px-3 mb-3">
          <PostCard post={item} showSavedAt={showSavedAt} />
        </View>
      )}
      ListHeaderComponent={header}      
      contentContainerClassName={ posts.length === 0 && !header ? 'grow justify-center items-center p-6' : 'pt-3 pb-3' }
      onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        isLoading ? (<View className="py-12 items-center"><ActivityIndicator /></View>) : (
          <View className="items-center gap-2">
            <Text className="text-lg font-semibold text-foreground">{emptyTitle}</Text>
            {emptyMessage && (
              <Text className="text-sm text-muted-foreground text-center max-w-xs"> {emptyMessage} </Text>
            )}
          </View>
        )
      }
      ListFooterComponent={
        isFetchingNextPage ? (<View className="items-center py-4"><ActivityIndicator /></View>) : null
      }
    />
  );
}
import { FlatList, ActivityIndicator, RefreshControl, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Hash } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { searchHashtagsInfiniteQueryOptions } from '../api';

export function HashtagsTab({ query }: { query: string }) {
  const router = useRouter();
  const q = useInfiniteQuery(searchHashtagsInfiniteQueryOptions(query));
  const hashtags = q.data?.pages.flatMap((p) => p.hashtags) ?? [];

  if (q.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (q.isError) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-base font-semibold text-foreground">
          Couldn't load hashtags
        </Text>
        <Text className="text-sm text-muted-foreground text-center mt-1">
          Pull down to try again.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={hashtags}
      keyExtractor={(h) => h.hashtag}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push({ pathname: '/hashtags/[tag]', params: { tag: item.hashtag } }) }
          className="flex-row items-center justify-between px-4 py-3 border-b border-border/50 active:bg-secondary"
        >
          <View className="flex-row items-center gap-2">
            <Hash size={16} className="text-primary" />
            <Text className="text-sm font-medium text-foreground">{item.hashtag}</Text>
          </View>
          <Text className="text-xs text-muted-foreground">
            {item.count} {item.count === 1 ? 'post' : 'posts'}
          </Text>
        </Pressable>
      )}
      contentContainerClassName={hashtags.length === 0 ? 'grow justify-center p-6' : undefined}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={q.isRefetching && !q.isFetchingNextPage} onRefresh={() => q.refetch()} />
      }
      onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        <View className="items-center gap-1">
          <Text className="text-base font-semibold text-foreground">No hashtags found</Text>
          <Text className="text-sm text-muted-foreground text-center">
            No hashtags match "{query}".
          </Text>
        </View>
      }
      ListFooterComponent={
        q.isFetchingNextPage ? (
          <View className="py-4 items-center"><ActivityIndicator size="small" /></View>
        ) : null
      }
    />
  );
}
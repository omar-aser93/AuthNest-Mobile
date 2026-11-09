import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Text } from '@/components/ui/text';
import { notificationsInfiniteQueryOptions } from '../api';
import { NotificationRow } from './NotificationRow';

export function NotificationList() {
  const query = useInfiniteQuery(notificationsInfiniteQueryOptions());
  const notifications = query.data?.pages.flatMap((p) => p.notifications) ?? [];

  if (query.isLoading) {
    return (
      <View className="py-8 items-center"><ActivityIndicator /></View>
    );
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={(n) => n.id}
      renderItem={({ item }) => <NotificationRow notification={item} />}
      contentContainerClassName={notifications.length === 0 ? 'grow justify-center' : undefined}
      refreshControl={
        <RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => query.refetch()} />
      }
      onEndReached={() =>
        query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()
      }
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        <View className="items-center py-16 px-6 gap-1">
          <Text className="text-base font-semibold text-foreground">No notifications yet</Text>
          <Text className="text-sm text-muted-foreground text-center">
            When someone reacts, comments, or mentions you, it'll show up here.
          </Text>
        </View>
      }
      ListFooterComponent={
        query.isFetchingNextPage ? (
          <View className="py-4 items-center"><ActivityIndicator size="small" /></View>
        ) : null
      }
    />
  );
}
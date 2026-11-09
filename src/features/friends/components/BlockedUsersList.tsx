import { ActivityIndicator, FlatList, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Text } from '@/components/ui/text';
import { blockedUsersInfiniteQueryOptions } from '../api';
import { UserCard } from './UserCard';

export function BlockedUsersList() {
  const query = useInfiniteQuery(blockedUsersInfiniteQueryOptions());
  const users = query.data?.pages.flatMap((p) => p.users) ?? [];

  if (query.isLoading) { return <View className="py-8 items-center"><ActivityIndicator /></View>; }

  return (
    <FlatList
      data={users}
      keyExtractor={(u) => u.id}
      renderItem={({ item }) => (
        <UserCard user={item} initialStatus={{ status: 'BLOCKED', friendshipId: item.friendshipId }} />
      )}
      onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        <View className="py-12 px-6 items-center gap-1">
          <Text className="text-base font-semibold text-foreground">No blocked users</Text>
          <Text className="text-sm text-muted-foreground text-center">
            Users you block will appear here.
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
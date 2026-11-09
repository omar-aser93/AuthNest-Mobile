import { ActivityIndicator, FlatList, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Text } from '@/components/ui/text';
import { friendsInfiniteQueryOptions } from '../api';
import { UserCard } from './UserCard';

export function FriendsList() {
  const query = useInfiniteQuery(friendsInfiniteQueryOptions(''));

  const friends = query.data?.pages.flatMap((p) => p.friends) ?? [];

  if (query.isLoading) { return <View className="py-8 items-center"><ActivityIndicator /></View>; }

  return (
    <FlatList data={friends}  keyExtractor={(f) => f.id}
      renderItem={({ item }) => (
        <UserCard user={item}
          initialStatus={item.friendshipId ? { status: 'ACCEPTED', friendshipId: item.friendshipId } : undefined}
        />
      )}
      onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        <View className="py-12 px-6 items-center gap-1">
          <Text className="text-base font-semibold text-foreground">No friends yet</Text>
          <Text className="text-sm text-muted-foreground text-center">
            Check the Suggestions tab to find people to add.
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
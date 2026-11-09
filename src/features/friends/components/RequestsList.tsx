import { ActivityIndicator, FlatList, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Text } from '@/components/ui/text';
import { requestsInfiniteQueryOptions } from '../api';
import { UserCard } from './UserCard';

type Props = {
  type: 'received' | 'sent';
};

export function RequestsList({ type }: Props) {
  const query = useInfiniteQuery(requestsInfiniteQueryOptions(type));
  const requests = query.data?.pages.flatMap((p) => p.requests) ?? [];

  if (query.isLoading) { return <View className="py-8 items-center"><ActivityIndicator /></View>; }

  return (
    <FlatList
      data={requests}
      keyExtractor={(r) => r.id}
      renderItem={({ item }) => {
        const user = type === 'received' ? item.requester : item.receiver;
        return (
          <UserCard user={user} initialStatus={{ status: 'PENDING', friendshipId: item.id, direction: type }} />
        );
      }}
      onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        <View className="py-12 px-6 items-center gap-1">
          <Text className="text-base font-semibold text-foreground">
            {type === 'received' ? 'No requests' : 'No sent requests'}
          </Text>
          <Text className="text-sm text-muted-foreground text-center">
            {type === 'received'
              ? "You don't have any pending friend requests."
              : "You haven't sent any friend requests."}
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
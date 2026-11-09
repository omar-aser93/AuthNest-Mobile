import { FlatList, ActivityIndicator, RefreshControl, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Text } from '@/components/ui/text';
import { UserCard } from '@/features/friends/components/UserCard';
import { searchUsersInfiniteQueryOptions } from '../api';

export function PeopleTab({ query }: { query: string }) {
  const q = useInfiniteQuery(searchUsersInfiniteQueryOptions(query));
  const users = q.data?.pages.flatMap((p) => p.users) ?? [];

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
          Couldn't load people
        </Text>
        <Text className="text-sm text-muted-foreground text-center mt-1">
          Pull down to try again.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(u) => u.id}
      renderItem={({ item }) => <UserCard user={item} />}
      contentContainerClassName={users.length === 0 ? 'grow justify-center p-6' : undefined}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={q.isRefetching && !q.isFetchingNextPage} onRefresh={() => q.refetch()} />
      }
      onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        <View className="items-center gap-1">
          <Text className="text-base font-semibold text-foreground">No people found</Text>
          <Text className="text-sm text-muted-foreground text-center">
            No users match "{query}".
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
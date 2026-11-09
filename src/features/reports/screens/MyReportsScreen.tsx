import { View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/text';
import { myReportsInfiniteQueryOptions } from '../api';
import { ReportRow } from '../components/ReportRow';

export function MyReportsScreen() {
  const query = useInfiniteQuery(myReportsInfiniteQueryOptions());
  const reports = query.data?.pages.flatMap((p) => p.reports) ?? [];

  if (query.isLoading) {
    return (
      <Screen edges={['bottom']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen edges={['bottom']}>
        <View className="flex-1 items-center justify-center gap-2 p-6">
          <Text className="text-base font-semibold text-foreground">
            Couldn't load your reports
          </Text>
          <Text className="text-sm text-muted-foreground text-center">
            Pull down to try again.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable={false} edges={['bottom']}>
      <FlatList
        data={reports}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => <ReportRow report={item} />}
        contentContainerClassName={reports.length === 0 ? 'grow justify-center p-6' : 'pb-3'}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => query.refetch()}
          />
        }
        onEndReached={() =>  query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage() }
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View className="items-center gap-1">
            <Text className="text-base font-semibold text-foreground">
              You haven't reported anything yet
            </Text>
            <Text className="text-sm text-muted-foreground text-center">
              Reports you submit will show up here so you can track their status.
            </Text>
          </View>
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" />
            </View>
          ) : null
        }
      />
    </Screen>
  );
}
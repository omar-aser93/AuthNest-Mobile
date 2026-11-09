import { ActivityIndicator, FlatList, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Text } from '@/components/ui/text';
import { suggestionsQueryOptions } from '../api';
import { UserCard } from './UserCard';

export function SuggestionsList() {
  const query = useQuery(suggestionsQueryOptions());

  if (query.isLoading) { return <View className="py-8 items-center"><ActivityIndicator /></View>; }

  const suggestions = query.data?.suggestions ?? [];

  return (
    <FlatList
      data={suggestions}
      keyExtractor={(s) => s.id}
      renderItem={({ item }) => (
        <UserCard user={item} mutualCount={item.mutualFriendsCount} initialStatus={{ status: null }} />
      )}
      ListEmptyComponent={
        <View className="py-12 px-6 items-center gap-1">
          <Text className="text-base font-semibold text-foreground">No suggestions</Text>
          <Text className="text-sm text-muted-foreground text-center">
            We couldn't find anyone to suggest right now.
          </Text>
        </View>
      }
    />
  );
}
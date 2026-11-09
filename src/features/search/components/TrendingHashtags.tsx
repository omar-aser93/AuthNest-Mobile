import { FlatList, ActivityIndicator, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Hash } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { trendingHashtagsQueryOptions } from '../api';

export function TrendingHashtags() {
  const router = useRouter();
  const { data: trending, isLoading } = useQuery(trendingHashtagsQueryOptions());

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (!trending || trending.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-base font-semibold text-foreground">
          Search AuthNest
        </Text>
        <Text className="text-sm text-muted-foreground text-center mt-1">
          Type at least 2 characters to search for posts, people, or hashtags.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={trending}
      keyExtractor={(h) => h.hashtag}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View className="flex-row items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
          <TrendingUp size={16} className="text-primary" />
          <Text className="text-sm font-semibold text-foreground">Trending</Text>
        </View>
      }
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
      contentContainerClassName="pb-3"
    />
  );
}
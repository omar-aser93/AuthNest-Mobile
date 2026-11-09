import { View, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { publicProfileQueryOptions } from '../api';
import { userPostsInfiniteQueryOptions } from '@/features/posts/api';
import { PostFeedList } from '@/features/posts/components/PostFeedList';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { FriendshipButton } from '@/features/friends/components/FriendshipButton';
import { MessageButton } from '../components/MessageButton';
import { ReportButton } from '@/features/reports/components/ReportButton';

export function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const router = useRouter();
  const { user } = useAuth();

  const profileQuery = useQuery(publicProfileQueryOptions(id));
  const postsQuery = useInfiniteQuery(userPostsInfiniteQueryOptions(id));

  // Skip rendering while auth is loading — otherwise the redirect can fire with a null user
  const isSelf = !!user && user.id === id;
  useEffect(() => {
    if (isSelf) router.replace('/profile');
  }, [isSelf, router]);

  if (profileQuery.isLoading) {
    return (
      <Screen edges={['bottom']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </Screen>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <Screen edges={['bottom']}>
        <View className="flex-1 items-center justify-center gap-3 p-6">
          <Text className="text-lg font-semibold text-foreground">User not found</Text>
          <Button onPress={() => profileQuery.refetch()} className="mt-2">
            <Text>Retry</Text>
          </Button>
        </View>
      </Screen>
    );
  }

  const profile = profileQuery.data;
  const posts = postsQuery.data?.pages.flatMap((p) => p.posts) ?? [];
  const initials = (profile.name ?? profile.id).split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  const profileHeader = (
    <View className="items-center gap-3 py-6 px-4 border-b border-border mb-3">
      {profile.image ? (
        <Image source={{ uri: profile.image }} style={{ width: 96, height: 96, borderRadius: 48 }} />
      ) : (
        <View style={{ width: 96, height: 96, borderRadius: 48 }} className="bg-secondary items-center justify-center">
          <Text className="text-3xl font-bold text-foreground">{initials}</Text>
        </View>
      )}
      <Text className="text-2xl font-bold text-foreground">
        {profile.name ?? 'Unnamed'}
      </Text>
      {profile.bio ? (
        <Text className="text-sm text-muted-foreground text-center max-w-sm"> {profile.bio} </Text>
      ) : null}
      <Text className="text-xs text-muted-foreground">
        Joined {new Date(profile.createdAt).toLocaleDateString()}
      </Text>

      {!isSelf && (
        <View className="flex-row flex-wrap gap-2 mt-1 justify-center">        
          <ReportButton targetUserId={id} />
          <MessageButton targetUserId={id} />
          <FriendshipButton targetUserId={id} />
        </View>
      )}
    </View>
  );

  return (
    <Screen scrollable={false} edges={['bottom']}>
      <PostFeedList
        header={profileHeader}
        posts={posts}
        isLoading={postsQuery.isLoading}
        isFetchingNextPage={postsQuery.isFetchingNextPage}
        hasNextPage={!!postsQuery.hasNextPage}
        fetchNextPage={postsQuery.fetchNextPage}
        onRefresh={() => { profileQuery.refetch(); postsQuery.refetch(); }}
        isRefreshing={profileQuery.isRefetching || postsQuery.isRefetching}
        emptyTitle="No posts yet"
        emptyMessage={
          profile.name ? `${profile.name} hasn't posted anything yet.` : "This user hasn't posted anything yet."
        }
      />
    </Screen>
  );
}
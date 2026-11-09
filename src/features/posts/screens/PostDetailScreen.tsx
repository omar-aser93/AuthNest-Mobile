import { View, ActivityIndicator, FlatList, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { postDetailQueryOptions } from '@/features/posts/api';
import { PostCard } from '@/features/posts/components/PostCard';
import { postCommentsQueryOptions, commentKeys } from '@/features/comments/api';
import type { CommentsPage } from '@/features/comments/types';
import { CommentCard } from '@/features/comments/components/CommentCard';
import { CommentForm } from '@/features/comments/components/CommentForm';
import { useAuth } from '@/features/auth/AuthProvider';

export function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();

  const postQuery = useQuery(postDetailQueryOptions(id));
  const commentsQuery = useInfiniteQuery(postCommentsQueryOptions(id));

  // ─── Optimistic removal on delete ────────────────────────────────────────
  const handleCommentDeleted = (commentId: string, parentId?: string | null) => {
    // Filter from whichever list the comment was in
    const key = parentId ? commentKeys.replies(parentId) : commentKeys.list(id);
    qc.setQueryData(
      key,
      (old: { pages: CommentsPage[]; pageParams: unknown[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            comments: page.comments.filter((c) => c.id !== commentId),
          })),
        };
      },
    );
  }

  // ─── Post loading / error ────────────────────────────────────────────────
  if (postQuery.isLoading) {
    return (
      <Screen edges={['bottom']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </Screen>
    );
  }

  if (postQuery.isError || !postQuery.data) {
    return (
      <Screen edges={['bottom']}>
        <View className="flex-1 items-center justify-center gap-3 p-6">
          <Text className="text-lg font-semibold text-foreground">Couldn't load post</Text>
          <Text className="text-sm text-muted-foreground text-center max-w-xs">
            The post may have been deleted, or you may not have permission to view it.
          </Text>
          <Button onPress={() => postQuery.refetch()} className="mt-2">
            <Text>Retry</Text>
          </Button>
        </View>
      </Screen>
    );
  }

  const post = postQuery.data;
  const comments = commentsQuery.data?.pages.flatMap((p) => p.comments) ?? [];

  // Header: PostCard + create form + count label
  const listHeader = (
    <View className="gap-3 pb-3">
      <PostCard post={post} />

      <View className="px-3 gap-2">
        <Text className="text-base font-semibold text-foreground">
          Comments ({post.commentCount})
        </Text>

        {user ? (
          <CommentForm postId={post.id} />
        ) : (
          <Text className="text-sm text-muted-foreground">
            Sign in to join the conversation.
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <Screen scrollable={false} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <View className="px-3">
              <CommentCard
                comment={item}
                postId={post.id}
                onDelete={handleCommentDeleted}
              />
            </View>
          )}
          ListHeaderComponent={listHeader}
          contentContainerClassName="pb-6"
          keyboardShouldPersistTaps="handled"
          onEndReached={() => {
            if (commentsQuery.hasNextPage && !commentsQuery.isFetchingNextPage) {
              commentsQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            commentsQuery.isLoading ? (
              <View className="items-center py-6">
                <ActivityIndicator />
              </View>
            ) : (
              <View className="items-center py-6 px-6">
                <Text className="text-sm text-muted-foreground text-center">
                  No comments yet. Be the first to share your thoughts.
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            commentsQuery.isFetchingNextPage ? (
              <View className="items-center py-4">
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}
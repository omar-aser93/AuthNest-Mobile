import { View, ActivityIndicator } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { commentRepliesQueryOptions } from '../api';
import { CommentCard } from './CommentCard';

type Props = {
  postId: string;
  parentId: string;
  depth: number;
  onDelete?: (commentId: string, parentId?: string | null) => void;
};

export function CommentRepliesList({ postId, parentId, depth, onDelete }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery(commentRepliesQueryOptions(postId, parentId));

  const replies = data?.pages.flatMap((p) => p.comments) ?? [];

  if (isLoading) {
    return (
      <View className="py-2 items-center">
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <View className="mt-1 gap-1">
      {replies.map((reply) => (
        <CommentCard key={reply.id} comment={reply} postId={postId} depth={depth} onDelete={onDelete}/>
      ))}

      {hasNextPage && (
        <Button variant="ghost" onPress={() => fetchNextPage()} disabled={isFetchingNextPage} className="self-start">
          <Text className="text-xs text-primary">
            {isFetchingNextPage ? 'Loading…' : 'Load more replies'}
          </Text>
        </Button>
      )}
    </View>
  );
}
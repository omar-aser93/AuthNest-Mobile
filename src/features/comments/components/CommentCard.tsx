import { useState } from 'react';
import { View, Image, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ellipsis, History } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { renderWithTags } from '@/lib/renderWithTags';
import { formatTimeAgo } from '@/lib/utils';
import { useDeleteComment, useCommentEditHistory} from '../api';
import type { Comment } from '../types';
import { CommentReactionButton } from './CommentReactionButton';
import { CommentMenuSheet } from './CommentMenuSheet';
import { CommentForm } from './CommentForm';
import { CommentRepliesList } from './CommentRepliesList';
import { EditHistoryModal } from '@/components/EditHistoryModal';
import { ReportModal } from '@/features/reports/components/ReportModal';

type Props = {
  comment: Comment;
  postId: string;
  depth?: number;
  onDelete?: (commentId: string, parentId?: string | null) => void;
};

// Cap visual indent — deeper replies stay readable on narrow screens.
function getIndentClasses(depth: number): string {
  if (depth === 0) return '';
  if (depth >= 3) return 'ms-2 ps-2 border-s border-border';
  return 'ms-4 ps-3 border-s border-border';
}

export function CommentCard({ comment, postId, depth = 0, onDelete }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const deleteComment = useDeleteComment();

  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const historyQuery = useCommentEditHistory(comment.id, historyOpen);

  const isAuthor = user?.id === comment.user.id || user?.role === 'admin';

  const handleDelete = () => {
    Alert.alert(
      'Delete this comment?',
      'This cannot be undone. Replies to this comment will also be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteComment.mutate(
              { commentId: comment.id, postId, parentId: comment.parentId },
              { onError: (err) => Alert.alert('Error', err instanceof ApiError ? err.message : 'Delete failed'),
                onSuccess: () => onDelete?.(comment.id, comment.parentId),  
              },
            )
        },
      ],
    );
  };

  const initials = (comment.user.name ?? '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <View className={`py-2 ${getIndentClasses(depth)}`}>
      <View className="flex-row gap-2">
        {/* Avatar */}
        {comment.user.image ? (
          <Image source={{ uri: comment.user.image }} style={{ width: 32, height: 32, borderRadius: 16 }} />
        ) : (
          <View style={{ width: 32, height: 32, borderRadius: 16 }} className="bg-secondary items-center justify-center">
            <Text className="text-xs font-bold text-foreground">{initials}</Text>
          </View>
        )}

        <View className="flex-1 gap-1">
          {/* Header */}
          <View className="flex-row items-center gap-2 flex-wrap">
            <Pressable onPress={() => router.push({ pathname: '/users/[id]', params: { id: comment.user.id } })}>
              <Text className="text-sm font-medium text-foreground">
                {comment.user.name ?? 'Anonymous'}
              </Text>
            </Pressable>
            <Text className="text-xs text-muted-foreground">·</Text>
            <Text className="text-xs text-muted-foreground">{formatTimeAgo(comment.createdAt)}</Text>
            {comment.isEdited && isAuthor && (
              <>
                <Text className="text-xs text-muted-foreground">·</Text>
                <Pressable onPress={() => setHistoryOpen(true)} className="flex-row items-center gap-1 active:opacity-60" >
                  <History size={10} className="text-primary" />
                  <Text className="text-xs text-primary italic">edited</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Content or edit form */}
          {isEditing ? (
            <View className="mt-1">
              <CommentForm
                postId={postId}
                parentId={comment.parentId}
                commentToEdit={comment}
                onCancel={() => setIsEditing(false)}
                autoFocus
              />
            </View>
          ) : (
            <Text className="text-sm text-foreground leading-5">
              {renderWithTags(comment.content)}
            </Text>
          )}

          {/* Actions row */}
          <View className="flex-row items-center gap-1 mt-1">
            <CommentReactionButton
              commentId={comment.id}
              postId={postId}
              parentId={comment.parentId}
              initialReaction={comment.myReaction ?? null}
              initialCount={comment.reactionCount ?? 0}
            />

            {user && !isEditing && (
              <Button
                variant="ghost"
                onPress={() => { setIsEditing(false); setIsReplying((prev) => !prev); }}
                className="px-2 py-1"
              >
                <Text className="text-xs text-muted-foreground">Reply</Text>
              </Button>
            )}

            {comment.replyCount > 0 && (
              <Button
                variant="ghost"
                onPress={() => setShowReplies((prev) => !prev)}
                className="px-2 py-1"
              >
                <Text className="text-xs text-muted-foreground">
                  {showReplies ? 'Hide' : 'View'} {comment.replyCount}{' '}
                  {comment.replyCount === 1 ? 'reply' : 'replies'}
                </Text>
              </Button>
            )}

            {user && !isEditing && (
              <Pressable onPress={() => setMenuOpen(true)} className="ms-auto p-1.5 rounded-md active:bg-secondary" >
                <Ellipsis size={16} className="text-muted-foreground" />
              </Pressable>
            )}
          </View>

          {/* Reply form (inline) */}
          {isReplying && (
            <View className="mt-2">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onSuccess={() => { setIsReplying(false); setShowReplies(true); }}
                onCancel={() => setIsReplying(false)}
                autoFocus
              />
            </View>
          )}

          {/* Replies */}
          {showReplies && (
            <View className="mt-1">
              <CommentRepliesList postId={postId} parentId={comment.id} depth={depth + 1} onDelete={onDelete}/>
            </View>
          )}
        </View>
      </View>

      <CommentMenuSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        isAuthor={isAuthor}
        onEditPress={() => setIsEditing(true)}
        onDeletePress={handleDelete}
        onReportPress={() => setReportOpen(true)}
      />

      <EditHistoryModal
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        edits={historyQuery.data}
        isLoading={historyQuery.isLoading}
        isError={historyQuery.isError}
        onRetry={() => historyQuery.refetch()}
      />

      <ReportModal
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="COMMENT"
        targetId={comment.id}
      />
    </View>
  );
}
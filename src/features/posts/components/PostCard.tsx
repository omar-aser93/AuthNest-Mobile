import { useState } from 'react';
import { View, Image, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ellipsis, Bookmark, History } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { renderWithTags } from '@/lib/renderWithTags';
import { formatTimeAgoShort } from '@/lib/utils';
import { EditHistoryModal } from '@/components/EditHistoryModal';
import type { Post, PostPrivacy } from '../types';
import { useDeletePost, usePostEditHistory, useUnsharePost } from '../api';
import { PostFooter } from './PostFooter';
import { PostMenuSheet } from './PostMenuSheet';
import { ReportModal } from '@/features/reports/components/ReportModal';

const PRIVACY_BADGE: Record<PostPrivacy, { label: string; cls: string }> = {
  PUBLIC:  { label: 'public',  cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
  FRIENDS: { label: 'friends', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
  ONLY_ME: { label: 'only me', cls: 'bg-secondary text-muted-foreground' },
  CUSTOM:  { label: 'custom',  cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' },
};

type Props = {
  post: Post;
  isEmbedded?: boolean;
  showSavedAt?: boolean;
};

export function PostCard({ post, isEmbedded = false, showSavedAt = false }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const deletePost = useDeletePost();
  const unsharePost = useUnsharePost();

  const historyQuery = usePostEditHistory(post.id, historyOpen);

  const isAuthor = post.author.id === user?.id || user?.role === 'admin';
  const isShared = Boolean(post.isShared || post.originalPost);
  const isSaved = user?.savedPosts?.some((sp) => sp.postId === post.id) ?? false;
  const privacy = PRIVACY_BADGE[post.privacy];

  const goToAuthor = () => router.push({ pathname: '/users/[id]', params: { id: post.author.id } });

  const goToDetail = () => router.push({ pathname: '/posts/[id]', params: { id: post.id } });

  const handleDelete = () => {
    Alert.alert(
      'Delete this post?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deletePost.mutate(post.id, {
              onError: (err) =>
                Alert.alert('Error', err instanceof ApiError ? err.message : 'Delete failed'),
            }),
        },
      ],
    );
  };

  const handleUnshare = () => {
    if (!post.originalPost) return;
    Alert.alert(
      'Unshare this post?',
      'This removes the shared post from your feed and decreases the share count on the original.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unshare',
          style: 'destructive',
          onPress: () =>
            unsharePost.mutate(post.originalPost!.id, {
              onError: (err) =>
                Alert.alert('Error', err instanceof ApiError ? err.message : 'Unshare failed'),
            }),
        },
      ],
    );
  };

  // ─── Embedded variant ─────────────────────────────────────────────────────
  // Compact header + content only. No menu, no footer, no save button.
  // No "edited" trigger — matches web (embedded cards don't show edit history).
  if (isEmbedded) {
    return (
      <View className="gap-2">
        <View className="flex-row items-center gap-2">
          {post.author.image ? (
            <Image
              source={{ uri: post.author.image }}
              style={{ width: 24, height: 24, borderRadius: 12 }}
            />
          ) : (
            <View
              style={{ width: 24, height: 24, borderRadius: 12 }}
              className="bg-secondary items-center justify-center"
            >
              <Text className="text-xs font-bold text-foreground">
                {post.author.name?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <Pressable onPress={goToAuthor}>
            <Text className="text-sm font-medium text-foreground">
              {post.author.name ?? 'Anonymous'}
            </Text>
          </Pressable>
          <Text className="text-xs text-muted-foreground">·</Text>
          <Pressable onPress={goToDetail}>
            <Text className="text-xs text-muted-foreground">
              {formatTimeAgoShort(post.createdAt)}
            </Text>
          </Pressable>
          {post.privacy !== 'PUBLIC' && (
            <View className={`rounded-full px-1.5 py-0.5 ${privacy.cls}`}>
              <Text className="text-[9px] font-medium capitalize">{privacy.label}</Text>
            </View>
          )}
        </View>

        {post.image && (
          <Pressable onPress={goToDetail}>
            <Image
              source={{ uri: post.image }}
              style={{ width: '100%', aspectRatio: 16 / 10 }}
              className="rounded-lg mb-3 bg-secondary"
              resizeMode="cover"
            />
          </Pressable>
        )}

        {post.title && (
          <Text className="text-base font-semibold text-foreground">{post.title}</Text>
        )}

        {post.content && (
          <Text className="text-sm text-foreground leading-5">
            {renderWithTags(post.content)}
          </Text>
        )}
      </View>
    );
  }

  // ─── Full card variant ────────────────────────────────────────────────────
  return (
    <View className="border border-border rounded-xl bg-background overflow-hidden">
      {/* Header */}
      <View className="flex-row items-start justify-between p-3">
        <View className="flex-row items-center gap-2 flex-1">
          {post.author.image ? (
            <Image
              source={{ uri: post.author.image }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
          ) : (
            <View
              style={{ width: 40, height: 40, borderRadius: 20 }}
              className="bg-secondary items-center justify-center"
            >
              <Text className="text-base font-bold text-foreground">
                {post.author.name?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}

          <View className="flex-1 gap-0.5">
            <View className="flex-row items-center gap-2 flex-wrap">
              <Pressable onPress={goToAuthor}>
                <Text className="text-sm font-semibold text-foreground">
                  {post.author.name ?? 'Anonymous'}
                </Text>
              </Pressable>
              {isShared && post.originalPost && (
                <Text className="text-xs text-muted-foreground">
                  shared {post.originalPost.author.name ?? 'someone'}&apos;s post
                </Text>
              )}
            </View>

            <View className="flex-row items-center gap-2 flex-wrap">
              <Pressable onPress={goToDetail}>
                <Text className="text-xs text-muted-foreground">
                  {formatTimeAgoShort(post.createdAt)}
                </Text>
              </Pressable>

              {post.isEdited && isAuthor && (
                <Pressable
                  onPress={() => setHistoryOpen(true)}
                  className="flex-row items-center gap-1 active:opacity-60"
                >
                  <History size={10} className="text-primary" />
                  <Text className="text-xs text-primary italic">edited</Text>
                </Pressable>
              )}

              <View className={`rounded-full px-2 py-0.5 ${privacy.cls}`}>
                <Text className="text-[10px] font-medium capitalize">{privacy.label}</Text>
              </View>
              {showSavedAt && post.savedAt && (
                <View className="flex-row items-center gap-1">
                  <Bookmark size={10} className="text-muted-foreground" />
                  <Text className="text-xs text-muted-foreground">
                    Saved {formatTimeAgoShort(post.savedAt)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {user && (
          <Pressable onPress={() => setMenuOpen(true)} className="p-2 -mr-1 rounded-md active:bg-secondary" >
            <Ellipsis size={20} className="text-muted-foreground" />
          </Pressable>
        )}
      </View>

      {/* Share message (only when post is a share) */}
      {isShared && post.content && (
        <View className="px-3 pb-2">
          <Text className="text-sm text-foreground leading-5">
            {renderWithTags(post.content)}
          </Text>
        </View>
      )}

      {/* Body */}
      <View className="px-3 pb-2 gap-2">
        {isShared ? (
          post.originalPost ? (
            <View className="border border-border rounded-lg p-3 bg-secondary/30">
              <PostCard post={post.originalPost} isEmbedded />
            </View>
          ) : (
            <Text className="text-sm text-muted-foreground py-2">
              Original post unavailable — it may have been deleted.
            </Text>
          )
        ) : (
          <>
            {post.image && (
              <Pressable onPress={goToDetail}>
                <Image
                  source={{ uri: post.image }}
                  style={{ width: '100%', aspectRatio: 16 / 10 }}
                  className="rounded-lg mb-3 bg-secondary"
                  resizeMode="cover"
                />
              </Pressable>
            )}
            {post.title && (
              <Text className="text-base font-semibold text-foreground">{post.title}</Text>
            )}
            {post.content && (
              <Text className="text-sm text-foreground leading-5">
                {renderWithTags(post.content)}
              </Text>
            )}
          </>
        )}
      </View>

      {/* Footer */}
      <View className="px-2">
        <PostFooter post={post} isSaved={isSaved} />
      </View>

      <PostMenuSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        postId={post.id}
        isAuthor={isAuthor}
        onDeletePress={handleDelete}
        onUnsharePress={isShared && post.originalPost ? handleUnshare : undefined}
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
        targetType="POST"
        targetId={post.id}
      />
    </View>
  );
}
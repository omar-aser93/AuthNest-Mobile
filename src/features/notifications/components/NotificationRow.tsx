import { Image, Pressable, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { X } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { formatTimeAgo } from '@/lib/utils';
import { useMarkAsRead, useDeleteNotification } from '../api';
import type { Notification, NotificationUser } from '../types';
import type { ReactionType } from '@/features/reactions/types';

const EMOJIS: Record<ReactionType, string> = { LIKE: '👍', LOVE: '❤️', HAHA: '😂', WOW: '😮', SAD: '😢', ANGRY: '😡',};

type RouteTarget = { pathname: string; params?: Record<string, string> } | null;

// Pure utility — lives outside the component, matches web's buildNotification.
// Takes a notification, returns the message tail (rendered after the sender name) + a router.push target.
function buildNotification(n: Notification): { message: string; target: RouteTarget } {
  const postId = n.post?.id ?? n.tag?.post?.id;
  const commentId = n.comment?.id ?? n.tag?.comment?.id;
  const postTarget: RouteTarget = postId ? { pathname: '/posts/[id]', params: { id: postId } } : null;

  switch (n.type) {
    case 'REACTION':
      return {
        message: `reacted ${n.reactionType ? EMOJIS[n.reactionType] : '👍'} to your ${commentId ? 'comment' : 'post'}`,
        target: postTarget,
      };
    case 'COMMENT':
      return { message: 'commented on your post', target: postTarget };
    case 'REPLY':
      return { message: 'replied to your comment', target: postTarget };
    case 'SHARE':
      return { message: 'shared your post', target: postTarget };
    case 'TAG':
      return { message: `mentioned you in a ${commentId ? 'comment' : 'post'}`, target: postTarget, };
    case 'FRIEND_REQUEST':
      return { message: 'sent you a friend request', target: { pathname: '/friends' } };
    case 'FRIEND_REQUEST_ACCEPT':
      return {
        message: 'accepted your friend request',
        target: n.sender ? { pathname: '/users/[id]', params: { id: n.sender.id } } : null,
      };
    default:
      return { message: 'sent you a notification', target: null };
  }
}

// Mirrors web precedence: sender → tag.taggedBy → request.requester
function pickActor(n: Notification): NotificationUser | null {
  return n.sender ?? n.tag?.taggedBy ?? n.request?.requester ?? null;
}

export function NotificationRow({ notification }: { notification: Notification }) {
  const router = useRouter();
  const markAsRead = useMarkAsRead();
  const deleteNotification = useDeleteNotification();

  const actor = pickActor(notification);
  const name = actor?.name ?? 'Someone';
  const initials = name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  const { message, target } = buildNotification(notification);

  const handlePress = () => {
    if (!notification.isRead) markAsRead.mutate(notification.id);
    if (target) router.push(target as never);
  };

  const handleLongPress = () => {
    Alert.alert('Notification', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive',
        onPress: () => deleteNotification.mutate(notification.id),
      },
    ]);
  };

  return (
    <Pressable onPress={handlePress} onLongPress={handleLongPress}
      className={`flex-row items-start gap-3 px-4 py-3 border-b border-border/50 active:bg-secondary ${ notification.isRead ? '' : 'bg-blue-50 dark:bg-blue-900/20' }`}
    >
      {/* Avatar → user profile */}
      <Pressable onPress={() => actor && router.push({ pathname: '/users/[id]', params: { id: actor.id } }) } hitSlop={4} >
        {actor?.image ? (
          <Image source={{ uri: actor.image }} style={{ width: 40, height: 40, borderRadius: 20 }} />
        ) : (
          <View style={{ width: 40, height: 40, borderRadius: 20 }} className="bg-secondary items-center justify-center" >
            <Text className="text-sm font-bold text-foreground">{initials}</Text>
          </View>
        )}
      </Pressable>

      {/* Message + time */}
      <View className="flex-1">
        <Text className="text-sm text-foreground">
          <Text className="font-semibold">{name}</Text>
          {' '}{message}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5">
          {formatTimeAgo(notification.createdAt)}
        </Text>
      </View>

      {/* Unread dot */}
      {!notification.isRead && (<View className="h-2 w-2 rounded-full bg-primary mt-2" />)}

      {/* Delete X */}
      <Pressable onPress={() => deleteNotification.mutate(notification.id)} hitSlop={8} className="p-1 mt-0.5 active:opacity-60" >
        <X size={14} className="text-muted-foreground" />
      </Pressable>
    </Pressable>
  );
}
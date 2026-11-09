import { useQuery } from '@tanstack/react-query';
import { Alert, View, Pressable } from 'react-native';
import { UserPlus, UserCheck, Clock, MoreVertical, Ban, Shield, ShieldOff, UserMinus, X, Check} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ApiError } from '@/lib/api';
import { friendshipStatusQueryOptions } from '../api';
import { useSendFriendRequest, useCancelFriendRequest, useAcceptFriendRequest, useDeclineFriendRequest, useRemoveFriend, useBlockUser, useUnblockUser} from '../api';
import type { FriendshipStatusResponse } from '../types';

type Props = {
  targetUserId: string;
  initialStatus?: FriendshipStatusResponse;
};

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function FriendshipButton({ targetUserId, initialStatus }: Props) {
  const query = useQuery({
    ...friendshipStatusQueryOptions(targetUserId),
    initialData: initialStatus,
  });

  const send = useSendFriendRequest();
  const cancel = useCancelFriendRequest();
  const accept = useAcceptFriendRequest();
  const decline = useDeclineFriendRequest();
  const remove = useRemoveFriend();
  const block = useBlockUser();
  const unblock = useUnblockUser();

  const status = query.data;
  const pending = send.isPending || cancel.isPending || accept.isPending || decline.isPending
    || remove.isPending || block.isPending || unblock.isPending;

  const onError = (err: unknown, fallback: string) => Alert.alert('Error', errMsg(err, fallback));

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleSend    = () => send.mutate(targetUserId, { onError: (e) => onError(e, 'Failed to send request') });
  const handleCancel  = (id?: string) => id && cancel.mutate(id, { onError: (e) => onError(e, 'Cancel failed') });
  const handleAccept  = (id?: string) => id && accept.mutate(id, { onError: (e) => onError(e, 'Accept failed') });
  const handleDecline = (id?: string) => id && decline.mutate(id, { onError: (e) => onError(e, 'Decline failed') });
  const handleRemove  = () => remove.mutate(targetUserId, { onError: (e) => onError(e, 'Unfriend failed') });
  const handleBlock   = () => block.mutate(targetUserId, { onError: (e) => onError(e, 'Block failed') });
  const handleUnblock = () => unblock.mutate(targetUserId, { onError: (e) => onError(e, 'Unblock failed') });

  // ─── ⋮ menu — one Alert per status branch ────────────────────────────────
  const openMenu = () => {
    if (!status?.status) return;

    if (status.status === 'PENDING' && status.direction === 'sent') {
      Alert.alert('Request options', undefined, [
        { text: 'Cancel Request', style: 'destructive', onPress: () => handleCancel(status.friendshipId) },
        { text: 'Block User',     style: 'destructive', onPress: handleBlock },
        { text: 'Cancel',         style: 'cancel' },
      ]);
      return;
    }

    if (status.status === 'PENDING' && status.direction === 'received') {
      Alert.alert('Request options', undefined, [
        { text: 'Block User', style: 'destructive', onPress: handleBlock },
        { text: 'Cancel',     style: 'cancel' },
      ]);
      return;
    }

    if (status.status === 'ACCEPTED') {
      Alert.alert('Friend options', undefined, [
        { text: 'Unfriend',   style: 'destructive', onPress: handleRemove },
        { text: 'Block User', style: 'destructive', onPress: handleBlock },
        { text: 'Cancel',     style: 'cancel' },
      ]);
      return;
    }

    if (status.status === 'BLOCKED' && status.direction === 'sent') {
      Alert.alert('Blocked options', undefined, [
        { text: 'Unblock', onPress: handleUnblock },   // 'default' style, it isn't destructive
        { text: 'Cancel',  style: 'cancel' },
      ]);
    }
  };

  // ─── Render per state ────────────────────────────────────────────────────
  // No relationship — Add Friend
  if (!status?.status) {
    return (
      <Button size="sm" onPress={handleSend} disabled={pending}>
        <UserPlus size={14} className="text-primary-foreground" />
        <Text className="ms-1 text-sm text-primary-foreground">Add</Text>
      </Button>
    );
  }

  // Pending — sent
  if (status.status === 'PENDING' && status.direction === 'sent') {
    return (
      <View className="flex-row items-center">
        <Button size="sm" variant="outline" disabled>
          <Clock size={14} className="text-muted-foreground" />
          <Text className="ms-1 text-sm text-muted-foreground">Sent</Text>
        </Button>
        <Pressable onPress={openMenu} hitSlop={6} className="p-1.5 ms-1 rounded-md active:bg-secondary">
          <MoreVertical size={14} className="text-muted-foreground" />
        </Pressable>
      </View>
    );
  }

  // Pending — received
  if (status.status === 'PENDING' && status.direction === 'received') {
    return (
      <View className="flex-row items-center gap-1">
        <Button size="sm" onPress={() => handleAccept(status.friendshipId)} disabled={pending}>
          <Check size={14} className="text-primary-foreground" />
          <Text className="ms-1 text-sm text-primary-foreground">Accept</Text>
        </Button>
        <Button size="sm" variant="outline" onPress={() => handleDecline(status.friendshipId)} disabled={pending}>
          <X size={14} className="text-foreground" />
        </Button>
        <Pressable onPress={openMenu} hitSlop={6} className="p-1.5 rounded-md active:bg-secondary">
          <MoreVertical size={14} className="text-muted-foreground" />
        </Pressable>
      </View>
    );
  }

  // Friends
  if (status.status === 'ACCEPTED') {
    return (
      <View className="flex-row items-center">
        <Button size="sm" variant="outline" disabled>
          <UserCheck size={14} className="text-green-600" />
          <Text className="ms-1 text-sm text-green-600">Friends</Text>
        </Button>
        <Pressable onPress={openMenu} hitSlop={6} className="p-1.5 ms-1 rounded-md active:bg-secondary">
          <MoreVertical size={14} className="text-muted-foreground" />
        </Pressable>
      </View>
    );
  }

  // Blocked
  if (status.status === 'BLOCKED') {
    if (status.direction !== 'sent') {
      return (
        <Button size="sm" variant="outline" disabled>
          <Ban size={14} className="text-muted-foreground" />
          <Text className="ms-1 text-sm text-muted-foreground">Unavailable</Text>
        </Button>
      );
    }
    return (
      <View className="flex-row items-center">
        <Button size="sm" variant="outline" disabled>
          <Shield size={14} className="text-destructive" />
          <Text className="ms-1 text-sm text-destructive">Blocked</Text>
        </Button>
        <Pressable onPress={openMenu} hitSlop={6} className="p-1.5 ms-1 rounded-md active:bg-secondary">
          <MoreVertical size={14} className="text-muted-foreground" />
        </Pressable>
      </View>
    );
  }

  // Fallback (DECLINED, which is rare/inactive)
  return null;
}
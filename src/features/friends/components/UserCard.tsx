import { Image, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Users } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { FriendshipButton } from './FriendshipButton';
import type { Friend } from '../types';

type Props = {
  user: Pick<Friend, 'id' | 'name' | 'image' | 'bio'> & { friendshipId?: string };
  initialStatus?: {
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED' | null;
    friendshipId?: string;
    direction?: 'sent' | 'received';
  };
  mutualCount?: number;
};

export function UserCard({ user, initialStatus, mutualCount }: Props) {
  const router = useRouter();
  const initials = (user.name ?? '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border/50">
      <Pressable onPress={() => router.push({ pathname: '/users/[id]', params: { id: user.id } })}
        className="flex-row items-center gap-3 flex-1 active:opacity-70" >
        {user.image ? (
          <Image source={{ uri: user.image }} style={{ width: 44, height: 44, borderRadius: 22 }} />
        ) : (
          <View style={{ width: 44, height: 44, borderRadius: 22 }} className="bg-secondary items-center justify-center">
            <Text className="text-base font-bold text-foreground">{initials}</Text>
          </View>
        )}

        <View className="flex-1 gap-0.5">
          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
            {user.name ?? 'Unknown'}
          </Text>
          {user.bio ? (
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>{user.bio}</Text>
          ) : null}
          {mutualCount !== undefined && mutualCount > 0 && (
            <View className="flex-row items-center gap-1">
              <Users size={11} className="text-muted-foreground" />
              <Text className="text-xs text-muted-foreground">
                {mutualCount} mutual friend{mutualCount === 1 ? '' : 's'}
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      <FriendshipButton targetUserId={user.id} initialStatus={initialStatus} />
    </View>
  );
}
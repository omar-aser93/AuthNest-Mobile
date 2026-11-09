import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Info } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { useSocket } from '@/lib/socket/SocketProvider';
import { CallUI } from './CallUI';
import { GroupInfoPanel } from './GroupInfoPanel';
import type { Conversation } from '../types';

export function ChatHeader({ conversation, currentUserId }: { conversation: Conversation; currentUserId: string;}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { onlineUsers } = useSocket();
  const [showInfo, setShowInfo] = useState(false);

  const other = !conversation.isGroup
    ? conversation.participants.find((p) => p.userId !== currentUserId)?.user ?? null
    : null;

  const displayName = conversation.isGroup ? conversation.name ?? 'Group' : other?.name ?? 'Unknown';
  const avatar = !conversation.isGroup ? other?.image ?? null : null;
  const isOnline = other ? onlineUsers.has(other.id) : false;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <>
      <View
        className="flex-row items-center gap-2 border-b border-border bg-background px-3 pb-2"
        style={{ paddingTop: insets.top + 6 }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8} className="p-1 active:opacity-60">
          <ArrowLeft size={22} className="text-foreground" />
        </Pressable>

        <View className="relative">
          {avatar ? (
            <Image source={{ uri: avatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
          ) : (
            <View
              style={{ width: 36, height: 36, borderRadius: 18 }}
              className="bg-primary/20 items-center justify-center"
            >
              <Text className="text-sm font-bold text-primary">{initials}</Text>
            </View>
          )}
          {!conversation.isGroup && (
            <View
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${
                isOnline ? 'bg-green-500' : 'bg-muted-foreground'
              }`}
            />
          )}
        </View>

        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
            {displayName}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {conversation.isGroup
              ? `${conversation.participants.length} members`
              : isOnline
              ? 'Online'
              : 'Offline'}
          </Text>
        </View>

        <CallUI conversationId={conversation.id} />

        {conversation.isGroup && (
          <Pressable onPress={() => setShowInfo(true)} hitSlop={8} className="p-2">
            <Info size={20} className="text-muted-foreground" />
          </Pressable>
        )}
      </View>

      {conversation.isGroup && (
        <GroupInfoPanel visible={showInfo} conversation={conversation} onClose={() => setShowInfo(false)} />
      )}
    </>
  );
}
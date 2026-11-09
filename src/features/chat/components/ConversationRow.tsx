import { Image, Pressable, View } from 'react-native';
import { Users } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { formatTimeAgo } from '@/lib/utils';
import type { ConversationPreview } from '../types';

type Props = {
  conversation: ConversationPreview;
  currentUserId: string;
  unread: number;
  onOpen: () => void;
  onLongPress: () => void;
};

export function ConversationRow({ conversation, currentUserId, unread, onOpen, onLongPress }: Props) {
  const other = !conversation.isGroup
    ? conversation.participants.find((p) => p.userId !== currentUserId)?.user ?? null
    : null;
  const name = conversation.isGroup ? conversation.name ?? 'Group' : other?.name ?? 'Unknown';
  const avatar = !conversation.isGroup ? other?.image ?? null : null;
  const initials = name.slice(0, 2).toUpperCase();

  const last = conversation.messages[0];
  let preview = 'No messages yet';
  if (last) {
    if (!last.content && last.attachments.length > 0) {
      const t = last.attachments[0].fileType;
      preview = t === 'image' ? '📷 Photo' : t === 'video' ? '🎥 Video' : '📎 File';
    } else if (last.content) {
      preview = (last.sender.id === currentUserId ? 'You: ' : '') + last.content;
    } else {
      preview = 'Message deleted';
    }
  }

  return (
    <Pressable onPress={onOpen} onLongPress={onLongPress} delayLongPress={400}
      className={`flex-row items-center gap-3 px-4 py-3 border-b border-border/50 active:bg-secondary ${unread > 0 ? 'bg-primary/5' : ''}`}
    >
      <View className="relative">
        {avatar ? (
          <Image source={{ uri: avatar }} style={{ width: 48, height: 48, borderRadius: 24 }} />
        ) : (
          <View style={{ width: 48, height: 48, borderRadius: 24 }} className="bg-primary/20 items-center justify-center">
            <Text className="text-base font-bold text-primary">{initials}</Text>
          </View>
        )}
        {conversation.isGroup && (
          <View className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-secondary items-center justify-center border border-border">
            <Users size={9} className="text-muted-foreground" />
          </View>
        )}
      </View>

      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center justify-between gap-1">
          <Text className={`text-sm truncate ${unread > 0 ? 'font-bold text-foreground' : 'font-medium text-foreground'}`} numberOfLines={1}>
            {name}
          </Text>
          {conversation.lastMessageAt && (
            <Text className="text-xs text-muted-foreground shrink-0">{formatTimeAgo(conversation.lastMessageAt)}</Text>
          )}
        </View>
        <View className="flex-row items-center justify-between gap-1">
          <Text className={`text-xs truncate ${unread > 0 ? 'text-foreground' : 'text-muted-foreground'}`} numberOfLines={1}>
            {preview}
          </Text>
          {unread > 0 && (
            <View className="min-w-[20px] h-[20px] rounded-full bg-primary items-center justify-center px-1">
              <Text className="text-[10px] font-bold text-primary-foreground">{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
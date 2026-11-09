import { useState } from 'react';
import { Image, Pressable, View, TextInput, Alert, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/features/auth/AuthProvider';
import { formatTimeAgo } from '@/lib/utils';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Check, CheckCheck, Pause, Play } from '@/components/ui/icons';
import { MessageReactionButton } from './MessageReactionButton';
import { MessageMenuSheet } from './MessageMenuSheet';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import type { Message } from '../types';

type Props = {
  message: Message;
  currentUserId: string;
  isGrouped: boolean;
  conversationId: string;
  onEdit: (id: string, data: { content: string }) => void;
  onDelete: (id: string) => void;
};

export function MessageBubble({ message, currentUserId, isGrouped, conversationId, onEdit, onDelete }: Props) {
  const { user } = useAuth();
  const isMine = message.senderId === currentUserId;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content ?? '');
  const [menuOpen, setMenuOpen] = useState(false);

  const isDeleted = message.content === null && message.attachments.length === 0;
  const isSystem = message.content?.startsWith('📞') ?? false;
  const wasEdited = (message.editHistory?.length ?? 0) > 0;
  const initials = (message.sender.name ?? '?').slice(0, 2).toUpperCase();
  const readByOthers = message.reads.filter((r) => r.userId !== currentUserId).length > 0;
  const myReaction = (message.reactions.find((r) => r.userId === currentUserId)?.type as any) ?? null;

  const openActions = () => {
    if (isDeleted || isSystem) return;
    setMenuOpen(true);
  };

  const handleEditPress = () => {
    setEditContent(message.content ?? '');
    setIsEditing(true);
  };

  const handleHardDelete = () => {
    Alert.alert(
      'Delete permanently',
      'This removes the message and all its data for every participant. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          const { api } = await import('@/lib/api');
          await api.delete(`/chat/messages/${message.id}`).catch(() => {});
        }},
      ],
    );
  };

  if (isSystem) {
    return (
      <View className="items-center my-2">
        <Text className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">
          {message.content}
        </Text>
      </View>
    );
  }

  const handleEditSave = () => {
    if (!editContent.trim()) return;
    onEdit(message.id, { content: editContent.trim() });
    setIsEditing(false);
  };

  return (
    <> 
    <View className={`flex-row gap-2 ${isMine ? 'flex-row-reverse' : ''} ${isGrouped ? 'mt-0.5' : 'mt-3'}`}>
      {/* Avatar */}
      <View style={{ width: 32 }}>
        {!isMine && !isGrouped && (
          message.sender.image ? (
            <Image source={{ uri: message.sender.image }} style={{ width: 32, height: 32, borderRadius: 16 }} />
          ) : (
            <View style={{ width: 32, height: 32, borderRadius: 16 }} className="bg-secondary items-center justify-center">
              <Text className="text-xs font-bold text-foreground">{initials}</Text>
            </View>
          )
        )}
      </View>

      {/* Bubble + meta */}
      <View className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && !isGrouped && (
          <Text className="text-xs text-muted-foreground mb-0.5">{message.sender.name}</Text>
        )}

        {isEditing ? (
          <View className="w-72 gap-2">
            <TextInput value={editContent} onChangeText={setEditContent} multiline autoFocus
              className="min-h-[60px] rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <View className="flex-row gap-2 justify-end">
              <Button size="sm" variant="ghost" onPress={() => setIsEditing(false)}>
                <Text>Cancel</Text>
              </Button>
              <Button size="sm" onPress={handleEditSave}>
                <Text>Save</Text>
              </Button>
            </View>
          </View>
        ) : (
          <Pressable onLongPress={openActions} delayLongPress={400}
            className={`px-3 py-2 rounded-2xl ${isMine ? 'bg-primary rounded-br-sm' : 'bg-secondary rounded-bl-sm'} ${isDeleted ? 'opacity-60' : ''}`}
          >
            {isDeleted ? (
              <Text className="text-xs italic opacity-70">Message deleted</Text>
            ) : (
              <>
                {message.content && (
                  <Text className={`text-sm leading-5 ${isMine ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {message.content}
                  </Text>
                )}
                {message.attachments.map((att) => <Attachment key={att.id} attachment={att} isMine={isMine}/>)}
              </>
            )}
          </Pressable>
        )}

        {/* Reactions */}
        {!isDeleted && (
          <View className="mt-0.5">
            <MessageReactionButton messageId={message.id} conversationId={conversationId} initialReaction={myReaction} initialCount={message.reactionCount} initialSummary={message.reactionSummary ?? {}}/>
          </View>
        )}

        {/* Timestamp + edited + read */}
        <View className={`flex-row items-center gap-1 mt-0.5 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <Text className="text-[10px] text-muted-foreground">{formatTimeAgo(message.createdAt)}</Text>
          {wasEdited && <Text className="text-[10px] text-muted-foreground italic">edited</Text>}
          {isMine && !isDeleted && (
            readByOthers ? <CheckCheck size={12} className="text-primary" /> : <Check size={12} className="text-muted-foreground" />
          )}
        </View>
      </View>
    </View>
    <MessageMenuSheet
      visible={menuOpen}
      onClose={() => setMenuOpen(false)}
      isMine={isMine}
      canEdit={isMine && !!message.content}
      isAdmin={user?.role === 'admin'}
      onEditPress={handleEditPress}
      onDeletePress={() => onDelete(message.id)}
      onHardDeletePress={handleHardDelete}
    />
    </>
  );}


// ─── Shared Sub-component: open any file reliably ─────────────────────────────────────────
async function openAttachment(url: string, fileType: string) {
  try {
    // Images/videos: prefer native handler (opens Gallery, VLC, etc.)
    if (fileType === 'image' || fileType === 'video') {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return;
      }
    }
    // PDFs, docs, audio, and any fallback → in-app browser
    // SFSafariViewController / Chrome Custom Tab both render PDFs natively
    await WebBrowser.openBrowserAsync(url);
  } catch {
    Alert.alert('Error', 'Could not open this file.');
  }
}


// ─── Attachment ────────────────────────────────────────────────────────────
function Attachment({
  attachment,
  isMine,
}: {
  attachment: Message['attachments'][0];
  isMine: boolean;
}) {
  const textColor    = isMine ? 'text-primary-foreground'      : 'text-foreground';
  const subTextColor = isMine ? 'text-primary-foreground/70'   : 'text-muted-foreground';
  const chipBg       = isMine ? 'bg-primary-foreground/15'     : 'bg-black/5';

  const onPress = () => openAttachment(attachment.url, attachment.fileType);

  if (attachment.fileType === 'image') {
    return (
      <Pressable onPress={onPress} className="mt-2">
        <Image
          source={{ uri: attachment.url }}
          style={{ width: 200, height: 200, borderRadius: 8 }}
          resizeMode="cover"
        />
      </Pressable>
    );
  }

  if (attachment.fileType === 'video') {
    return (
      <Pressable onPress={onPress} className={`mt-2 flex-row items-center gap-2 ${chipBg} rounded-lg p-2`}>
        <Play size={20} className={textColor} />
        <Text className={`text-xs ${textColor}`} numberOfLines={1}>
          {attachment.fileName}
        </Text>
      </Pressable>
    );
  }

  if (attachment.fileType === 'audio') {
    return <AudioAttachment attachment={attachment} isMine={isMine} />;
  }

  // Generic file — PDF, doc, zip, etc.
  const sizeKB = Math.round(attachment.fileSize / 1024);
  return (
    <Pressable onPress={onPress} className={`mt-2 flex-row items-center gap-2 ${chipBg} rounded-lg p-2`}>
      <Text className="text-lg">📎</Text>
      <View>
        <Text className={`text-xs font-medium ${textColor}`} numberOfLines={1}>
          {attachment.fileName}
        </Text>
        <Text className={`text-[10px] ${subTextColor}`}>{sizeKB} KB</Text>
      </View>
    </Pressable>
  );
}


// ─── AudioAttachment ───────────────────────────────────────────────────────
function AudioAttachment({
  attachment,
  isMine,
}: {
  attachment: Message['attachments'][0];
  isMine: boolean;
}) {
  const player = useAudioPlayer(attachment.url);
  const status = useAudioPlayerStatus(player);
  const isPlaying = status.playing;

  const textColor    = isMine ? 'text-primary-foreground'      : 'text-foreground';
  const subTextColor = isMine ? 'text-primary-foreground/70'   : 'text-muted-foreground';
  const chipBg       = isMine ? 'bg-primary-foreground/15'     : 'bg-primary/10';
  const btnBg        = isMine ? 'bg-primary-foreground'        : 'bg-primary';
  const btnIcon      = isMine ? 'text-primary'                 : 'text-primary-foreground';
  const trackBg      = isMine ? 'bg-primary-foreground/30'     : 'bg-primary/20';
  const trackFill    = isMine ? 'bg-primary-foreground'        : 'bg-primary';

  const toggle = async () => {
    if (isPlaying) {
      player.pause();
      return;
    }

    // Playback reached the end — rewind before playing again
    const finished = status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - 0.05);

    if (finished) { await player.seekTo(0); }
    player.play();
  };

  const fmt = (seconds: number) => {
    const s = Math.floor(seconds);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const pct = status.duration
    ? Math.min(100, (status.currentTime / status.duration) * 100)
    : 0;

  return (
    <Pressable onPress={toggle} className={`mt-2 flex-row items-center gap-2 ${chipBg} rounded-lg p-2 min-w-[180px]`}>
      <View className={`w-8 h-8 rounded-full ${btnBg} items-center justify-center`}>
        {isPlaying
          ? <Pause size={16} className={btnIcon} />
          : <Play  size={16} className={btnIcon} />}
      </View>
      <View className="flex-1">
        <View className={`h-1 rounded-full ${trackBg} overflow-hidden`}>
          <View className={`h-1 ${trackFill} rounded-full`} style={{ width: `${pct}%` }} />
        </View>
        <Text className={`text-[10px] ${subTextColor} mt-0.5`}>
          {fmt(status.currentTime)} / {fmt(status.duration ?? 0)}
        </Text>
      </View>
    </Pressable>
  );
}





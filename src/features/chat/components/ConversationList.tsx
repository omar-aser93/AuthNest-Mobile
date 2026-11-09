import { useEffect, useState } from 'react';
import { FlatList, View, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Edit } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { Pressable } from 'react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { useUnreadCount } from '@/lib/socket/UnreadCountContext';
import { chatKeys, conversationsQueryOptions, useDeleteConversation, useLeaveGroup } from '../api';
import { ConversationRow } from './ConversationRow';
import { NewConversationModal } from './NewConversationModal';
import { useSocket } from '@/lib/socket/SocketProvider';
import { Message } from '../types';

export function ConversationList() {
  const qc = useQueryClient();
  const { socketRef, isConnected } = useSocket();    
  const router = useRouter();
  const { user } = useAuth();
  const { unreadMap, clearUnread } = useUnreadCount();
  const [query, setQuery] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const deleteConversation = useDeleteConversation();
  const leaveGroup = useLeaveGroup();

  const { data, isLoading, isError, refetch } = useQuery(conversationsQueryOptions());
  const conversations = data?.conversations ?? [];
  const filtered = query.trim()
    ? conversations.filter((c) => {
        const other = !c.isGroup ? c.participants.find((p) => p.userId !== user?.id)?.user.name ?? '' : c.name ?? '';
        return other.toLowerCase().includes(query.toLowerCase());
      })
    : conversations;

  const openConversation = (id: string) => {
    clearUnread(id);
    router.push({ pathname: '/(private)/messages/[conversationId]', params: { conversationId: id } });
  };

  const handleLongPress = (conv: typeof conversations[0]) => {
    Alert.alert(conv.isGroup ? 'Leave group?' : 'Delete conversation?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: conv.isGroup ? 'Leave' : 'Delete',
        style: 'destructive',
        onPress: () => {
          const mut = conv.isGroup ? leaveGroup : deleteConversation;
          mut.mutate(conv.id, {
            onError: (err: any) => Alert.alert('Error', err?.message ?? 'Failed'),
            onSuccess: () => clearUnread(conv.id),
          });
        },
      },
    ]);
  };


  // ─── Socket: keep preview + ordering in sync ────────────────────────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected) return;

    const onNew = (msg: Message) => {
      qc.setQueryData(chatKeys.conversations(), (old: any) => {
        if (!old) return old;
        const exists = old.conversations.find((c: any) => c.id === msg.conversationId);
        if (!exists) return old;                    // brand-new conv → next query refetch will pick it up

        const updated = {
          ...exists,
          lastMessageAt: msg.createdAt,
          messages: [{
            content: msg.content,
            sender: { id: msg.sender.id, name: msg.sender.name },
            attachments: msg.attachments.map((a) => ({ fileType: a.fileType, fileName: a.fileName })),
          }],
        };
        // bump to top, drop from old position
        const rest = old.conversations.filter((c: any) => c.id !== msg.conversationId);
        return { ...old, conversations: [updated, ...rest] };
      });
    };

    // A conversation we got removed from (or left) → invalidate so it disappears
    const onRemoved = () => qc.invalidateQueries({ queryKey: chatKeys.conversations() });
    // Someone created a group including us → refetch so we see it
    const onJoined = () => qc.invalidateQueries({ queryKey: chatKeys.conversations() });

    socket.on('new_message', onNew);
    socket.on('removed_from_conversation', onRemoved);
    socket.on('join_new_conversation', onJoined);
    return () => {
      socket.off('new_message', onNew);
      socket.off('removed_from_conversation', onRemoved);
      socket.off('join_new_conversation', onJoined);
    };
  }, [socketRef, isConnected, qc]);


  return (
    <>
      <View className="border-b border-border">
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-lg font-semibold text-foreground">Messages</Text>
          <Pressable onPress={() => setNewOpen(true)} hitSlop={8} className="p-1.5 rounded-md active:bg-secondary">
            <Edit size={20} className="text-muted-foreground" />
          </Pressable>
        </View>
        <View className="px-4 pb-3">
          <View className="relative">
            <View className="absolute left-2.5 top-0 bottom-0 justify-center z-10">
              <Search size={14} className="text-muted-foreground" />
            </View>
            <TextInput value={query} onChangeText={setQuery} placeholder="Search conversations…" placeholderTextColor="#9ca3af"
              className="h-9 rounded-lg border border-border bg-secondary pl-8 pr-3 py-1 text-sm text-foreground"
            />
          </View>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator /></View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-sm text-muted-foreground">Couldn't load conversations</Text>
          <Pressable onPress={() => refetch()} className="mt-3"><Text className="text-primary text-sm">Retry</Text></Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-1 p-6">
          <Text className="text-sm font-semibold text-foreground">No conversations</Text>
          <Text className="text-xs text-muted-foreground text-center">
            Tap the pencil icon above to start one.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item}
              currentUserId={user?.id ?? ''}
              unread={unreadMap[item.id] ?? 0}
              onOpen={() => openConversation(item.id)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
        />
      )}

      <NewConversationModal
        visible={newOpen}
        onClose={() => setNewOpen(false)}
        onNavigate={(id) => {
          setNewOpen(false);
          router.push({ pathname: '/(private)/messages/[conversationId]', params: { conversationId: id } });
        }}
      />
    </>
  );
}
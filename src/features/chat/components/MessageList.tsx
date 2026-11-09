import { useRef, useEffect } from 'react';
import { FlatList, ActivityIndicator, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../types';

type Props = {
  messages: Message[];
  isLoading: boolean; 
  currentUserId: string;
  conversationId: string;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onEdit: (id: string, data: { content: string }) => void;
  onDelete: (id: string) => void;
};

export function MessageList({ messages, isLoading, currentUserId, conversationId, hasMore, isLoadingMore, onLoadMore, onEdit, onDelete }: Props) {
  const listRef = useRef<FlatList<Message>>(null);

  // Inverted FlatList — newest first in data, visually at bottom
  const reversed = [...messages].reverse();

  // Scroll to newest on new message
  const prevCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevCountRef.current) { listRef.current?.scrollToOffset({ offset: 0, animated: true }) }
    prevCountRef.current = messages.length;
  }, [messages.length]);


  if (isLoading) {                                      
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (messages.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-1 px-6">
        <Text className="text-sm text-muted-foreground">No messages yet</Text>
        <Text className="text-xs text-muted-foreground">Say hi 👋</Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={reversed}
      keyExtractor={(m) => m.id}
      inverted
      renderItem={({ item, index }) => {
        const prev = reversed[index + 1];   // older message (since reversed)
        const isGrouped = !!prev && prev.senderId === item.senderId;
        return (
          <View className="px-3">
            <MessageBubble
              message={item}
              currentUserId={currentUserId}
              isGrouped={isGrouped}
              conversationId={conversationId}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </View>
        );
      }}
      onEndReached={() => hasMore && !isLoadingMore && onLoadMore()}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isLoadingMore ? (
          <View className="py-3 items-center"><ActivityIndicator /></View>
        ) : null
      }
      contentContainerClassName="py-2"
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    />
  );
}
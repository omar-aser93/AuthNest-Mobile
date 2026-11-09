import { useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/features/auth/AuthProvider';
import { conversationQueryOptions } from '../api';
import { useChat } from '../hooks/useChat';
import { ChatHeader } from '../components/ChatHeader';
import { MessageList } from '../components/MessageList';
import { TypingIndicator } from '../components/TypingIndicator';
import { MessageInput } from '../components/MessageInput';

export function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user } = useAuth();
  const convQ = useQuery(conversationQueryOptions(conversationId));
  const chat = useChat(conversationId);

  if (!user) return null;
  if (convQ.isLoading) {
    return (
      <View className="flex-1 items-center justify-center"><ActivityIndicator /></View>
    );
  }
  if (convQ.isError || !convQ.data) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-base font-semibold text-foreground">Conversation not found</Text>
      </View>
    );
  }

  const conversation = convQ.data.conversation;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        <ChatHeader conversation={conversation} currentUserId={user.id} />
        <MessageList
          messages={chat.messages}
          isLoading={chat.isLoading}
          currentUserId={user.id}
          conversationId={conversationId}
          hasMore={chat.hasMore}
          isLoadingMore={chat.isLoadingMore}
          onLoadMore={chat.loadMore}
          onEdit={chat.editMessage}
          onDelete={chat.softDeleteMessage}
        />
        <TypingIndicator
          typingUsers={chat.typingUsers}
          participants={conversation.participants}
          currentUserId={user.id}
        />
        <MessageInput
          conversationId={conversationId}
          onSendText={chat.sendTextMessage}
          onTypingStart={chat.emitTypingStart}
          onTypingStop={chat.emitTypingStop}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
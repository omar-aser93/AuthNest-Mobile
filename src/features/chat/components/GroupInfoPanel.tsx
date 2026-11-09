import { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, FlatList, Pressable, Alert } from 'react-native';
import { X, UserMinus, LogOut, Pencil, Check } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { chatKeys } from '../api';
import type { Conversation } from '../types';

type Props = {
  visible: boolean;
  conversation: Conversation;
  onClose: () => void;
};

export function GroupInfoPanel({ visible, conversation, onClose }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const qc = useQueryClient();
  const [name, setName] = useState(conversation.name ?? '');
  const [editing, setEditing] = useState(false);

  // Sync the input's local state when the conversation name changes externally
  // (e.g. another admin renames via socket → 'conversation_updated' event → prop changes).
  // Only when NOT actively editing, so we don't clobber the user's in-progress text.
  useEffect(() => {
    if (!editing) setName(conversation.name ?? '');
  }, [conversation.name, editing]);

  const rename = async () => {
    if (!name.trim()) return;
    try {
      await api.patch(`/chat/conversations/${conversation.id}`, { name: name.trim() });
      qc.invalidateQueries({ queryKey: chatKeys.conversations() });
      qc.invalidateQueries({ queryKey: chatKeys.conversation(conversation.id) });
      setEditing(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to rename group');
    }
  };

  const remove = async (targetId: string) => {
    try {
      await api.delete(`/chat/conversations/${conversation.id}/participants`, { data: { targetUserId: targetId } });
      qc.invalidateQueries({ queryKey: chatKeys.conversations() });
      qc.invalidateQueries({ queryKey: chatKeys.conversation(conversation.id) });
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to remove member');
    }
  };

  const leave = async () => {
    try {
      await api.delete(`/chat/conversations/${conversation.id}/participants`);
      qc.invalidateQueries({ queryKey: chatKeys.conversations() });
      qc.invalidateQueries({ queryKey: chatKeys.conversation(conversation.id) });
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to leave group');
    }
  };

  // [optional] Confirmation helpers — wrap the destructive actions above.
  // Remove these two functions and revert the onPress handlers below if you
  // prefer immediate action with no dialog.
  const confirmRemove = (targetId: string, targetName: string) => {
    Alert.alert(
      'Remove member?',
      `${targetName} will be removed from the group.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => remove(targetId) },
      ],
    );
  };

  const confirmLeave = () => {
    Alert.alert(
      'Leave group?',
      "You'll stop receiving messages from this group. You can be re-added later by another member.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: leave },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <Text className="text-lg font-semibold text-foreground">Group Info</Text>
          <Pressable onPress={onClose} hitSlop={8}><X size={20} className="text-muted-foreground" /></Pressable>
        </View>

        {/* Rename */}
        <View className="px-4 py-3 border-b border-border">
          {editing ? (
            <View className="flex-row items-center gap-2">
              <TextInput value={name} onChangeText={setName} className="flex-1 border border-border rounded-lg px-2 py-1 text-sm" autoFocus />
              <Pressable onPress={rename}><Check size={18} className="text-primary" /></Pressable>
              <Pressable onPress={() => { setEditing(false); setName(conversation.name ?? ''); }}><X size={18} className="text-muted-foreground" /></Pressable>
            </View>
          ) : (
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-foreground">{conversation.name ?? 'Unnamed'}</Text>
              <Pressable onPress={() => setEditing(true)}><Pencil size={16} className="text-muted-foreground" /></Pressable>
            </View>
          )}
        </View>

        {/* Members */}
        <FlatList
          data={conversation.participants}
          keyExtractor={(p) => p.userId}
          renderItem={({ item }) => {
            const isSelf = item.userId === user?.id;
            return (
              <View className="flex-row items-center gap-3 px-4 py-2 border-b border-border/50">
                <Text className="flex-1 text-sm text-foreground">
                  {item.user.name} {isSelf && <Text className="text-xs text-muted-foreground">(you)</Text>}
                </Text>
                {!isSelf && isAdmin && (
                  <Pressable onPress={() => confirmRemove(item.userId, item.user.name)} hitSlop={8}>
                    <UserMinus size={16} className="text-destructive" />
                  </Pressable>
                )}
              </View>
            );
          }}
        />

        {/* Leave */}
        <View className="p-4 border-t border-border">
          <Button variant="destructive" onPress={confirmLeave} className="w-full">
            <LogOut size={16} className="mr-2" />
            <Text>Leave Group</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
}
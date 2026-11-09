import { useState } from 'react';
import { Modal, Pressable, View, TextInput, FlatList, Image, ActivityIndicator, Alert } from 'react-native';
import { Search, X, Check, Users } from '@/components/ui/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useGetOrCreateDM, useCreateGroup } from '../api';

type UserHit = { id: string; name: string | null; image: string | null };

type Props = {
  visible: boolean;
  onClose: () => void;
  onNavigate: (conversationId: string) => void;
};

export function NewConversationModal({ visible, onClose, onNavigate }: Props) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'dm' | 'group'>('dm');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<UserHit[]>([]);
  const [groupName, setGroupName] = useState('');

  const searchQuery = useQuery({
    queryKey: ['chat', 'user-search', query],
    queryFn: async () => {
      const res = await api.get<{ users: UserHit[] }>('/users/search-users', { params: { q: query, limit: 20 } });
      return res.data.users;
    },
    enabled: query.trim().length >= 2,
  });

  const dm = useGetOrCreateDM();
  const group = useCreateGroup();

  const reset = () => {
    setQuery(''); setSelected([]); setGroupName(''); setMode('dm');
  };

  const close = () => { reset(); onClose(); };

  const pickUser = (u: UserHit) => {
    if (mode === 'dm') {
      dm.mutate(u.id, {
        onSuccess: (data) => { close(); onNavigate(data.conversation.id); },
        onError: (err: any) => Alert.alert('Error', err?.message ?? 'Failed'),
      });
      return;
    }
    setSelected((p) => p.some((s) => s.id === u.id) ? p.filter((s) => s.id !== u.id) : [...p, u]);
  };

  const createGroup = () => {
    if (!groupName.trim() || selected.length === 0) return;
    group.mutate(
      { name: groupName.trim(), participantIds: selected.map((s) => s.id) },
      { onSuccess: (data) => { close(); onNavigate(data.conversation.id); },
        onError: (err: any) => Alert.alert('Error', err?.message ?? 'Failed'),
      },
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <Text className="text-lg font-semibold text-foreground">New conversation</Text>
          <Pressable onPress={close} hitSlop={8}><X size={20} className="text-muted-foreground" /></Pressable>
        </View>

        <View className="flex-row gap-2 p-3 border-b border-border">
          {(['dm', 'group'] as const).map((m) => (
            <Pressable key={m} onPress={() => { setMode(m); setSelected([]); }}
              className={`flex-1 py-2 rounded-lg items-center ${mode === m ? 'bg-primary' : 'bg-secondary'}`}
            >
              <Text className={`text-sm font-medium ${mode === m ? 'text-primary-foreground' : 'text-foreground'}`}>
                {m === 'dm' ? 'Direct message' : 'Group chat'}
              </Text>
            </Pressable>
          ))}
        </View>

        {mode === 'group' && (
          <View className="px-3 py-2 gap-2">
            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Group name…"
              placeholderTextColor="#9ca3af"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            {selected.length > 0 && (
              <View className="flex-row flex-wrap gap-2">
                {selected.map((u) => (
                  <Pressable key={u.id} onPress={() => setSelected((p) => p.filter((s) => s.id !== u.id))}
                    className="flex-row items-center gap-1 bg-primary/10 rounded-full px-2 py-1"
                  >
                    <Text className="text-xs text-primary">{u.name}</Text>
                    <X size={10} className="text-primary" />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        <View className="px-3 py-2 border-b border-border">
          <View className="relative">
            <View className="absolute left-2.5 top-0 bottom-0 justify-center z-10">
              <Search size={14} className="text-muted-foreground" />
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search people…"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              className="h-9 rounded-lg border border-border bg-secondary pl-8 pr-3 text-sm text-foreground"
            />
          </View>
        </View>

        <FlatList
          data={searchQuery.data ?? []}
          keyExtractor={(u) => u.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isSel = selected.some((s) => s.id === item.id);
            return (
              <Pressable onPress={() => pickUser(item)} disabled={dm.isPending} className="flex-row items-center gap-3 px-4 py-3 active:bg-secondary">
                {item.image ? (
                  <Image source={{ uri: item.image }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                ) : (
                  <View style={{ width: 40, height: 40, borderRadius: 20 }} className="bg-secondary items-center justify-center">
                    <Text className="text-sm font-bold text-foreground">{(item.name ?? '?')[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <Text className="flex-1 text-sm text-foreground">{item.name ?? 'Unknown'}</Text>
                {mode === 'group' && isSel && <Check size={18} className="text-primary" />}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            query.trim().length < 2 ? (
              <View className="items-center py-8"><Text className="text-sm text-muted-foreground">Type at least 2 characters</Text></View>
            ) : searchQuery.isLoading ? (
              <View className="items-center py-8"><ActivityIndicator /></View>
            ) : (
              <View className="items-center py-8"><Text className="text-sm text-muted-foreground">No users found</Text></View>
            )
          }
        />

        {mode === 'group' && (
          <View className="p-3 border-t border-border" style={{ paddingBottom: insets.bottom + 12 }}>
            <Button onPress={createGroup} disabled={group.isPending || !groupName.trim() || selected.length === 0}>
              <Users size={16} className="text-primary-foreground me-2" />
              <Text className="text-primary-foreground">
                {group.isPending ? 'Creating…' : `Create (${selected.length})`}
              </Text>
            </Button>
          </View>
        )}
      </View>
    </Modal>
  );
}
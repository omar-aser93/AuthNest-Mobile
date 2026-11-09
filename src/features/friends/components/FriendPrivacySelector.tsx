import { useState, useEffect, useMemo } from 'react';
import { View, Pressable, Modal, FlatList, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, Check } from '@/components/ui/icons';

import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useInfiniteFriends } from '../api';
import type { Friend } from '../types';

type Props = {
  allowedIds: string[];
  blockedIds: string[];
  setAllowedIds: (ids: string[]) => void;
  setBlockedIds: (ids: string[]) => void;
  mode?: 'custom' | 'block-only';
};

export function FriendPrivacySelector({
  allowedIds,
  blockedIds,
  setAllowedIds,
  setBlockedIds,
  mode = 'custom',
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteFriends(debouncedSearch);

  const friends = useMemo(
    () => data?.pages.flatMap((p) => p.friends) ?? [],
    [data],
  );

  // ─── Persistent friend cache: keeps Friend objects for badges across searches ─
  // Matches the shape of a Map<id, Friend>. Prevents the web version's bug where
  // changing the search removes selected-friend badges from view.
  const [friendCache, setFriendCache] = useState<Map<string, Friend>>(new Map());
  useEffect(() => {
    if (friends.length === 0) return;
    setFriendCache((prev) => {
      let changed = false;
      const next = new Map(prev);
      for (const f of friends) {
        if (!next.has(f.id)) { next.set(f.id, f); changed = true; }
      }
      return changed ? next : prev;
    });
  }, [friends]);

  // ─── Selected friends — from cache, not current page ─────────────────────
  const selectedFriends = useMemo(() => {
    const ids = mode === 'block-only' ? blockedIds : [...allowedIds, ...blockedIds];
    return Array.from(new Set(ids))
      .map((id) => friendCache.get(id))
      .filter((f): f is Friend => Boolean(f));
  }, [mode, allowedIds, blockedIds, friendCache]);

  // ─── Toggles (matches web semantics) ─────────────────────────────────────
  const toggleAllowed = (id: string) => {
    if (allowedIds.includes(id)) setAllowedIds(allowedIds.filter((i) => i !== id));
    else {
      setAllowedIds([...allowedIds, id]);
      if (blockedIds.includes(id)) setBlockedIds(blockedIds.filter((i) => i !== id));
    }
  };

  const toggleBlocked = (id: string) => {
    if (blockedIds.includes(id)) setBlockedIds(blockedIds.filter((i) => i !== id));
    else {
      setBlockedIds([...blockedIds, id]);
      if (mode !== 'block-only' && allowedIds.includes(id)) {
        setAllowedIds(allowedIds.filter((i) => i !== id));
      }
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View className="gap-3 rounded-lg border border-border p-4 bg-secondary/30">
      {/* Selected badges */}
      <View className="flex-row flex-wrap gap-2">
        {selectedFriends.length === 0 && (
          <Text className="text-sm text-muted-foreground">
            {mode === 'block-only'
              ? 'Select any users you want to block'
              : 'Select any users you want to allow / block'}
          </Text>
        )}
        {selectedFriends.map((f) => {
          const isAllowed = allowedIds.includes(f.id);
          const isBlocked = blockedIds.includes(f.id);
          const badgeCls = isAllowed
            ? 'bg-primary/10 border-primary'
            : 'bg-destructive/10 border-destructive';
          const textCls = isAllowed ? 'text-primary' : 'text-destructive';
          return (
            <Pressable
              key={f.id}
              onPress={() => (isAllowed ? toggleAllowed(f.id) : toggleBlocked(f.id))}
              className={`flex-row items-center gap-1.5 rounded-full border px-2.5 py-1 ${badgeCls}`}
            >
              <Text className={`text-xs font-medium ${textCls}`}>
                {f.name ?? 'Unknown'} ({isAllowed ? 'allow' : 'block'})
              </Text>
              <X size={12} className={textCls} />
            </Pressable>
          );
        })}
      </View>

      {/* Trigger */}
      <Button variant="outline" onPress={() => setModalOpen(true)} className="w-full justify-between">
        <Text>
          {selectedFriends.length > 0
            ? `${selectedFriends.length} user${selectedFriends.length > 1 ? 's' : ''} selected`
            : 'Select users…'}
        </Text>
      </Button>

      {/* Modal */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
            <Text className="text-lg font-semibold text-foreground">
              {mode === 'custom' ? 'Allow / Block users' : 'Block users'}
            </Text>
            <Pressable onPress={() => setModalOpen(false)} className="p-2 -mr-2">
              <X size={22} className="text-foreground" />
            </Pressable>
          </View>

          {/* Search */}
          <View className="border-b border-border px-4 py-2">
            <View className="relative">
              <View className="absolute left-2.5 top-0 bottom-0 justify-center z-10">
                <Search size={16} className="text-muted-foreground" />
              </View>
              <Input
                value={search}
                onChangeText={setSearch}
                placeholder="Search friends…"
                className="pl-9"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* List */}
          <FlatList
            data={friends}
            keyExtractor={(f) => f.id}
            contentContainerClassName="py-2"
            keyboardShouldPersistTaps="handled"
            onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              isLoading ? (
                <View className="items-center py-8">
                  <ActivityIndicator />
                </View>
              ) : isError ? (
                <Text className="text-center text-destructive py-8">Failed to load friends</Text>
              ) : (
                <Text className="text-center text-muted-foreground py-8">
                  {debouncedSearch ? 'No friends match your search' : 'No friends yet'}
                </Text>
              )
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View className="items-center py-4">
                  <ActivityIndicator size="small" />
                </View>
              ) : hasNextPage ? null : friends.length > 0 ? (
                <Text className="text-center text-xs text-muted-foreground py-3">
                  You've reached the end
                </Text>
              ) : null
            }
            renderItem={({ item: f }) => {
              const isAllowed = allowedIds.includes(f.id);
              const isBlocked = blockedIds.includes(f.id);
              return (
                <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border/50">
                  {f.image ? (
                    <Image
                      source={{ uri: f.image }}
                      style={{ width: 36, height: 36, borderRadius: 18 }}
                    />
                  ) : (
                    <View
                      style={{ width: 36, height: 36, borderRadius: 18 }}
                      className="bg-secondary items-center justify-center"
                    >
                      <Text className="text-sm font-bold text-foreground">
                        {f.name?.[0]?.toUpperCase() ?? '?'}
                      </Text>
                    </View>
                  )}

                  <Text className="flex-1 text-sm font-medium text-foreground" numberOfLines={1}>
                    {f.name ?? 'Unknown'}
                  </Text>

                  <View className="flex-row gap-2">
                    {mode !== 'block-only' && (
                      <Pressable
                        onPress={() => toggleAllowed(f.id)}
                        className={`h-8 w-8 items-center justify-center rounded-full border ${
                          isAllowed
                            ? 'bg-primary border-primary'
                            : 'border-border bg-background'
                        }`}
                      >
                        <Check size={14} className={isAllowed ? 'text-primary-foreground' : 'text-muted-foreground'} />
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => toggleBlocked(f.id)}
                      className={`h-8 w-8 items-center justify-center rounded-full border ${
                        isBlocked
                          ? 'bg-destructive border-destructive'
                          : 'border-border bg-background'
                      }`}
                    >
                      <X size={14} className={isBlocked ? 'text-white' : 'text-muted-foreground'} />
                    </Pressable>
                  </View>
                </View>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
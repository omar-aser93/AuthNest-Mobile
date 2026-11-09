import { Modal, View, ScrollView, Image, ActivityIndicator, Pressable } from 'react-native';
import { X } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { renderWithTags } from '@/lib/renderWithTags';
import { formatTimeAgo } from '@/lib/utils';
import type { EditHistoryEntry } from '@/features/posts/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  edits: EditHistoryEntry[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

// Pure display. Each parent feature supplies (edits, isLoading, isError, onRetry)
// via its own query hook — this component never calls any fetcher itself.
export function EditHistoryModal({ visible, onClose, edits, isLoading, isError, onRetry }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-center items-center bg-black/50 px-4" onPress={onClose}>
        <Pressable
          className="w-full max-h-[85%] rounded-2xl bg-background overflow-hidden"
          onPress={() => {}}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Text className="text-lg font-semibold text-foreground">Edit History</Text>
            <Pressable onPress={onClose} className="p-1 -mr-1">
              <X size={20} className="text-foreground" />
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView contentContainerClassName="p-4 gap-3">
            {isLoading && (
              <View className="items-center py-8 gap-2">
                <ActivityIndicator />
                <Text className="text-sm text-muted-foreground">Loading edit history…</Text>
              </View>
            )}

            {!isLoading && isError && (
              <View className="items-center py-8 gap-3">
                <Text className="text-sm text-destructive">Failed to load edit history</Text>
                <Button onPress={onRetry}>
                  <Text>Retry</Text>
                </Button>
              </View>
            )}

            {!isLoading && !isError && (!edits || edits.length === 0) && (
              <Text className="text-sm text-muted-foreground text-center py-8">
                No edit history available.
              </Text>
            )}

            {!isLoading && !isError && edits?.map((edit) => (
              <View key={edit.id} className="border border-border rounded-lg p-3 gap-2">
                {/* Editor header */}
                <View className="flex-row items-center gap-2">
                  {edit.editor.image ? (
                    <Image
                      source={{ uri: edit.editor.image }}
                      style={{ width: 32, height: 32, borderRadius: 16 }}
                    />
                  ) : (
                    <View
                      style={{ width: 32, height: 32, borderRadius: 16 }}
                      className="bg-secondary items-center justify-center"
                    >
                      <Text className="text-xs font-bold text-foreground">
                        {edit.editor.name?.[0]?.toUpperCase() ?? '?'}
                      </Text>
                    </View>
                  )}
                  <View>
                    <Text className="text-sm font-medium text-foreground">{edit.editor.name}</Text>
                    <Text className="text-xs text-muted-foreground">{formatTimeAgo(edit.editedAt)}</Text>
                  </View>
                </View>

                {/* Content diff */}
                <View>
                  <Text className="text-xs text-muted-foreground mb-1">Previous</Text>
                  <Text className="text-sm text-destructive line-through">
                    {renderWithTags(edit.oldContent)}
                  </Text>

                  <Text className="text-xs text-muted-foreground mt-2 mb-1">Updated</Text>
                  <Text className="text-sm text-green-600 dark:text-green-400">
                    {renderWithTags(edit.newContent)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
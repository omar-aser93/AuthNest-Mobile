import { Modal, Pressable, View } from 'react-native';
import { Edit3, Trash2, ShieldOff } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';

type Props = {
  visible: boolean;
  onClose: () => void;
  isMine: boolean;
  canEdit: boolean;          // isMine && content exists
  isAdmin: boolean;
  onEditPress: () => void;
  onDeletePress: () => void;
  onHardDeletePress: () => void;
};

export function MessageMenuSheet({
  visible, onClose, isMine, canEdit, isAdmin,
  onEditPress, onDeletePress, onHardDeletePress,
}: Props) {
  const showEdit       = canEdit;
  const showSoftDelete = isMine;
  const showHardDelete = isAdmin;
  const hasAnyAction   = showEdit || showSoftDelete || showHardDelete;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable className="bg-background rounded-t-2xl pb-8 pt-2" onPress={() => {}}>
          <View className="w-10 h-1 rounded-full bg-border self-center mb-2" />

          {!hasAnyAction && (
            <View className="px-4 py-4">
              <Text className="text-center text-sm text-muted-foreground">
                No actions available
              </Text>
            </View>
          )}

          {showEdit && (
            <Pressable
              onPress={() => { onClose(); onEditPress(); }}
              className="flex-row items-center gap-3 px-4 py-3.5 active:bg-secondary"
            >
              <Edit3 size={20} className="text-foreground" />
              <Text className="text-base text-foreground">Edit message</Text>
            </Pressable>
          )}

          {showSoftDelete && (
            <Pressable
              onPress={() => { onClose(); onDeletePress(); }}
              className="flex-row items-center gap-3 px-4 py-3.5 active:bg-secondary"
            >
              <Trash2 size={20} className="text-destructive" />
              <Text className="text-base text-destructive">Delete for everyone</Text>
            </Pressable>
          )}

          {showHardDelete && (
            <Pressable
              onPress={() => { onClose(); onHardDeletePress(); }}
              className="flex-row items-center gap-3 px-4 py-3.5 active:bg-secondary"
            >
              <ShieldOff size={20} className="text-orange-600" />
              <Text className="text-base text-orange-600">Delete permanently (admin)</Text>
            </Pressable>
          )}

          <Pressable
            onPress={onClose}
            className="my-4 mx-4 py-3 rounded-lg bg-secondary active:bg-border"
          >
            <Text className="text-center font-medium text-foreground">Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
import { Modal, Pressable, View } from 'react-native';
import { Edit3, Trash2, Flag } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';

type Props = {
  visible: boolean;
  onClose: () => void;
  isAuthor: boolean;
  onEditPress: () => void;
  onDeletePress: () => void;
  onReportPress?: () => void;
};

export function CommentMenuSheet({ visible, onClose, isAuthor, onEditPress, onDeletePress, onReportPress}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable className="bg-background rounded-t-2xl pb-8 pt-2" onPress={() => {}}>
          <View className="w-10 h-1 rounded-full bg-border self-center mb-2" />

          {isAuthor ? (
            <>
              <Pressable
                onPress={() => { onClose(); onEditPress(); }}
                className="flex-row items-center gap-3 px-4 py-3.5 active:bg-secondary"
              >
                <Edit3 size={20} className="text-foreground" />
                <Text className="text-base text-foreground">Edit comment</Text>
              </Pressable>

              <Pressable
                onPress={() => { onClose(); onDeletePress(); }}
                className="flex-row items-center gap-3 px-4 py-3.5 active:bg-secondary"
              >
                <Trash2 size={20} className="text-destructive" />
                <Text className="text-base text-destructive">Delete comment</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => { onClose(); onReportPress?.(); }}
              className="flex-row items-center gap-3 px-4 py-3.5 active:bg-secondary"
            >
              <Flag size={20} className="text-orange-600" />
              <Text className="text-base text-orange-600">Report comment</Text>
            </Pressable>
          )}

          <Pressable onPress={onClose} className="mt-2 mb-6 mx-4 py-3 rounded-lg bg-secondary active:bg-border">
            <Text className="text-center font-medium text-foreground">Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
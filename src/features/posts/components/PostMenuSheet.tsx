import { Modal, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Edit3, Trash2, Share2, Flag } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';

type Props = {
  visible: boolean;
  onClose: () => void;
  postId: string;
  isAuthor: boolean;
  onDeletePress: () => void;  
  onUnsharePress?: () => void;
  onReportPress?: () => void;
};

export function PostMenuSheet({ visible, onClose, postId, isAuthor, onDeletePress, onUnsharePress, onReportPress, }: Props) {
  const router = useRouter();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable className="bg-background rounded-t-2xl pb-8 pt-2" onPress={() => {}}>
          <View className="w-10 h-1 rounded-full bg-border self-center mb-2" />

          {isAuthor ? (
            <>
              <Pressable className="flex-row items-center gap-3 px-4 py-3.5 active:bg-secondary"
                onPress={() => {
                  onClose();
                  router.push({ pathname: '/(private)/posts/[id]/edit', params: { id: postId } });
                }}
              >
                <Edit3 size={20} className="text-foreground" />
                <Text className="text-base text-foreground">Edit post</Text>
              </Pressable>

          {/* Mutually exclusive — matches the web ThreeDotsMenu: a shared post can only be unshared, not deleted (the API treats unshare as the delete for shared rows). */}
              {onUnsharePress ? (
                <Pressable onPress={() => { onClose(); onUnsharePress(); }}
                  className="flex-row items-center gap-3 px-4 py-3.5 active:bg-secondary"
                >
                  <Share2 size={20} className="text-orange-600" />
                  <Text className="text-base text-orange-600">Unshare post</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => { onClose(); onDeletePress(); }}
                  className="flex-row items-center gap-3 px-4 py-3.5 active:bg-secondary"
                >
                  <Trash2 size={20} className="text-destructive" />
                  <Text className="text-base text-destructive">Delete post</Text>
                </Pressable>
              )}
            </>
          ) : (
            <Pressable onPress={() => { onClose(); onReportPress?.(); }}
              className="flex-row items-center gap-3 px-4 py-3.5 active:bg-secondary"
            >
              <Flag size={20} className="text-orange-600" />
              <Text className="text-base text-orange-600">Report post</Text>
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
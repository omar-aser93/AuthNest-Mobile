import { Modal, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { ReactionType } from '../types';

const EMOJIS: Record<ReactionType, string> = {LIKE: '👍', LOVE: '❤️', HAHA: '😂', WOW: '😮', SAD: '😢', ANGRY: '😡'};
const ORDER: ReactionType[] = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'];

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (type: ReactionType) => void;
};

// Emoji grid presented as a centered modal.
// On web the picker floats above the button on hover — mobile has no hover, so long-press on ReactionButton opens this instead.
export function ReactionPicker({ visible, onClose, onPick }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-center items-center bg-black/40 px-6" onPress={onClose}>
        <View className="flex-row rounded-full bg-background px-3 py-2 gap-1 shadow-lg">
          {ORDER.map((type) => (
            <Pressable key={type} onPress={() => { onPick(type); onClose(); }} hitSlop={4}
              className="w-11 h-11 items-center justify-center rounded-full active:bg-secondary" >
              <Text className="text-2xl">{EMOJIS[type]}</Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}
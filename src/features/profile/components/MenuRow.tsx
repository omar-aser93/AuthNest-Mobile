import { Pressable, View } from 'react-native';
import { ChevronRight } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';

type MenuRowProps = {
  icon: React.ReactNode;
  label: string;
  rightLabel?: string;
  onPress: () => void;
  destructive?: boolean;
};


// Component to render a row in the menu used in the profile screen
export function MenuRow({ icon, label, rightLabel, onPress, destructive }: MenuRowProps) {
  return (
    <Pressable onPress={onPress}
      className="flex-row items-center justify-between border-b border-border px-4 py-4 active:bg-secondary"
    >
      <View className="flex-row items-center gap-3">
        {icon}
        <Text className={`text-base ${destructive ? 'text-destructive' : 'text-foreground'}`}>
          {label}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        {rightLabel && <Text className="text-sm text-muted-foreground">{rightLabel}</Text>}
        <ChevronRight size={18} className="text-muted-foreground" />
      </View>
    </Pressable>
  );
}
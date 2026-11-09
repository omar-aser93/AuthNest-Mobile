import { View, TextInput, Pressable } from 'react-native';
import { Search, X } from '@/components/ui/icons';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: Props) {
  return (
    <View className="relative flex-row items-center">
      <View className="absolute left-2.5 top-0 bottom-0 justify-center z-10">
        <Search size={16} className="text-muted-foreground" />
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Search posts, people, hashtags…"
        placeholderTextColor="#9ca3af"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        className="h-10 flex-1 rounded-lg border border-border bg-secondary px-3 ps-9 pe-9 text-base text-foreground"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChange('')}
          hitSlop={8}
          className="absolute right-2 top-0 bottom-0 justify-center p-1 active:opacity-60"
        >
          <X size={16} className="text-muted-foreground" />
        </Pressable>
      )}
    </View>
  );
}
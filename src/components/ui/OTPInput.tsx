import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

type OTPInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  invalid?: boolean;
};

export function OTPInput({ value, onChange, length = 6, invalid }: OTPInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <View className="relative items-center">
      {/* Visual boxes */}
      <View className="flex-row gap-2">
        {Array.from({ length }).map((_, i) => (
          <View
            key={i}
            className={cn(
              'h-12 w-10 items-center justify-center rounded-lg border bg-background',
              invalid ? 'border-destructive' : focused && i === activeIndex ? 'border-primary' : 'border-border'
            )}
          >
            <Text className="text-xl font-semibold text-foreground">{value[i] ?? ''}</Text>
          </View>
        ))}
      </View>

      {/* The real input sits on top of the boxes, invisible, and receives every tap */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        selection={{ start: value.length, end: value.length }}   // caret always at the end
        keyboardType="number-pad"
        maxLength={length}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        caretHidden
        autoFocus
        accessibilityLabel="One-time password"
        className="absolute inset-0 opacity-0"
      />
    </View>
  );
}
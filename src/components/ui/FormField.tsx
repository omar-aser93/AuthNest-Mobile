import { View } from 'react-native';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';

type FormFieldProps = {
  label: string;
  htmlFor: string;   // nativeID — links the label to the input for screen readers
  error?: string;
  children: React.ReactNode;
};

export function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <View className="gap-1.5">
      <Label nativeID={htmlFor}>{label}</Label>
      {children}
      {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
    </View>
  );
}
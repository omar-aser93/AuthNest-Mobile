import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

type ScreenProps = {
  children: React.ReactNode;
  scrollable?: boolean;
  edges?: Edge[];
};

export function Screen({ children, scrollable = true, edges = ['top', 'bottom'] }: ScreenProps) {
  const inner = scrollable ? (
    <ScrollView contentContainerClassName="grow p-6" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View className="flex-1">{children}</View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={edges}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        {inner}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
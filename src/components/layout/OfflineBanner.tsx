import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsOnline } from '@/hooks/useIsOnline';

// Component to show "You're offline" when user is offline.
export function OfflineBanner() {
  const online = useIsOnline();
  const insets = useSafeAreaInsets();
  if (online) return null;
  return (
    <View className="bg-amber-500 px-4 pb-2" style={{ paddingTop: insets.top + 8 }} >
      <Text className="text-center text-sm font-medium text-white"> You're offline </Text>
    </View>
  );
}
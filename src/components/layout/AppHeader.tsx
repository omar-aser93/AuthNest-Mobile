import { View, Image } from 'react-native';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/AuthProvider';
import { Text } from '@/components/ui/text';

// AppHeader component, to be placed on top of all tabs screen, it shows logo & notifications badge
export function AppHeader() {  
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-row items-center justify-between border-b border-border bg-background px-4 pb-2" style={{ paddingTop: insets.top + 8 }} >
      {/* Logo */}
      <View className="flex-row items-center gap-2">
        <Image source={require('../../../assets/images/icon.png')} style={{ width: 32, height: 32, borderRadius: 8 }} resizeMode="contain" />
        <Text className="text-xl font-bold text-foreground">AuthNest</Text>
      </View>

      {/* Notifications badge, only visible when user is logged in */}
      {user && <NotificationBell />}
    </View>
  );
}
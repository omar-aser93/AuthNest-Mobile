import { Pressable, View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Bell } from '@/components/ui/icons';
import { useQuery } from '@tanstack/react-query';
import { Text } from '@/components/ui/text';
import { unreadCountQueryOptions } from '../api';


export function NotificationBell() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: count = 0 } = useQuery(unreadCountQueryOptions);

  // Mirror web behavior — hide the badge while on the notifications page
  const displayCount = pathname === '/notifications' ? 0 : count;

  return (
    <Pressable onPress={() => router.push('/notifications')} hitSlop={6}
      className="h-10 w-10 items-center justify-center active:opacity-60"      
    >
      <Bell size={22} className="text-foreground" />      
      {displayCount > 0 && (
        <View className="absolute -right-0.5 -top-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive items-center justify-center px-1">
          <Text className="text-[10px] font-bold text-white">
            {displayCount > 9 ? '9+' : displayCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
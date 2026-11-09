import { View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { notificationsInfiniteQueryOptions, useMarkAllAsRead } from '../api';
import { NotificationList } from '../components/NotificationList';

export function NotificationsScreen() {
  const query = useInfiniteQuery(notificationsInfiniteQueryOptions());
  const markAll = useMarkAllAsRead();

  const notifications = query.data?.pages.flatMap((p) => p.notifications) ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <Screen scrollable={false} edges={['bottom']}>
      {hasUnread && (
        <View className="px-4 py-2 border-b border-border">
          <Button
            variant="ghost"
            onPress={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="self-end"
          >
            <Text className="text-xs text-primary">
              {markAll.isPending ? 'Marking…' : 'Mark all as read'}
            </Text>
          </Button>
        </View>
      )}

      <NotificationList />
    </Screen>
  );
}
import { Tabs, useRouter } from 'expo-router';
import { Home, Search, MessageCircle, Plus, User } from '@/components/ui/icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { useAuth } from '@/features/auth/AuthProvider';
import { useUnreadCount } from '@/lib/socket/UnreadCountContext';


// Layout for main tabs screens, (appHeader at the top & tabs bar at the bottom) - create opens as modal 
export default function TabsLayout() {
  const router = useRouter();                // get the router instance, used to open create modal 
  const { user } = useAuth();                // get the current user from the provider
  const { totalUnread } = useUnreadCount();  // get the total unread count for chat tab badge

  return (
    <Tabs screenOptions={{ header: () => <AppHeader />, tabBarActiveTintColor: '#3b82f6' }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <Home color={color} /> }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: 'Search', tabBarIcon: ({ color }) => <Search color={color} /> }}
      />
      <Tabs.Screen
        name="create"
        options={{ title: 'Create', tabBarIcon: ({ color }) => <Plus color={color} /> }}
        // guest → allow tab switch `app/(tabs)/create` → SignInPrompt renders
        // logged-in → block tab switch → open modal `app/create-post`
        listeners={{ tabPress: (e) => { if (!user) return; e.preventDefault(); router.push('/create-post'); },
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <MessageCircle color={color} />,
          tabBarBadge: totalUnread > 0 ? (totalUnread > 99 ? '99+' : totalUnread) : undefined,  // ← add
          tabBarBadgeStyle: { backgroundColor: '#ef4444' },                                    // ← optional
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <User color={color} /> }}
      />
    </Tabs>
  );
}
import "../../global.css";
import '@/components/ui/icons';
import { Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import '@/lib/reactQuerySetup';
import { SocketProvider } from '@/lib/socket/SocketProvider';
import { UnreadCountProvider } from '@/lib/socket/UnreadCountContext';
import { PortalHost } from "@rn-primitives/portal";             // used by react-native-reusables
import { useColorScheme } from 'nativewind';
import { NAV_THEME, THEME_STORAGE_KEY } from '@/lib/theme';
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { View } from "react-native";
import { useNotificationSocket } from "@/lib/socket/useNotificationSocket";
import { registerGlobals } from '@livekit/react-native';
import { IncomingCallModal } from "@/features/chat/components/IncomingCallModal";

// Keep the native splash visible until the auth state is known.
SplashScreen.preventAutoHideAsync();

// Fallback route when a guarded screen becomes unavailable (e.g. after logout).
export const unstable_settings = { anchor: '(tabs)' };

registerGlobals();        // runs before any LiveKit code


function RootNavigator() {
  const { user, isLoading } = useAuth();     // get auth & loading state from context 
  useNotificationSocket();                   // wire the notification socket

  // Once auth state is known, hide the native splash.
  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  // While loading, render nothing. The native splash stays up.
  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 1. Always available — the (tab) shell + public overlays screens */}
      <Stack.Screen name="(tabs)" />
      {/* optional to add unless we customize those screen's options, Expo Router auto-discovers every file directly under app */}
      <Stack.Screen name="posts/[id]"     options={{ headerShown: true, title: 'Post' }} />     
      <Stack.Screen name="users/[id]"     options={{ headerShown: true, title: 'Profile' }} />
      <Stack.Screen name="hashtags/[tag]" options={{ headerShown: true, title: 'Hashtag' }} />

      {/* 2. Auth routes — only reachable when logged OUT */}
      <Stack.Protected guard={!user}>
        {/* add: options={{ presentation: 'modal' }}, if u want it as a modal */}
        <Stack.Screen name="(auth)" /> 
      </Stack.Protected>

      {/* 3. Protected overlays — only reachable when logged IN */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(private)" />
        <Stack.Screen name="create-post" options={{ presentation: 'modal', headerShown: true, title: 'Create Post' }} />
      </Stack.Protected>
    </Stack>
  );
}

// wrap the root layout with AuthProvider & QueryClientProvider
export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();     // get color scheme
  // Restore the saved theme mode on cold start. Runs alongside AuthProvider's boot sequence — both finish well before SplashScreen.hideAsync(), so no flash of the wrong theme.
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setColorScheme(saved);
        }
      })
      .catch(() => { /* fall back to system */ });
  }, [setColorScheme]);

  return (    
    <QueryClientProvider client={queryClient}> 
      <AuthProvider>
        <SocketProvider>
          <UnreadCountProvider> 
            <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
              <View style={{ flex: 1 }}>
                <OfflineBanner />
                <RootNavigator /> 
                <IncomingCallModal />
                <PortalHost />
              </View>
            </ThemeProvider>
          </UnreadCountProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>   
  );
}



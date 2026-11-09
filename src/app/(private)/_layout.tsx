import { Stack } from 'expo-router';

// (Private) routes group Layout, used for all private routes & it displays a header with current route title + back button
export default function PrivateLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, headerBackTitle: 'Back' }}>
      <Stack.Screen name="notifications"             options={{ title: 'Notifications' }} />
      <Stack.Screen name="edit-profile"              options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="change-password"           options={{ title: 'Change Password' }} />
      <Stack.Screen name="my-posts"                  options={{ title: 'My Posts' }} />
      <Stack.Screen name="saved-posts"               options={{ title: 'Saved Posts' }} />
      <Stack.Screen name="friends"                   options={{ title: 'Friends' }} />
      <Stack.Screen name="my-reports"                options={{ title: 'My Reports' }} />
      <Stack.Screen name="posts/[id]/edit"           options={{ title: 'Edit Post' }} />
      <Stack.Screen name="messages/[conversationId]" options={{ headerShown: false }} />
    </Stack>
  );
}
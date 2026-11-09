import { View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { User } from '@/features/auth/types';

// `ProfileHeader` component, used in `/profile` screen, it displays the user's profile picture, name, email, and edit profile button
export function ProfileHeader({ user }: { user: User }) {
  const router = useRouter();
  const initials = (user.name ?? user.email).split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <View className="items-center gap-3 py-4">
      {user.image ? (
        <Image source={{ uri: user.image }} style={{ width: 96, height: 96, borderRadius: 48 }} />
      ) : (
        <View style={{ width: 96, height: 96, borderRadius: 48 }} className="items-center justify-center bg-secondary" >
          <Text className="text-3xl font-bold text-foreground">{initials}</Text>
        </View>
      )}
      <Text className="text-2xl font-bold text-foreground">{user.name ?? 'Unnamed'}</Text>
      <Text className="text-sm text-muted-foreground">{user.email}</Text>
      <Button variant="outline" onPress={() => router.push('/edit-profile')} className="mt-1 px-6">
        <Text>Edit profile</Text>
      </Button>
    </View>
  );
}
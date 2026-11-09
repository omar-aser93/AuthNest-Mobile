import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FileText, Bookmark, Users, Moon, Lock, Trash2, Flag } from '@/components/ui/icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/features/auth/AuthProvider';
import { ProfileHeader } from '../components/ProfileHeader';
import { StatsRow } from '../components/StatsRow';
import { MenuRow } from '../components/MenuRow';
import { AppearanceModal } from '../components/AppearanceModal';
import { DeleteAccountDialog } from '../components/DeleteAccountDialog';
import { useSignOutConfirm } from '../components/SignOutConfirm';
import { VerificationWarningBar } from '../components/VerificationWarningBar';
import { myStatsQueryOptions } from '../api';

// Profile screen - user's profile page that works as a Hub for all user related screens & settings
export function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const signOutConfirm = useSignOutConfirm();
  const { data: stats } = useQuery(myStatsQueryOptions);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!user) return null;

  return (
    <Screen scrollable={false}>
      <ScrollView contentContainerClassName="pb-8">
        {!user.isEmailVerified && user.emailVerifyExpiry && (
          <VerificationWarningBar emailVerifyExpiry={user.emailVerifyExpiry} />
        )}

        <ProfileHeader user={user} />
        <StatsRow
          stats={[
            { label: 'Posts',   value: stats?.postsCount },
            { label: 'Saved',   value: stats?.savedPostsCount },
            { label: 'Friends', value: stats?.friendsCount },
          ]}
        />

        <View className="mt-4">
          <MenuRow
            icon={<FileText size={20} className="text-foreground" />}
            label="My Posts"
            onPress={() => router.push('/my-posts')}
          />
          <MenuRow
            icon={<Bookmark size={20} className="text-foreground" />}
            label="Saved Posts"
            onPress={() => router.push('/saved-posts')}
          />
          <MenuRow
            icon={<Users size={20} className="text-foreground" />}
            label="Friends Manager"
            onPress={() => router.push('/friends')}
          />
          <MenuRow
            icon={<Flag size={20} className="text-foreground" />}
            label="My Reports"
            onPress={() => router.push('/my-reports')}
          />
        </View>

        <View className="mt-6">
          <MenuRow
            icon={<Moon size={20} className="text-foreground" />}
            label="Appearance"
            rightLabel="Light / Dark"
            onPress={() => setAppearanceOpen(true)}
          />
          {user.hasPassword && (
            <MenuRow
              icon={<Lock size={20} className="text-foreground" />}
              label="Change password"
              onPress={() => router.push('/change-password')}
            />
          )}
          <MenuRow
            icon={<Trash2 size={20} className="text-destructive" />}
            label="Delete account"
            onPress={() => setDeleteOpen(true)}
            destructive
          />
        </View>

        <View className="px-4 pt-8">
          <Button variant="destructive" onPress={signOutConfirm} className="w-full">
            <Text>Sign out</Text>
          </Button>
        </View>
      </ScrollView>

      <AppearanceModal visible={appearanceOpen} onClose={() => setAppearanceOpen(false)} />
      <DeleteAccountDialog visible={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </Screen>
  );
}
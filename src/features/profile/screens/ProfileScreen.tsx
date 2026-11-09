import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FileText, Bookmark, Users, Moon, Lock, Trash2, Flag, Languages } from '@/components/ui/icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/features/auth/AuthProvider';
import { ProfileHeader } from '../components/ProfileHeader';
import { StatsRow } from '../components/StatsRow';
import { MenuRow } from '../components/MenuRow';
import { AppearanceModal } from '../components/AppearanceModal';
import { LanguageModal } from '../components/LanguageModal';
import { DeleteAccountDialog } from '../components/DeleteAccountDialog';
import { useSignOutConfirm } from '../components/SignOutConfirm';
import { VerificationWarningBar } from '../components/VerificationWarningBar';
import { myStatsQueryOptions } from '../api';

// Profile screen - user's profile page that works as a Hub for all user related screens & settings
export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const signOutConfirm = useSignOutConfirm();
  const { data: stats } = useQuery(myStatsQueryOptions);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
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
            { label: t('profile.posts'),   value: stats?.postsCount },
            { label: t('profile.saved'),   value: stats?.savedPostsCount },
            { label: t('profile.friends'), value: stats?.friendsCount },
          ]}
        />

        <View className="mt-4">
          <MenuRow
            icon={<FileText size={20} className="text-foreground" />}
            label={t('profile.myPosts')}
            onPress={() => router.push('/my-posts')}
          />
          <MenuRow
            icon={<Bookmark size={20} className="text-foreground" />}
            label={t('profile.savedPosts')}
            onPress={() => router.push('/saved-posts')}
          />
          <MenuRow
            icon={<Users size={20} className="text-foreground" />}
            label={t('profile.friendsManager')}
            onPress={() => router.push('/friends')}
          />
          <MenuRow
            icon={<Flag size={20} className="text-foreground" />}
            label={t('profile.myReports')}
            onPress={() => router.push('/my-reports')}
          />
        </View>

        <View className="mt-6">
          <MenuRow
            icon={<Moon size={20} className="text-foreground" />}
            label={t('profile.appearance')}
            rightLabel={`${t('profile.themeLight')} / ${t('profile.themeDark')}`}
            onPress={() => setAppearanceOpen(true)}
          />
          <MenuRow
            icon={<Languages size={20} className="text-foreground" />}
            label={t('profile.language')}
            rightLabel={i18n.language === 'ar' ? t('profile.arabic') : t('profile.english')}
            onPress={() => setLanguageOpen(true)}
          />
          {user.hasPassword && (
            <MenuRow
              icon={<Lock size={20} className="text-foreground" />}
              label={t('profile.changePassword')}
              onPress={() => router.push('/change-password')}
            />
          )}
          <MenuRow
            icon={<Trash2 size={20} className="text-destructive" />}
            label={t('profile.deleteAccount')}
            onPress={() => setDeleteOpen(true)}
            destructive
          />
        </View>

        <View className="px-4 pt-8">
          <Button variant="destructive" onPress={signOutConfirm} className="w-full">
            <Text>{t('profile.signOut')}</Text>
          </Button>
        </View>
      </ScrollView>

      <AppearanceModal visible={appearanceOpen} onClose={() => setAppearanceOpen(false)} />
      <LanguageModal visible={languageOpen} onClose={() => setLanguageOpen(false)} />
      <DeleteAccountDialog visible={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </Screen>
  );
}
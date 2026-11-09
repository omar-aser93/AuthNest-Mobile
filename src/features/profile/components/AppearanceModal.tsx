import { Modal, View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from '@/components/ui/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import { THEME_STORAGE_KEY } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

type Mode = 'light' | 'dark' | 'system';
type Props = { visible: boolean; onClose: () => void };

const OPTIONS = [
  { value: 'light'  as const, icon: Sun,     labelKey: 'profile.themeLight'  },
  { value: 'dark'   as const, icon: Moon,    labelKey: 'profile.themeDark'   },
  { value: 'system' as const, icon: Monitor, labelKey: 'profile.themeSystem' },
] as const;


// Component to display the modal for choosing the mode (light or dark)
export function AppearanceModal({ visible, onClose }: Props) {
   const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-center bg-black/50 px-6" onPress={onClose}>
        <Pressable className="gap-4 rounded-2xl bg-background p-5" onPress={() => {}}>
          <Text className="text-lg font-semibold text-foreground">
            {t('profile.appearance')}
          </Text>
          <ModeToggle />
        </Pressable>
      </Pressable>
    </Modal>
  );
}


// Subcomponent to display the mode options
export function ModeToggle() {
  const { setColorScheme } = useColorScheme();
  const [mode, setMode] = useState<Mode>('system');
  const { t } = useTranslation();

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') setMode(saved);
    });
  }, []);

  const changeMode = (next: Mode) => {
    setMode(next);
    setColorScheme(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
  };

  return (
    <View className="flex-row gap-1 rounded-lg bg-secondary p-1">
      {OPTIONS.map(({ value, icon: Icon, labelKey }) => {
        const active = mode === value;
        return (
          <Pressable key={value} onPress={() => changeMode(value)}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-md px-3 py-2 ${active ? 'bg-background' : ''}`}
          >
            <Icon size={16} className={active ? 'text-foreground' : 'text-muted-foreground'} />
            <Text className={`text-sm font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
              {t(labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
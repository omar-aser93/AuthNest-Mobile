import { Modal, View, Pressable, I18nManager } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNRestart from 'react-native-restart';

const STORAGE_KEY = 'app_language';

type Props = { visible: boolean; onClose: () => void };

// Modal for picking the app language — same shape as AppearanceModal
export function LanguageModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-center bg-black/50 px-6" onPress={onClose}>
        <Pressable className="gap-4 rounded-2xl bg-background p-5" onPress={() => {}}>
          <Text className="text-lg font-semibold text-foreground">
            {t('profile.language')}
          </Text>
          <LanguageToggle />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Subcomponent mirroring ModeToggle — pill with the available languages
export function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const current = i18n.language;

  const change = async (lang: 'en' | 'ar') => {
    // 1) Swap the strings — every component using useTranslation re-renders immediately
    await i18n.changeLanguage(lang);

    // 2) Persist so init() restores it on cold start
    await AsyncStorage.setItem(STORAGE_KEY, lang);

    // 3) If the direction needs to flip (LTR ↔ RTL), force it and restart.
    //    I18nManager.isRTL reflects the CURRENT session — the change only
    //    takes effect after the JS bundle is reloaded.
    const shouldBeRTL = lang === 'ar';
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.forceRTL(shouldBeRTL);
      I18nManager.allowRTL(shouldBeRTL);
      RNRestart.Restart(); // closes the modal automatically via unmount
    }
  };

  return (
    <View className="flex-row gap-1 rounded-lg bg-secondary p-1">
      {(['en', 'ar'] as const).map((lang) => {
        const active = current === lang;
        return (
          <Pressable
            key={lang}
            onPress={() => change(lang)}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-md px-3 py-2 ${active ? 'bg-background' : ''}`}
          >
            <Text className={`text-sm font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
              {t(`profile.${lang === 'en' ? 'english' : 'arabic'}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
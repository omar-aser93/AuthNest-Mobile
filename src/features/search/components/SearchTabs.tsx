import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';

export type SearchTab = 'posts' | 'people' | 'hashtags';

const TABS: { key: SearchTab; label: string }[] = [
  { key: 'posts',    label: 'Posts'    },
  { key: 'people',   label: 'People'   },
  { key: 'hashtags', label: 'Hashtags' },
];

type Props = {
  value: SearchTab;
  onChange: (tab: SearchTab) => void;
};

export function SearchTabs({ value, onChange }: Props) {
  return (
    <View className="flex-row border-b border-border bg-background">
      {TABS.map((tab) => {
        const active = value === tab.key;
        return (
          <Pressable key={tab.key} onPress={() => onChange(tab.key)}
            className={`flex-1 py-3 items-center active:bg-secondary ${ active ? 'border-b-2 border-primary' : '' }`}
          >
            <Text className={`text-sm font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
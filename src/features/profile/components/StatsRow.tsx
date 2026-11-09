import { View } from 'react-native';
import { Text } from '@/components/ui/text';

type Stat = { label: string; value: number | undefined };

// Component to display a row of stats (posts, saved posts, friends), receives an array of stats as props
export function StatsRow({ stats }: { stats: Stat[] }) {
  return (
    <View className="flex-row justify-around border-y border-border py-4">
      {stats.map((s) => (
        <View key={s.label} className="flex-1 items-center gap-1">
          <Text className="text-xl font-bold text-foreground">{s.value ?? '—'}</Text>
          <Text className="text-xs text-muted-foreground">{s.label}</Text>
        </View>
      ))}
    </View>
  );
}
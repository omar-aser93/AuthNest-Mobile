import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ThumbsUp } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { ReactionPicker } from './ReactionPicker';
import type { ReactionType } from '../types';

const EMOJIS: Record<ReactionType, string> = { LIKE: '👍', LOVE: '❤️', HAHA: '😂', WOW: '😮', SAD: '😢', ANGRY: '😡' };

type Summary = Partial<Record<ReactionType, number>>;

type Props = {
  initialReaction?: ReactionType | null;
  initialCount: number;
  initialSummary?: Summary;   // chat messages only: enables the top-3 emoji summary
  onReact: (type: ReactionType | null) => Promise<void>;
};

function bump(s: Summary, type: ReactionType, delta: number): Summary {
  const next = { ...s, [type]: Math.max(0, (s[type] ?? 0) + delta) };
  if (!next[type]) delete next[type];
  return next;
}

export function ReactionButton({ initialReaction, initialCount, initialSummary, onReact }: Props) {
  const summaryMode = initialSummary !== undefined;
  const [reaction, setReaction] = useState<ReactionType | null>(initialReaction ?? null);
  const [count, setCount] = useState(initialCount);
  const [summary, setSummary] = useState<Summary>(initialSummary ?? {});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  // Follow the server/cache data, but never overwrite an in-flight optimistic update
  const summaryKey = JSON.stringify(initialSummary ?? {});
  useEffect(() => {
    if (pendingRef.current) return;
    setReaction(initialReaction ?? null);
    setCount(initialCount);
    setSummary(initialSummary ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReaction, initialCount, summaryKey]);

  const apply = async (next: ReactionType | null) => {
    if (pendingRef.current) return;
    const prev = reaction;
    const prevCount = count;
    const prevSummary = summary;

    setReaction(next);
    setCount(prevCount + (next ? 1 : 0) - (prev ? 1 : 0));
    if (summaryMode) {
      let s = summary;
      if (prev) s = bump(s, prev, -1);
      if (next) s = bump(s, next, 1);
      setSummary(s);
    }

    pendingRef.current = true;
    setPending(true);
    try {
      await onReact(next);
    } catch {
      setReaction(prev);
      setCount(prevCount);
      setSummary(prevSummary);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };

  const topEmojis = (Object.entries(summary) as [ReactionType, number][])
    .filter(([, n]) => n > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <>
      <Pressable
        onPress={() => apply(reaction ? null : 'LIKE')}
        onLongPress={() => !pendingRef.current && setPickerOpen(true)}
        disabled={pending}
        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-md active:bg-secondary"
      >
        {summaryMode && topEmojis.length > 0 ? (
          <View className="flex-row items-center gap-0.5">
            {topEmojis.map(([type]) => (
              <Text key={type} className="text-sm">{EMOJIS[type]}</Text>
            ))}
            <Text className={`ms-1 text-sm ${reaction ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              {count}
            </Text>
          </View>
        ) : (
          <>
            {reaction ? (
              <Text className="text-base">{EMOJIS[reaction]}</Text>
            ) : (
              <ThumbsUp size={18} className="text-muted-foreground" />
            )}
            <Text className={`text-sm ${reaction ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              {count}
            </Text>
          </>
        )}
      </Pressable>

      <ReactionPicker visible={pickerOpen} onClose={() => setPickerOpen(false)} onPick={(type) => apply(type)} />
    </>
  );
}
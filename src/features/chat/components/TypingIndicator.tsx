import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { ConversationParticipant } from '../types';

export function TypingIndicator({ typingUsers, participants, currentUserId }: {
  typingUsers: Set<string>;
  participants: ConversationParticipant[];
  currentUserId: string;
}) {
  const ids = [...typingUsers].filter((id) => id !== currentUserId);
  if (ids.length === 0) return null;

  const names = ids.map((id) => participants.find((p) => p.userId === id)?.user.name).filter(Boolean) as string[];

  let text = '';
  if (names.length === 1) text = `${names[0]} is typing`;
  else if (names.length === 2) text = `${names[0]} and ${names[1]} are typing`;
  else if (names.length > 2) text = `${names[0]}, ${names[1]} and ${names.length - 2} others are typing`;

  return (
    <View className="flex-row items-center gap-2 px-4 py-1">
      <View className="flex-row gap-0.5 items-end h-4">
        <Bounce delay={0} />
        <Bounce delay={150} />
        <Bounce delay={300} />
      </View>
      <Text className="text-xs text-muted-foreground italic">{text}</Text>
    </View>
  );
}

function Bounce({ delay }: { delay: number }) {
  const [y, setY] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setY((p) => (p === 0 ? -3 : 0)), 300);
    const timer = setTimeout(() => setY(-3), delay);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [delay]);
  return <View style={{ transform: [{ translateY: y }] }} className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />;
}
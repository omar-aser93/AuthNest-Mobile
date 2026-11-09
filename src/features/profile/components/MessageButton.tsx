import { ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageCircle } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useGetOrCreateDM } from '@/features/chat/api';

export function MessageButton({ targetUserId }: { targetUserId: string }) {
  const router = useRouter();
  const dm = useGetOrCreateDM();

  const handlePress = () => {
    dm.mutate(targetUserId, {
      onSuccess: (data) => {
        router.push({ pathname: '/(private)/messages/[conversationId]', params: { conversationId: data.conversation.id } });
      },
      onError: (err: any) => Alert.alert('Error', err?.message ?? 'Failed to open conversation'),
    });
  };

  return (
    <Button size="sm" variant="outline" onPress={handlePress} disabled={dm.isPending}>
      {dm.isPending ? <ActivityIndicator size="small" /> : <MessageCircle size={14} className="text-foreground" />}
      <Text className="ms-1.5 text-sm text-foreground">Message</Text>
    </Button>
  );
}
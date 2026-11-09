import { useState } from 'react';
import { Modal, View, TextInput, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { useDeleteAccount } from '../api';

const CONFIRM_WORD = 'DELETE';


// Modal component to handle account deletion
export function DeleteAccountDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user, signOut } = useAuth();
  const deleteAccount = useDeleteAccount();
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (!user || confirmText !== CONFIRM_WORD) return;
    try {
      await deleteAccount.mutateAsync(user.id);
      await signOut();     // clears tokens + flips Stack.Protected → auth group
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Delete failed';
      Alert.alert('Error', msg);
    } finally {
      setConfirmText('');
    }
  };

  const close = () => { setConfirmText(''); onClose(); };    // function to clear text on close

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View className="flex-1 justify-center bg-black/50 px-6">
        <View className="gap-4 rounded-2xl bg-background p-5">
          <Text className="text-xl font-semibold text-foreground">Delete account?</Text>
          <Text className="text-sm text-muted-foreground">
            This permanently deletes your account, posts, comments, messages, and all related data. This cannot be undone.
          </Text>
          <Text className="text-sm text-muted-foreground">
            Type <Text className="font-semibold text-foreground">{CONFIRM_WORD}</Text> to confirm:
          </Text>
          <TextInput value={confirmText} onChangeText={setConfirmText} placeholder={CONFIRM_WORD} autoCapitalize="characters" autoCorrect={false}
            className="h-11 rounded-lg border border-border bg-background px-3 text-base text-foreground"
          />
          <View className="flex-row gap-3">
            <Button variant="outline" onPress={close} disabled={deleteAccount.isPending} className="flex-1">
              <Text>Cancel</Text>
            </Button>
            <Button variant="destructive" onPress={handleDelete} disabled={deleteAccount.isPending || confirmText !== CONFIRM_WORD} className="flex-1" >
              <Text>{deleteAccount.isPending ? 'Deleting…' : 'Delete'}</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
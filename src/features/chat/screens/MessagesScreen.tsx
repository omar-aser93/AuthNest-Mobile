import { View } from 'react-native';
import { ConversationList } from '../components/ConversationList';

export function MessagesScreen() {
  return (
    <View className="flex-1 bg-background">
      <ConversationList />
    </View>
  );
}
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/text';
import { FriendsList } from '../components/FriendsList';
import { RequestsList } from '../components/RequestsList';
import { SuggestionsList } from '../components/SuggestionsList';
import { BlockedUsersList } from '../components/BlockedUsersList';

type Tab = 'friends' | 'requests' | 'suggestions' | 'blocked';
type RequestType = 'received' | 'sent';

const TABS: { key: Tab; label: string }[] = [
  { key: 'friends',     label: 'Friends'     },
  { key: 'requests',    label: 'Requests'    },
  { key: 'suggestions', label: 'Suggestions' },
  { key: 'blocked',     label: 'Blocked'     },
];

export function FriendsManagerScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [requestType, setRequestType] = useState<RequestType>('received');

  return (
    <Screen scrollable={false} edges={['bottom']}>
      {/* Primary tab bar */}
      <View className="flex-row border-b border-border bg-background">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 items-center active:bg-secondary ${active ? 'border-b-2 border-primary' : ''}`}
            >
              <Text className={`text-xs font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Requests sub-tab bar */}
      {activeTab === 'requests' && (
        <View className="flex-row border-b border-border bg-background">
          {(['received', 'sent'] as const).map((type) => {
            const active = requestType === type;
            return (
              <Pressable key={type} onPress={() => setRequestType(type)}
                className={`flex-1 py-2 items-center ${active ? 'border-b-2 border-primary' : ''}`}
              >
                <Text className={`text-xs ${active ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {type === 'received' ? 'Received' : 'Sent'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Content */}
      <View className="flex-1">
        {activeTab === 'friends'     && <FriendsList />}
        {activeTab === 'requests'    && <RequestsList type={requestType} />}
        {activeTab === 'suggestions' && <SuggestionsList />}
        {activeTab === 'blocked'     && <BlockedUsersList />}
      </View>
    </Screen>
  );
}
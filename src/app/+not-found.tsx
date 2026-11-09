import { Link } from 'expo-router';
import { View, Text } from 'react-native';

// NotFound page, for all routes that don't exist
export default function NotFound() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg text-gray-500">Page not found</Text>
      <Link href="/" className="mt-4 text-blue-500">Go home</Link>
    </View>
  );
}
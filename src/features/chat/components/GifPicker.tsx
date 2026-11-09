import { useState } from 'react';
import { View, TextInput, FlatList, Pressable, Image } from 'react-native';
import { Search } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';

type GifResult = { id: string; url: string; preview: string; width: number; height: number };

export function GifPicker({ onSelect }: { onSelect: (gif: GifResult) => void }) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (q: string) => {
    setQuery(q);
    setLoading(true);
    const endpoint = q
      ? `https://api.klipy.com/v2/search?q=${encodeURIComponent(q)}&key=${process.env.EXPO_PUBLIC_KLIPY_KEY}&limit=20`
      : `https://api.klipy.com/v2/featured?key=${process.env.EXPO_PUBLIC_KLIPY_KEY}&limit=20`;
    const res = await fetch(endpoint);
    const data = await res.json();
    const parsed: GifResult[] = (data.results ?? []).map((r: any) => ({
      id: r.id,
      url: r.media_formats?.gif?.url ?? r.media_formats?.tinygif?.url ?? '',
      preview: r.media_formats?.tinygif?.url ?? r.media_formats?.nanogif?.url ?? '',
      width: r.media_formats?.tinygif?.dims?.[0] ?? 200,
      height: r.media_formats?.tinygif?.dims?.[1] ?? 200,
    })).filter((g: GifResult) => g.url && g.preview);
    setGifs(parsed);
    setLoading(false);
  };

  return (
    <View className="bg-background rounded-xl p-3 w-72 max-h-96">
      <View className="flex-row items-center gap-2 border border-border rounded-lg px-2 mb-2">
        <Search size={16} className="text-muted-foreground" />
        <TextInput
          value={query}
          onChangeText={search}
          placeholder="Search GIFs…"
          className="flex-1 py-2 text-sm text-foreground"
        />
      </View>
      <FlatList data={gifs} keyExtractor={(g) => g.id} numColumns={2}
        renderItem={({ item }) => (
          <Pressable onPress={() => onSelect(item)} className="m-0.5">
            <Image source={{ uri: item.preview }} style={{ width: 120, height: 80, borderRadius: 6 }} />
          </Pressable>
        )}
        ListEmptyComponent={
          <Text className="text-center text-muted-foreground py-4">
            {loading ? 'Loading…' : 'No GIFs found'}
          </Text>
        }
      />
    </View>
  );
}
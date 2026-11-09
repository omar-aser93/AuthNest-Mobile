import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { SearchBar } from '../components/SearchBar';
import { SearchTabs, type SearchTab } from '../components/SearchTabs';
import { PostsTab } from '../components/PostsTab';
import { PeopleTab } from '../components/PeopleTab';
import { HashtagsTab } from '../components/HashtagsTab';
import { TrendingHashtags } from '../components/TrendingHashtags';

const MIN_QUERY_LENGTH = 2;      // matches backend `q.length < 2 → empty`
const DEBOUNCE_MS = 300;         // matches web's SearchInput

export function SearchScreen() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [tab, setTab] = useState<SearchTab>('posts');

  // Debounce the query. Only fires the search queries when the user has paused typing for 300ms — avoids one request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const hasQuery = debouncedQuery.length >= MIN_QUERY_LENGTH;

  return (
    <Screen scrollable={false}>
      {/* Search input — sticky at top */}
      <View className="px-3 py-2 border-b border-border bg-background">
        <SearchBar value={query} onChange={setQuery} />
      </View>

      {hasQuery ? (
        <>
          <SearchTabs value={tab} onChange={setTab} />
          <View className="flex-1">
            {tab === 'posts'    && <PostsTab    query={debouncedQuery} />}
            {tab === 'people'   && <PeopleTab   query={debouncedQuery} />}
            {tab === 'hashtags' && <HashtagsTab query={debouncedQuery} />}
          </View>
        </>
      ) : (
        <TrendingHashtags />
      )}
    </Screen>
  );
}
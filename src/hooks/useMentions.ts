import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';

export type MentionUser = {
  id: string;
  name: string;
  image?: string | null;
};

export type TaggedUser = { id: string; name: string };

export function useMentions() {
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);
  const [taggedUsers, setTaggedUsers] = useState<TaggedUser[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards against out-of-order responses when typing fast.
  const requestIdRef = useRef(0);

  // Called on every keystroke — detects a trailing "@word" and searches.
  const handleMentionSearch = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Unicode-aware — matches the same charset renderWithTags accepts.
    const match = value.match(/@([\p{L}0-9_]+)$/u);
    if (!match) { setMentionResults([]); return; }

    const requestId = ++requestIdRef.current;

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get<MentionUser[]>('/users/search', { params: { q: match[1] }, });
        // Discard stale responses — user may have typed more while waiting.
        if (requestId !== requestIdRef.current) return;
        setMentionResults(res.data ?? []);
      } catch {
        if (requestId === requestIdRef.current) setMentionResults([]);
      }
    }, 300);
  };

  // Cleanup debounce timer on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Replace trailing "@word" with "@name " and register the user for backend tagging.
  const insertMention = (user: MentionUser, currentValue: string, setValue: (val: string) => void, ) => {
    const newValue = currentValue.replace(/@([\p{L}0-9_]+)$/u, `@${user.name} `);
    setValue(newValue);
    setTaggedUsers((prev) => prev.some((u) => u.id === user.id) ? prev : [...prev, { id: user.id, name: user.name }] );
    setMentionResults([]);
  };

  // Call after a successful submit.
  const resetMentions = () => {
    setTaggedUsers([]);
    setMentionResults([]);
  };

  return {
    mentionResults,
    taggedUsers,
    setTaggedUsers,   // exported so edit forms can seed from extractMentionDetails()
    handleMentionSearch,
    insertMention,
    resetMentions,
  };
}
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';

const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;
const COMBINED_REGEX = /(@\[([^\]]+)\]\(([^)]+)\))|#([\p{L}\p{N}_]+)/gu;

// Renders post/comment content with tappable @mentions and #hashtags.
// Output is ReactNode[] meant to sit inside a parent <Text>: <Text className="text-sm">{renderWithTags(post.content)}</Text>
export function renderWithTags(text: string | null | undefined): React.ReactNode[] {
  if (!text) return [];

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Global regex keeps state — reset .lastIndex before each loop.
  COMBINED_REGEX.lastIndex = 0;

  while ((match = COMBINED_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      const name = match[2];
      const userId = match[3];
      parts.push(
        <Text key={`m-${userId}-${match.index}`} className="text-primary font-medium"
          onPress={() => router.push({ pathname: '/users/[id]', params: { id: userId } })}
        >
          @{name}
        </Text>,
      );
    } else if (match[4]) {
      const tag = match[4];
      parts.push(
        <Text
          key={`h-${tag}-${match.index}`} className="text-indigo-600 dark:text-indigo-400 font-medium"
          onPress={() => router.push({ pathname: '/hashtags/[tag]', params: { tag: tag.toLowerCase() } }) }
        >
          #{tag}
        </Text>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

// Stored format @[name](id) → plain "@name" — used to seed edit forms.
export function formatMentionsForEditing(text: string | null | undefined): string {
  return text?.replace(MENTION_REGEX, '@$1') ?? '';
}

// Extract mentioned users from stored content — used to rebuild taggedUsers state when opening the edit form.
export function extractMentionDetails(
  text: string | null | undefined,
): { id: string; name: string }[] {
  if (!text) return [];
  const out: { id: string; name: string }[] = [];
  const regex = new RegExp(MENTION_REGEX.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    out.push({ name: match[1], id: match[2] });
  }
  return out;
}

// Plain "@name" → stored "@[name](id)". Uses unicode-safe lookahead so "@john" doesn't clobber "@johnny", and works with names ending in non-ASCII characters (e.g. Arabic "عمر").
export function formatMentionsForStorage(
  content: string,
  taggedUsers: { id: string; name: string }[],
): string {
  let result = content;
  for (const { id, name } of taggedUsers) {
    const clean = name.trim();
    const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // (?![...]) = negative lookahead. Fails to match if a word character follows,
    // so "@john" won't match inside "@johnny". Unicode-safe for non-ASCII names.
    const regex = new RegExp(`@${escaped}(?![\\p{L}\\p{N}_])`, 'gu');
    result = result.replace(regex, `@[${clean}](${id})`);
  }
  return result;
}

// Extract unique lowercase hashtags — used by PostForm to send hashtags[] to the backend without tracking them separately in form state.
export function extractHashtags(text: string): string[] {
  const tags: string[] = [];
  const regex = /#([\p{L}\p{N}_]+)/gu;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    tags.push(match[1].toLowerCase());
  }
  return Array.from(new Set(tags));
}
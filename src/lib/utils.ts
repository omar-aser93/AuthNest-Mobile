import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// "cn" function to merge classNames
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


// Verbose form — "2 hours ago". Used in PostDetail, Comments list.
export function formatTimeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  const intervals: Record<string, number> = {
    year: 31_536_000, month: 2_592_000, week: 604_800,
    day: 86_400, hour: 3_600, minute: 60,
  };
  for (const key in intervals) {
    const v = Math.floor(seconds / intervals[key]);
    if (v > 1) return `${v} ${key}s ago`;
    if (v === 1) return `1 ${key} ago`;
  }
  return 'Just now';
}

// Short form — "2h", "3d". Used in PostCard header.
export function formatTimeAgoShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(days / 365)}y`;
}
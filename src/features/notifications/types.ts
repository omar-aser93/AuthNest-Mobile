import type { ReactionType } from '@/features/reactions/types';

export type NotificationType =
  | 'REACTION' | 'COMMENT' | 'REPLY' | 'SHARE' | 'TAG'
  | 'FRIEND_REQUEST' | 'FRIEND_REQUEST_ACCEPT';

export type NotificationUser = {
  id: string;
  name: string;
  image: string | null;
};

export type Notification = {
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  reactionType?: ReactionType | null;

  sender?: NotificationUser | null;
  post?: { id: string; title: string | null } | null;
  comment?: { id: string; content: string } | null;
  share?: { id: string; message: string | null } | null;
  request?: {
    id: string;
    requester: NotificationUser;
    receiver: NotificationUser;
  } | null;
  tag?: {
    id: string;
    post?: { id: string; title: string | null } | null;
    comment?: { id: string } | null;
    taggedBy: NotificationUser;
  } | null;
};

export type NotificationsPage = {
  notifications: Notification[];
  nextCursor: string | null;
};
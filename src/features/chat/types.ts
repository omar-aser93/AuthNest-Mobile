import { ReactionType } from "../reactions/types";

export type MessageUser = { id: string; name: string; image: string | null };

export type MessageAttachment = {
  id: string;
  url: string;
  publicId: string;
  fileType: string;   // 'image' | 'video' | 'audio' | 'application' | ...
  fileName: string;
  fileSize: number;
};

export type MessageRead = { userId: string; readAt: string; user: MessageUser };
export type MessageReaction = { id: string; type: string; userId: string; user: MessageUser };

export type Message = {
  id: string;
  content: string | null;
  senderId: string;
  sender: MessageUser;
  conversationId: string;
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
  reactionSummary: Partial<Record<ReactionType, number>> | null;
  reactionCount: number;
  reads: MessageRead[];
  tags: { tagged: MessageUser }[];
  editHistory: { id: string }[];
  createdAt: string;
  updatedAt: string;
};

export type ConversationParticipant = {
  userId: string;
  user: MessageUser;
};

export type ConversationPreview = {
  id: string;
  isGroup: boolean;
  name: string | null;
  lastMessageAt: string | null;
  participants: ConversationParticipant[];
  messages: {
    content: string | null;
    sender: { id: string; name: string };
    attachments: { fileType: string; fileName: string }[];
  }[];
};

export type Conversation = {
  id: string;
  isGroup: boolean;
  name: string | null;
  participants: ConversationParticipant[];
};

export type MessagesPage = { messages: Message[]; nextCursor: string | null };
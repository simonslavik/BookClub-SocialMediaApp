// ─── Domain types ────────────────────────────────────────

export interface RawServerMessage {
  id: string;
  username: string;
  profileImage: string | null;
  content: string;
  createdAt: string;
  userId: string;
  isPinned?: boolean;
  isSystem?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  editedAt?: string | null;
  replyToId?: string | null;
  replyTo?: unknown;
  attachments?: unknown[];
  reactions?: unknown[];
}

export interface ChatMessage {
  id: string;
  type?: 'system';
  username: string;
  profileImage: string | null;
  text: string;
  timestamp: string;
  userId: string;
  isPinned: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
  editedAt: string | null;
  replyToId: string | null;
  replyTo: unknown;
  attachments: unknown[];
  reactions: unknown[];
}

export interface ConnectedUser {
  id: string;
  name?: string;
  username?: string;
  profileImage?: string | null;
}

// ─── Server → Client (discriminated union) ───────────────

export type ServerMessage =
  | {
      type: 'init';
      messages: RawServerMessage[];
      hasMore?: boolean;
      users?: ConnectedUser[];
      members?: ConnectedUser[];
      unreadRoomIds?: string[];
      lastReadAt?: string | null;
      unreadSections?: string[];
      bookClub?: { rooms?: unknown[] };
      userRole?: string | null;
    }
  | { type: 'chat-message'; message: RawServerMessage }
  | { type: 'user-joined'; user: ConnectedUser; members?: ConnectedUser[] }
  | { type: 'user-left'; userId: string }
  | {
      type: 'room-switched';
      messages: RawServerMessage[];
      hasMore?: boolean;
      lastReadAt?: string | null;
      roomId?: string;
    }
  | { type: 'reaction-updated'; messageId: string; reactions: unknown[] }
  | { type: 'older-messages'; messages: RawServerMessage[]; hasMore?: boolean }
  | {
      type: 'message-edited';
      messageId: string;
      content: string;
      editedAt: string;
    }
  | { type: 'error'; message: string }
  | { type: 'room-activity'; roomId: string }
  | { type: 'section-activity'; section: string }
  | { type: 'typing'; username: string; userId: string };

// ─── Client → Server ─────────────────────────────────────

export type ClientMessage =
  | {
      type: 'join';
      bookClubId: string;
      userId: string;
      username: string;
      profileImage: string | null;
      roomId: string;
      token: string;
    }
  | {
      type: 'switch-room';
      roomId: string;
      userId: string;
      username: string;
    }
  | { type: 'typing' }
  | { type: 'view-section'; section: string }
  | { type: 'section-activity'; section: string }
  | { type: 'load-older-messages'; before: string; limit: number };

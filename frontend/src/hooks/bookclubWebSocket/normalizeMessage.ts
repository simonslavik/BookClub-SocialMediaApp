import type { ChatMessage, RawServerMessage } from './types';

export const normalizeMessage = (msg: RawServerMessage): ChatMessage => ({
  id: msg.id,
  ...(msg.isSystem ? { type: 'system' as const } : {}),
  username: msg.username,
  profileImage: msg.profileImage,
  text: msg.isSystem ? `${msg.username} ${msg.content}` : msg.content,
  timestamp: msg.createdAt,
  userId: msg.userId,
  isPinned: msg.isPinned ?? false,
  deletedAt: msg.deletedAt ?? null,
  deletedBy: msg.deletedBy ?? null,
  editedAt: msg.editedAt ?? null,
  replyToId: msg.replyToId ?? null,
  replyTo: msg.replyTo ?? null,
  attachments: msg.attachments ?? [],
  reactions: msg.reactions ?? [],
});

import type { ChatMessage, ServerMessage } from './types';
import { normalizeMessage } from './normalizeMessage';

/**
 * Pure transformation: given the current chat-message list and an incoming
 * server event, return the new list. Events that don't affect messages
 * leave the array unchanged (referential equality preserved).
 */
export const applyServerMessageToMessages = (
  messages: ChatMessage[],
  event: ServerMessage,
): ChatMessage[] => {
  switch (event.type) {
    case 'init':
    case 'room-switched':
      return event.messages.map(normalizeMessage);

    case 'chat-message':
      return [...messages, normalizeMessage(event.message)];

    case 'older-messages':
      if (!event.messages || event.messages.length === 0) return messages;
      return [...event.messages.map(normalizeMessage), ...messages];

    case 'reaction-updated':
      return messages.map((m) =>
        m.id === event.messageId ? { ...m, reactions: event.reactions } : m,
      );

    case 'message-edited':
      return messages.map((m) =>
        m.id === event.messageId
          ? { ...m, text: event.content, editedAt: event.editedAt }
          : m,
      );

    default:
      return messages;
  }
};

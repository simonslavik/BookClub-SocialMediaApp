import { describe, it, expect } from 'vitest';
import { applyServerMessageToMessages } from '../messageReducer';
import type { ChatMessage, RawServerMessage, ServerMessage } from '../types';

const raw = (overrides: Partial<RawServerMessage> = {}): RawServerMessage => ({
  id: 'm1',
  username: 'alice',
  profileImage: null,
  content: 'hello',
  createdAt: '2024-01-01T00:00:00Z',
  userId: 'u1',
  ...overrides,
});

const normalized = (id: string, text = 'hello'): ChatMessage => ({
  id,
  username: 'alice',
  profileImage: null,
  text,
  timestamp: '2024-01-01T00:00:00Z',
  userId: 'u1',
  isPinned: false,
  deletedAt: null,
  deletedBy: null,
  editedAt: null,
  replyToId: null,
  replyTo: null,
  attachments: [],
  reactions: [],
});

describe('applyServerMessageToMessages', () => {
  it('init replaces the entire list with normalized messages', () => {
    const event: ServerMessage = {
      type: 'init',
      messages: [raw({ id: 'a' }), raw({ id: 'b' })],
    };
    const result = applyServerMessageToMessages([normalized('old')], event);

    expect(result).toHaveLength(2);
    expect(result.map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('chat-message appends a normalized message', () => {
    const event: ServerMessage = { type: 'chat-message', message: raw({ id: 'new' }) };
    const result = applyServerMessageToMessages([normalized('a')], event);

    expect(result).toHaveLength(2);
    expect(result[1].id).toBe('new');
  });

  it('older-messages prepends normalized messages', () => {
    const event: ServerMessage = {
      type: 'older-messages',
      messages: [raw({ id: 'old1' }), raw({ id: 'old2' })],
    };
    const result = applyServerMessageToMessages([normalized('current')], event);

    expect(result.map((m) => m.id)).toEqual(['old1', 'old2', 'current']);
  });

  it('older-messages with empty array preserves identity (no-op)', () => {
    const current = [normalized('a')];
    const event: ServerMessage = { type: 'older-messages', messages: [] };
    const result = applyServerMessageToMessages(current, event);

    expect(result).toBe(current); // referential equality
  });

  it('reaction-updated patches reactions on the matching message', () => {
    const current: ChatMessage[] = [normalized('a'), normalized('b')];
    const event: ServerMessage = {
      type: 'reaction-updated',
      messageId: 'b',
      reactions: [{ emoji: '👍', count: 3 }],
    };
    const result = applyServerMessageToMessages(current, event);

    expect(result[0].reactions).toEqual([]);
    expect(result[1].reactions).toEqual([{ emoji: '👍', count: 3 }]);
  });

  it('message-edited updates text and editedAt only on the matching message', () => {
    const current: ChatMessage[] = [normalized('a', 'original'), normalized('b', 'b-text')];
    const event: ServerMessage = {
      type: 'message-edited',
      messageId: 'a',
      content: 'edited',
      editedAt: '2024-02-01T00:00:00Z',
    };
    const result = applyServerMessageToMessages(current, event);

    expect(result[0].text).toBe('edited');
    expect(result[0].editedAt).toBe('2024-02-01T00:00:00Z');
    expect(result[1].text).toBe('b-text');
  });

  it('events that do not affect messages preserve identity', () => {
    const current = [normalized('a')];
    const events: ServerMessage[] = [
      { type: 'user-joined', user: { id: 'u2' } },
      { type: 'user-left', userId: 'u2' },
      { type: 'typing', username: 'bob', userId: 'u2' },
      { type: 'error', message: 'boom' },
      { type: 'room-activity', roomId: 'r1' },
      { type: 'section-activity', section: 'books' },
    ];
    for (const event of events) {
      expect(applyServerMessageToMessages(current, event)).toBe(current);
    }
  });

  it('normalizes isSystem messages with prefixed text', () => {
    const event: ServerMessage = {
      type: 'chat-message',
      message: raw({ id: 'sys', isSystem: true, content: 'joined the room' }),
    };
    const result = applyServerMessageToMessages([], event);

    expect(result[0].type).toBe('system');
    expect(result[0].text).toBe('alice joined the room');
  });

  it('room-switched replaces the list', () => {
    const event: ServerMessage = {
      type: 'room-switched',
      messages: [raw({ id: 'r1m1' })],
    };
    const result = applyServerMessageToMessages([normalized('old')], event);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r1m1');
  });
});

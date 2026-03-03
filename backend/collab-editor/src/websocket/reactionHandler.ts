import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { Client, activeBookClubs, broadcastToBookClub } from './types.js';

// Allowed emoji set for reactions (common emojis)
const ALLOWED_EMOJIS = new Set([
  '👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🔥',
  '🎉', '👏', '🤔', '💯', '✅', '❌', '👀', '🙌',
  '💪', '🤝', '📚', '⭐',
]);

const MAX_REACTIONS_PER_MESSAGE = 50;

interface ReactionSummary {
  emoji: string;
  count: number;
  userIds: string[];
}

/**
 * Get grouped reaction summaries for a list of message IDs.
 * Returns a map of messageId -> ReactionSummary[]
 */
export async function getReactionsForMessages(
  messageIds: string[]
): Promise<Map<string, ReactionSummary[]>> {
  const result = new Map<string, ReactionSummary[]>();

  if (messageIds.length === 0) return result;

  const reactions = await prisma.reaction.findMany({
    where: { messageId: { in: messageIds } },
    select: {
      messageId: true,
      userId: true,
      emoji: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by messageId -> emoji -> userIds
  const grouped = new Map<string, Map<string, string[]>>();
  for (const r of reactions) {
    if (!grouped.has(r.messageId)) {
      grouped.set(r.messageId, new Map());
    }
    const emojiMap = grouped.get(r.messageId)!;
    if (!emojiMap.has(r.emoji)) {
      emojiMap.set(r.emoji, []);
    }
    emojiMap.get(r.emoji)!.push(r.userId);
  }

  // Convert to ReactionSummary[]
  for (const [messageId, emojiMap] of grouped) {
    const summaries: ReactionSummary[] = [];
    for (const [emoji, userIds] of emojiMap) {
      summaries.push({ emoji, count: userIds.length, userIds });
    }
    result.set(messageId, summaries);
  }

  return result;
}

/**
 * Get reaction summary for a single message
 */
async function getReactionSummaryForMessage(
  messageId: string
): Promise<ReactionSummary[]> {
  const map = await getReactionsForMessages([messageId]);
  return map.get(messageId) || [];
}

/**
 * Handle adding a reaction to a message
 */
export async function handleAddReaction(
  client: Client,
  data: { messageId: string; emoji: string }
): Promise<void> {
  const { messageId, emoji } = data;

  if (!client.bookClubId || !client.roomId) {
    client.ws.send(JSON.stringify({ type: 'error', message: 'Not in a room' }));
    return;
  }

  if (!messageId || !emoji) {
    client.ws.send(JSON.stringify({ type: 'error', message: 'Missing messageId or emoji' }));
    return;
  }

  if (!ALLOWED_EMOJIS.has(emoji)) {
    client.ws.send(JSON.stringify({ type: 'error', message: 'Emoji not allowed' }));
    return;
  }

  try {
    // Verify the message exists and belongs to the same book club room
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        roomId: client.roomId,
        deletedAt: null,
      },
    });

    if (!message) {
      client.ws.send(JSON.stringify({ type: 'error', message: 'Message not found' }));
      return;
    }

    // Check max reactions per message
    const reactionCount = await prisma.reaction.count({
      where: { messageId },
    });

    if (reactionCount >= MAX_REACTIONS_PER_MESSAGE) {
      client.ws.send(JSON.stringify({ type: 'error', message: 'Maximum reactions reached for this message' }));
      return;
    }

    // One reaction per user per message: remove any existing reaction first
    await prisma.reaction.deleteMany({
      where: {
        messageId,
        userId: client.userId,
      },
    });

    // Create the new reaction
    await prisma.reaction.create({
      data: {
        messageId,
        userId: client.userId,
        emoji,
      },
    });

    // Get updated reaction summary for this message
    const reactions = await getReactionSummaryForMessage(messageId);

    // Broadcast to all clients in the same room
    const activeClub = activeBookClubs.get(client.bookClubId);
    if (activeClub) {
      broadcastToBookClub(activeClub, {
        type: 'reaction-updated',
        messageId,
        reactions,
      });
    }

    logger.info('Reaction added', {
      userId: client.userId,
      messageId,
      emoji,
      bookClubId: client.bookClubId,
    });
  } catch (error) {
    logger.error('Error adding reaction:', error);
    client.ws.send(JSON.stringify({ type: 'error', message: 'Failed to add reaction' }));
  }
}

/**
 * Handle removing a reaction from a message
 */
export async function handleRemoveReaction(
  client: Client,
  data: { messageId: string; emoji: string }
): Promise<void> {
  const { messageId, emoji } = data;

  if (!client.bookClubId || !client.roomId) {
    client.ws.send(JSON.stringify({ type: 'error', message: 'Not in a room' }));
    return;
  }

  if (!messageId || !emoji) {
    client.ws.send(JSON.stringify({ type: 'error', message: 'Missing messageId or emoji' }));
    return;
  }

  try {
    // Delete the reaction (will silently succeed if it doesn't exist)
    await prisma.reaction.deleteMany({
      where: {
        messageId,
        userId: client.userId,
        emoji,
      },
    });

    // Get updated reaction summary for this message
    const reactions = await getReactionSummaryForMessage(messageId);

    // Broadcast to all clients in the same room
    const activeClub = activeBookClubs.get(client.bookClubId);
    if (activeClub) {
      broadcastToBookClub(activeClub, {
        type: 'reaction-updated',
        messageId,
        reactions,
      });
    }

    logger.info('Reaction removed', {
      userId: client.userId,
      messageId,
      emoji,
      bookClubId: client.bookClubId,
    });
  } catch (error) {
    logger.error('Error removing reaction:', error);
    client.ws.send(JSON.stringify({ type: 'error', message: 'Failed to remove reaction' }));
  }
}

/**
 * Mention Parser Utility
 * 
 * Mention format in stored messages: <@userId> or <@everyone>
 * These tokens are stored in the database as part of the message content.
 * The frontend handles converting between display names and stored tokens.
 */

export interface MentionData {
  userId: string;
  username?: string;
}

/**
 * Extract all mentioned user IDs from a message content string.
 * Looks for patterns like <@userId> (but not <@everyone>).
 */
export const extractMentions = (content: string): string[] => {
  if (!content) return [];
  
  const mentionRegex = /<@([a-zA-Z0-9_-]+)>/g;
  const userIds: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    const id = match[1];
    if (id !== 'everyone' && !userIds.includes(id)) {
      userIds.push(id);
    }
  }
  
  return userIds;
};

/**
 * Check if a specific user is mentioned in a message.
 */
export const isUserMentioned = (content: string, userId: string): boolean => {
  if (!content || !userId) return false;
  return content.includes(`<@${userId}>`) || content.includes('<@everyone>');
};

/**
 * Check if @everyone is mentioned in a message.
 */
export const isEveryoneMentioned = (content: string): boolean => {
  if (!content) return false;
  return content.includes('<@everyone>');
};

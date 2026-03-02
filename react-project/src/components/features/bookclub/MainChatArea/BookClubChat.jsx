import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FiHash } from 'react-icons/fi';
import { messageModerationAPI } from '@api/messageModeration.api';
import logger from '@utils/logger';
import { useConfirm, useToast } from '@hooks/useUIFeedback';
import OwnMessage from '../chat/OwnMessage';
import OtherMessage from '../chat/OtherMessage';
import { shouldGroupMessages } from '../chat/messageUtils';

const BookClubChat = ({ messages, setMessages, currentRoom, auth, userRole, ws, members = [], onReply, friends = [], onSendFriendRequest, connectedUsers = [], lastReadAt, hasMoreMessages = false, loadingOlder = false, onLoadOlder }) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const editInputRef = useRef(null);
  const menuRef = useRef(null);

  const [messageMenuId, setMessageMenuId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const { confirm } = useConfirm();
  const { toastError } = useToast();

  const canModerate = userRole && ['OWNER', 'ADMIN', 'MODERATOR'].includes(userRole);
  const currentUserId = auth?.user?.id;
  const prevMessageCountRef = useRef(messages.length);
  const isLoadingOlderRef = useRef(false);

  // ── Scroll only on NEW messages (not when prepending older ones) ──
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && !isLoadingOlderRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }
    isLoadingOlderRef.current = false;
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  // ── Scroll-to-top detection for loading older messages ──
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop < 100 && hasMoreMessages && !loadingOlder) {
        isLoadingOlderRef.current = true;
        // Save scroll state to restore position after prepend
        const prevScrollHeight = container.scrollHeight;
        const prevScrollTop = container.scrollTop;

        // Wait for messages to be prepended, then restore scroll position
        const observer = new MutationObserver(() => {
          observer.disconnect();
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
        });
        observer.observe(container, { childList: true, subtree: true });

        onLoadOlder?.();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMoreMessages, loadingOlder, onLoadOlder]);

  // ── Close menu on outside click ─────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMessageMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Helpers ─────────────────────────────────────────────
  const sendWs = useCallback((payload) => {
    if (ws?.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload));
    }
  }, [ws]);

  const getUserReactionEmoji = useCallback((reactions) => {
    if (!reactions || !currentUserId) return null;
    for (const r of reactions) {
      if (r.userIds.includes(currentUserId)) return r.emoji;
    }
    return null;
  }, [currentUserId]);

  const scrollToMessage = useCallback((messageId) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-purple-500', 'ring-opacity-75');
      setTimeout(() => el.classList.remove('ring-2', 'ring-purple-500', 'ring-opacity-75'), 2000);
    }
  }, []);

  // ── Actions ─────────────────────────────────────────────
  const toggleMenu = useCallback((messageId, event) => {
    event.stopPropagation();
    setMessageMenuId((prev) => (prev === messageId ? null : messageId));
  }, []);

  const handleToggleReaction = useCallback((messageId, emoji, hasReacted) => {
    sendWs({ type: hasReacted ? 'remove-reaction' : 'add-reaction', messageId, emoji });
  }, [sendWs]);

  const handleDelete = useCallback(async (messageId) => {
    setMessageMenuId(null);
    const ok = await confirm('Are you sure you want to delete this message?', { title: 'Delete Message', variant: 'danger', confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      sendWs({ type: 'delete-message', messageId });
      await messageModerationAPI.deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, text: '[Message deleted]', deletedAt: new Date().toISOString(), attachments: [], isPinned: false, reactions: [] }
            : m
        )
      );
    } catch (err) {
      logger.error('Error deleting message:', err);
      toastError('Failed to delete message');
    }
  }, [sendWs, setMessages, confirm, toastError]);

  const handlePin = useCallback(async (messageId, isPinned) => {
    setMessageMenuId(null);
    try {
      sendWs({ type: 'pin-message', messageId, isPinned: !isPinned });
      if (isPinned) await messageModerationAPI.unpinMessage(messageId);
      else await messageModerationAPI.pinMessage(messageId);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isPinned: !isPinned } : m)));
    } catch (err) {
      logger.error('Error pinning message:', err);
      toastError('Failed to pin message');
    }
  }, [sendWs, setMessages, toastError]);

  const handleCopy = useCallback(async (messageId, text) => {
    setMessageMenuId(null);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      logger.error('Error copying message:', err);
    }
  }, []);

  const handleReply = useCallback((msg) => {
    setMessageMenuId(null);
    onReply?.({ id: msg.id, text: msg.text, username: msg.username, userId: msg.userId });
  }, [onReply]);

  // ── Editing ─────────────────────────────────────────────
  const startEdit = useCallback((msg) => {
    setMessageMenuId(null);
    setEditingMessageId(msg.id);
    setEditingText(msg.text || '');
    setTimeout(() => editInputRef.current?.focus(), 50);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingText('');
  }, []);

  const saveEdit = useCallback(async (messageId) => {
    const trimmed = editingText.trim();
    if (!trimmed) return;
    try {
      sendWs({ type: 'edit-message', messageId, content: trimmed });
      await messageModerationAPI.editMessage(messageId, trimmed);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, text: trimmed, editedAt: new Date().toISOString() } : m))
      );
      setEditingMessageId(null);
      setEditingText('');
    } catch (err) {
      logger.error('Error editing message:', err);
      toastError('Failed to edit message');
    }
  }, [editingText, sendWs, setMessages, toastError]);

  const handleEditKeyDown = useCallback((e, messageId) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(messageId); }
    else if (e.key === 'Escape') cancelEdit();
  }, [saveEdit, cancelEdit]);

  // ── Shared props for message components ─────────────────
  const actionProps = {
    auth, members, canModerate, copiedMessageId, menuRef,
    onToggleReaction: handleToggleReaction,
    onToggleMenu: toggleMenu,
    onPin: handlePin,
    onEdit: startEdit,
    onCopy: handleCopy,
    onReply: handleReply,
    onDelete: handleDelete,
    onScrollToMessage: scrollToMessage,
    getUserReactionEmoji,
    friends,
    onSendFriendRequest,
    connectedUsers,
  };

  // ── Compute the index where the NEW divider should appear ──
  const newDividerIndex = React.useMemo(() => {
    if (!lastReadAt || !currentUserId) {
      return -1;
    }
    const cutoff = new Date(lastReadAt);

    // Check if there are ANY messages from other users after lastReadAt
    const hasOtherUnread = messages.some(
      msg => msg.type !== 'system' && msg.userId !== currentUserId && new Date(msg.timestamp) > cutoff
    );
    if (!hasOtherUnread) {
      return -1;
    }

    // Find the first message from another user that's newer than lastReadAt
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.type === 'system') continue;
      if (msg.userId === currentUserId) continue;
      if (new Date(msg.timestamp) > cutoff) {
        return i;
      }
    }
    return -1;
  }, [lastReadAt, messages, currentUserId]);

  // ── Render ──────────────────────────────────────────────
  return (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-1 space-y-1">
      {loadingOlder && (
        <div className="flex justify-center py-3">
          <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          <FiHash className="mx-auto text-4xl mb-2 opacity-30" />
          <p className="text-sm">Welcome to #{currentRoom?.name}</p>
          <p className="text-xs mt-1">Start a conversation!</p>
        </div>
      ) : (
        messages.map((msg, idx) => {
          const prev = idx > 0 ? messages[idx - 1] : null;
          const next = idx < messages.length - 1 ? messages[idx + 1] : null;
          const { groupWithPrevious, isLastInGroup } = shouldGroupMessages(msg, prev, next);
          const showNewDivider = idx === newDividerIndex;

          return (
            <React.Fragment key={msg.id || idx}>
              {showNewDivider && (
                <div className="flex items-center gap-2 py-1 px-4">
                  <div className="flex-1 h-px bg-red-500" />
                  <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">New</span>
                  <div className="flex-1 h-px bg-red-500" />
                </div>
              )}
              <div
                id={`msg-${msg.id}`}
                className={`flex flex-col ${msg.userId === currentUserId ? 'items-end' : 'items-start'} ${groupWithPrevious ? 'mt-1' : 'mt-1'} transition-all duration-300 rounded-lg`}
              >
              {msg.type === 'system' ? (
                <div className="flex items-center justify-center gap-2 py-1 w-full">
                  <div className="flex-1 h-px bg-gray-700/30" />
                  <span className="text-xs text-gray-400 italic whitespace-nowrap">
                    {msg.text}
                  </span>
                  <div className="flex-1 h-px bg-gray-700/30" />
                </div>
              ) : msg.userId === currentUserId ? (
                <OwnMessage
                  msg={msg}
                  isLastInGroup={isLastInGroup}
                  isMenuOpen={messageMenuId === msg.id}
                  editingMessageId={editingMessageId}
                  editingText={editingText}
                  setEditingText={setEditingText}
                  editInputRef={editInputRef}
                  onEditKeyDown={handleEditKeyDown}
                  onEditSave={saveEdit}
                  onCancelEdit={cancelEdit}
                  {...actionProps}
                />
              ) : (
                <OtherMessage
                  msg={msg}
                  isLastInGroup={isLastInGroup}
                  isMenuOpen={messageMenuId === msg.id}
                  {...actionProps}
                />
              )}
              </div>
            </React.Fragment>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default BookClubChat;

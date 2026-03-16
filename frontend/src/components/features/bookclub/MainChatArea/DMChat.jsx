import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiSend, FiCornerUpLeft, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../../../common/FileUpload';
import MessageAttachment from '../../../common/MessageAttachment';
import MessageActions from '../chat/MessageActions';
import ReactionBar from '../chat/ReactionBar';
import { linkifyText } from '../chat/messageUtils';
import apiClient from '@api/axios';
import { getProfileImageUrl } from '@config/constants';
import logger from '@utils/logger';
import { useConfirm, useToast } from '@hooks/useUIFeedback';

const DMChat = ({ otherUser, messages, onSendMessage, auth, setMessages, dmWs, replyingTo, setReplyingTo, hasMoreMessages = false, loadingOlder = false, onLoadOlder }) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [messageMenuId, setMessageMenuId] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileUploadRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const prevMessageCountRef = useRef(messages.length);
  const isLoadingOlderRef = useRef(false);
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { toastError } = useToast();

  const currentUserId = auth?.user?.id;
  const dmMembers = [
    { id: currentUserId, name: auth?.user?.name || 'You' },
    ...(otherUser ? [{ id: otherUser.id, name: otherUser.name }] : [])
  ];

  // Helper function to check if messages should be grouped
  const shouldGroupMessages = (currentMsg, previousMsg, nextMsg) => {
    if (!previousMsg || !currentMsg) return { groupWithPrevious: false, isLastInGroup: true };
    
    // Check if from same user
    if (currentMsg.senderId !== previousMsg.senderId) {
      return { groupWithPrevious: false, isLastInGroup: !nextMsg || nextMsg.senderId !== currentMsg.senderId };
    }
    
    // Check time difference (5 minutes = 300000 milliseconds)
    const currentTime = new Date(currentMsg.createdAt).getTime();
    const previousTime = new Date(previousMsg.createdAt).getTime();
    const timeDiff = currentTime - previousTime;
    
    const groupWithPrevious = timeDiff <= 300000; // 5 minutes
    
    // Check if this is the last message in the group
    let isLastInGroup = true;
    if (nextMsg && nextMsg.senderId === currentMsg.senderId) {
      const nextTime = new Date(nextMsg.createdAt).getTime();
      const nextTimeDiff = nextTime - currentTime;
      isLastInGroup = nextTimeDiff > 300000;
    }
    
    return { groupWithPrevious, isLastInGroup };
  };

  // Scroll only on new messages (not when prepending older ones)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && !isLoadingOlderRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }
    isLoadingOlderRef.current = false;
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (otherUser) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [otherUser]);

  // Scroll-to-top detection for loading older messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop < 100 && hasMoreMessages && !loadingOlder) {
        isLoadingOlderRef.current = true;
        const prevScrollHeight = container.scrollHeight;
        const prevScrollTop = container.scrollTop;

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMessageMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Helpers ─────────────────────────────────────────────
  const sendWs = useCallback((payload) => {
    if (dmWs?.current?.readyState === WebSocket.OPEN) {
      dmWs.current.send(JSON.stringify(payload));
    }
  }, [dmWs]);

  const getUserReactionEmoji = useCallback((reactions) => {
    if (!reactions || !currentUserId) return null;
    for (const r of reactions) {
      if (r.userIds && r.userIds.includes(currentUserId)) return r.emoji;
    }
    return null;
  }, [currentUserId]);

  const scrollToMessage = useCallback((messageId) => {
    const el = document.getElementById(`dm-msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-stone-500', 'ring-opacity-75');
      setTimeout(() => el.classList.remove('ring-2', 'ring-stone-500', 'ring-opacity-75'), 2000);
    }
  }, []);

  // ── Actions ─────────────────────────────────────────────
  const toggleMenu = useCallback((messageId, event) => {
    event.stopPropagation();
    setMessageMenuId((prev) => (prev === messageId ? null : messageId));
  }, []);

  const handleToggleReaction = useCallback((messageId, emoji, hasReacted) => {
    sendWs({
      type: hasReacted ? 'dm-remove-reaction' : 'dm-add-reaction',
      messageId,
      emoji,
      receiverId: otherUser?.id,
    });
  }, [sendWs, otherUser?.id]);

  const handleDeleteMessage = useCallback(async (messageId) => {
    setMessageMenuId(null);
    const ok = await confirm('Are you sure you want to delete this message?', { title: 'Delete Message', variant: 'danger', confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      sendWs({ type: 'delete-dm-message', messageId, receiverId: otherUser?.id });
      await apiClient.delete(`/v1/messages/${messageId}`);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: '[Message deleted]', deletedAt: new Date().toISOString(), attachments: [] }
            : m
        )
      );
    } catch (error) {
      logger.error('Error deleting message:', error);
      toastError('Failed to delete message');
    }
  }, [sendWs, otherUser?.id, setMessages, confirm, toastError]);

  const handleCopy = useCallback(async (messageId, text) => {
    setMessageMenuId(null);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      logger.error('Error copying message:', error);
    }
  }, []);

  const handleReply = useCallback((msg) => {
    setMessageMenuId(null);
    if (setReplyingTo) {
      setReplyingTo({
        id: msg.id,
        content: msg.text || msg.content,
        senderName: msg.senderId === currentUserId ? 'You' : (otherUser?.name || 'Unknown'),
        senderId: msg.senderId,
      });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [setReplyingTo, currentUserId, otherUser?.name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const hasMessage = newMessage.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;
    
    if (!hasMessage && !hasFiles) return;
    
    setUploadingFiles(true);
    
    try {
      let uploadedAttachments = [];
      
      if (selectedFiles.length > 0) {
        uploadedAttachments = await fileUploadRef.current?.uploadFiles();
      }
      
      // Send text message first if we have both text and files
      if (hasMessage && uploadedAttachments.length > 0) {
        onSendMessage(newMessage.trim(), [], replyingTo?.id);
      }
      
      // Send each file as a separate message
      if (uploadedAttachments.length > 0) {
        for (const attachment of uploadedAttachments) {
          // Only include message text with single file if no text was sent already
          const messageText = uploadedAttachments.length === 1 && hasMessage ? newMessage.trim() : '';
          onSendMessage(messageText, [attachment]);
        }
      } else if (hasMessage) {
        // If only text, no files
        onSendMessage(newMessage.trim(), [], replyingTo?.id);
      }
      
      setNewMessage('');
      setSelectedFiles([]);
      if (setReplyingTo) setReplyingTo(null);
    } catch (error) {
      logger.error('Error sending DM:', error);
      toastError('Failed to send message');
    } finally {
      setUploadingFiles(false);
    }
  };

  if (!otherUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center text-gray-500">
          <p className="text-lg">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* DM Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-3">
        <img 
          src={getProfileImageUrl(otherUser.profileImage) || '/images/default.webp'}
          alt={otherUser.name}
          className="w-10 h-10 rounded-full object-cover cursor-pointer"
          onClick={() => navigate(`/profile/${otherUser.id}`)}
          onError={(e) => { e.target.src = '/images/default.webp'; }}
        />
        <div className="flex-1">
          <h2 
            className="text-white font-semibold cursor-pointer hover:underline"
            onClick={() => navigate(`/profile/${otherUser.id}`)}
          >
            {otherUser.name}
          </h2>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-900">
        {loadingOlder && (
          <div className="flex justify-center py-3">
            <div className="w-5 h-5 border-2 border-stone-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const previousMsg = idx > 0 ? messages[idx - 1] : null;
            const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
            const { groupWithPrevious, isLastInGroup } = shouldGroupMessages(msg, previousMsg, nextMsg);
            const isOwn = msg.senderId === auth?.user?.id;
            
            // Normalize msg for shared components (content → text)
            const normalizedMsg = { ...msg, text: msg.content };

            return (
            <div 
              key={msg.id || idx}
              id={`dm-msg-${msg.id}`}
              className={`flex gap-1 group ${
                isOwn ? 'justify-end' : 'justify-start'
              } ${groupWithPrevious ? 'mt-1' : 'mt-1'} transition-all duration-300 rounded-lg`}
            >
              <div className="flex flex-col max-w-xs lg:max-w-md">
                {/* Reply quote block */}
                {msg.replyTo && (
                  <div
                    onClick={() => scrollToMessage(msg.replyTo.id)}
                    className={`flex items-center ${isOwn ? 'justify-end' : 'justify-start'} gap-1 mb-0 cursor-pointer`}
                  >
                    <div className={`${isOwn ? 'bg-stone-950/40 border-stone-500' : 'bg-gray-700/50 border-stone-500'} border-l-2 rounded-r-lg px-3 py-1.5 max-w-[280px] hover:bg-stone-950/60 transition-colors`}>
                      <span className="text-xs text-stone-300 font-medium block">
                        {msg.replyTo.sender?.name || (msg.replyTo.senderId === currentUserId ? 'You' : otherUser?.name || 'Unknown')}
                      </span>
                      <span className="text-xs text-gray-400 truncate block">{msg.replyTo.content || '[attachment]'}</span>
                    </div>
                  </div>
                )}

                {/* Message bubble + attachments + actions wrapper */}
                <div className="relative">
                  {msg.content && (
                    <div className={`relative px-4 py-2 rounded-2xl break-words ${msg.deletedAt ? 'opacity-60' : ''} ${
                        isOwn ? 'bg-stone-700 text-white' : 'bg-gray-700 text-gray-200'
                    }`}>
                      <p className={`text-sm ${msg.deletedAt ? 'italic text-gray-300' : ''}`}>{linkifyText(msg.content)}</p>
                      {isLastInGroup && (
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      {copiedMessageId === msg.id && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                          Copied!
                        </div>
                      )}
                    </div>
                  )}
                  {msg.attachments?.length > 0 && !msg.deletedAt && (
                    <div className="flex flex-col gap-1 mt-1">
                      {msg.attachments.map((attachment, attIdx) => (
                        <MessageAttachment key={attIdx} attachment={attachment} isSender={isOwn} />
                      ))}
                    </div>
                  )}

                  {/* Floating actions (reaction picker + context menu) */}
                  <MessageActions
                    msg={normalizedMsg}
                    isOwn={isOwn}
                    canModerate={false}
                    currentUserEmoji={getUserReactionEmoji(msg.reactions)}
                    isMenuOpen={messageMenuId === msg.id}
                    menuRef={menuRef}
                    onToggleReaction={handleToggleReaction}
                    onToggleMenu={toggleMenu}
                    onCopy={handleCopy}
                    onReply={handleReply}
                    onDelete={handleDeleteMessage}
                    position={isOwn ? 'left' : 'right'}
                  />
                </div>

                {/* Reactions */}
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <ReactionBar
                    reactions={msg.reactions}
                    currentUserId={currentUserId}
                    onToggleReaction={(emoji, hasReacted) => handleToggleReaction(msg.id, emoji, hasReacted)}
                    members={dmMembers}
                    isOwn={isOwn}
                  />
                </div>
              </div>
            </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="bg-gray-800 border-t border-gray-700 p-4">
        {/* Reply preview bar */}
        {replyingTo && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-gray-700/60 border-l-2 border-stone-500 rounded-r-lg">
            <FiCornerUpLeft className="w-4 h-4 text-stone-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-stone-300 font-medium">{replyingTo.senderName}</span>
              <p className="text-xs text-gray-400 truncate">{replyingTo.content || '[attachment]'}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-1 rounded hover:bg-gray-600 text-gray-400 hover:text-white flex-shrink-0"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="relative flex gap-2">
          <FileUpload 
            ref={fileUploadRef}
            onFilesSelected={setSelectedFiles}
            auth={auth}
            disabled={uploadingFiles}
          />
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${otherUser.name}`}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-stone-500"
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && selectedFiles.length === 0) || uploadingFiles}
            className="px-6 py-2 bg-stone-700 hover:bg-stone-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <FiSend /> {uploadingFiles ? 'Uploading...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DMChat;

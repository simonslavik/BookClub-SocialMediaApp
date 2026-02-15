
import React, { useRef, useEffect, useState } from 'react';
import { FiHash, FiTrash2, FiMoreVertical } from 'react-icons/fi';
import { BsPinAngle } from 'react-icons/bs';
import MessageAttachment from '../../../common/MessageAttachment';
import { messageModerationAPI } from '@api/messageModeration.api';
import { getProfileImageUrl } from '@config/constants';
import logger from '@utils/logger';

// Function to convert URLs in text to clickable links
const linkifyText = (text) => {
  if (!text || typeof text !== 'string') return text;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-300"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

// Function to format timestamp smartly
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const messageDate = new Date(timestamp);
  if (isNaN(messageDate.getTime())) return '';
  const today = new Date();
  
  // Check if message is from today
  const isToday = messageDate.toDateString() === today.toDateString();
  
  if (isToday) {
    // Show only time for today's messages
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    // Show date and time for older messages
    return `${messageDate.toLocaleDateString()} ${messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
};

const BookClubChat = ({ messages, setMessages, currentRoom, auth, userRole, ws }) => {
    const messagesEndRef = useRef(null);
    const [messageMenuId, setMessageMenuId] = useState(null);
    const [showFullDateId, setShowFullDateId] = useState(null);
    const menuRef = useRef(null);

    // Check if user is MODERATOR or higher
    const canModerate = userRole && ['OWNER', 'ADMIN', 'MODERATOR'].includes(userRole);

    // Helper function to check if messages should be grouped
    const shouldGroupMessages = (currentMsg, previousMsg, nextMsg) => {
      if (!currentMsg) return { groupWithPrevious: false, isLastInGroup: true };

      // First message — can't group with previous, but check if next groups with it
      if (!previousMsg) {
        let isLastInGroup = true;
        if (nextMsg && nextMsg.type !== 'system' && nextMsg.userId === currentMsg.userId) {
          const currentTime = new Date(currentMsg.timestamp).getTime();
          const nextTime = new Date(nextMsg.timestamp).getTime();
          isLastInGroup = (nextTime - currentTime) > 300000;
        }
        return { groupWithPrevious: false, isLastInGroup };
      }
      
      // Don't group system messages or deleted messages
      if (currentMsg.type === 'system' || previousMsg.type === 'system') {
        return { groupWithPrevious: false, isLastInGroup: !nextMsg || nextMsg.userId !== currentMsg.userId };
      }
      
      // Check if from same user
      if (currentMsg.userId !== previousMsg.userId) {
        return { groupWithPrevious: false, isLastInGroup: !nextMsg || nextMsg.userId !== currentMsg.userId };
      }
      
      // Check time difference (5 minutes = 300000 milliseconds)
      const currentTime = new Date(currentMsg.timestamp).getTime();
      const previousTime = new Date(previousMsg.timestamp).getTime();
      const timeDiff = currentTime - previousTime;
      
      const groupWithPrevious = timeDiff <= 300000; // 5 minutes
      
      // Check if this is the last message in the group
      let isLastInGroup = true;
      if (nextMsg && nextMsg.userId === currentMsg.userId) {
        const nextTime = new Date(nextMsg.timestamp).getTime();
        const nextTimeDiff = nextTime - currentTime;
        isLastInGroup = nextTimeDiff > 300000;
      }
      
      return { groupWithPrevious, isLastInGroup };
    };

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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleDeleteMessage = async (messageId) => {
      setMessageMenuId(null);
      if (!confirm('Are you sure you want to delete this message?')) return;
      
      try {
        if (ws?.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            type: 'delete-message',
            messageId
          }));
        }
        await messageModerationAPI.deleteMessage(messageId);
        
        // Update local state immediately - ensure there's always text to show
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === messageId 
              ? { ...msg, text: '[Message deleted]', deletedAt: new Date().toISOString(), attachments: [], isPinned: false }
              : msg
          )
        );
      } catch (error) {
        logger.error('Error deleting message:', error);
        alert('Failed to delete message');
      }
    };

    const handlePinMessage = async (messageId, isPinned) => {
      setMessageMenuId(null);
      try {
        if (ws?.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            type: 'pin-message',
            messageId,
            isPinned: !isPinned
          }));
        }
        if (isPinned) {
          await messageModerationAPI.unpinMessage(messageId);
        } else {
          await messageModerationAPI.pinMessage(messageId);
        }
        
        // Update local state immediately
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === messageId 
              ? { ...msg, isPinned: !isPinned }
              : msg
          )
        );
      } catch (error) {
        logger.error('Error pinning message:', error);
        alert('Failed to pin message');
      }
    };

    const toggleMessageMenu = (messageId, event) => {
      event.stopPropagation();
      setMessageMenuId(messageMenuId === messageId ? null : messageId);
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <FiHash className="mx-auto text-4xl mb-2 opacity-30" />
                  <p className="text-sm">Welcome to #{currentRoom?.name}</p>
                  <p className="text-xs mt-1">Start a conversation!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const previousMsg = idx > 0 ? messages[idx - 1] : null;
                  const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
                  const { groupWithPrevious, isLastInGroup } = shouldGroupMessages(msg, previousMsg, nextMsg);
                  
                  return (
                  <div key={msg.id || idx} className={`flex flex-col ${groupWithPrevious ? 'mt-1' : 'mt-3'}`}>
                    {msg.type === 'system' ? (
                      <div className="text-center">
                        <span className="text-xs text-gray-500 italic">{msg.text}</span>
                      </div>
                    ) : (
                      <>
                        {msg.userId === auth?.user?.id ? (
                          <div className="flex gap-3 justify-end group">
                            <div className="text-right max-w-md self-end relative">
                              {msg.isPinned && (
                                <div className="flex items-center justify-end gap-1 text-xs text-yellow-400 mb-1">
                                  <BsPinAngle className="w-3 h-3" />
                                  <span>Pinned</span>
                                </div>
                              )}
                              {msg.text && (
                                <div className={`bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl px-4 py-3 shadow-lg mb-1 ${msg.deletedAt ? 'opacity-60 italic' : ''}`}>
                                  <p className="text-white break-words font-medium">{msg.text ? linkifyText(msg.text) : ''}</p>
                                </div>
                              )}
                              {!msg.deletedAt && (canModerate || msg.userId === auth?.user?.id) && (
                                <button
                                  onClick={(e) => toggleMessageMenu(msg.id, e)}
                                  className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-gray-700/80 hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <FiMoreVertical className="w-4 h-4 text-gray-300" />
                                </button>
                              )}
                              {messageMenuId === msg.id && (
                                <div ref={menuRef} className="absolute left-[-85px] top-[80%] mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[160px]">
                                  {canModerate && (
                                    <button onClick={() => handlePinMessage(msg.id, msg.isPinned)} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2 rounded-t-lg">
                                      <BsPinAngle className="w-4 h-4" />
                                      {msg.isPinned ? 'Unpin message' : 'Pin message'}
                                    </button>
                                  )}
                                  {(canModerate || msg.userId === auth?.user?.id) && (
                                    <button onClick={() => handleDeleteMessage(msg.id)} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2 rounded-b-lg">
                                      <FiTrash2 className="w-4 h-4" />
                                      Delete message
                                    </button>
                                  )}
                                </div>
                              )}
                              {msg.attachments && msg.attachments.length > 0 && !msg.deletedAt ? (
                                <div className="flex flex-col gap-2 mb-1">
                                  {msg.attachments.map((attachment) => (
                                    <MessageAttachment
                                      key={attachment.id}
                                      attachment={attachment}
                                      canDelete={false}
                                      auth={auth}
                                    />
                                  ))}
                                </div>
                              ) : null}
                              {isLastInGroup && (
                                <span className="text-xs text-gray-500 block text-right mt-1">
                                  {formatTimestamp(msg.timestamp)}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-3 group">
                            <img 
                              src={getProfileImageUrl(msg.profileImage) || '/images/default.webp'} 
                              alt={msg.username} 
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0 self-end"
                              onError={(e) => { e.target.src = '/images/default.webp'; }}
                            />
                            <div className="max-w-md relative">
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-bold text-white">{msg.username}</span>
                                {msg.isPinned && (
                                  <span className="flex items-center gap-1 text-xs text-yellow-400">
                                    <BsPinAngle className="w-3 h-3" />
                                    Pinned
                                  </span>
                                )}
                              </div>
                              <div 
                                onClick={() => setShowFullDateId(showFullDateId === msg.id ? null : msg.id)}
                                className="bg-gray-800 rounded-2xl px-4 py-3 shadow-md cursor-pointer hover:bg-gray-750 transition-colors"
                              >
                                {msg.text && <p className={`text-gray-200 break-words leading-relaxed ${msg.deletedAt ? 'italic text-gray-500' : ''}`}>{msg.text ? linkifyText(msg.text) : ''}</p>}
                                {msg.attachments && msg.attachments.length > 0 && !msg.deletedAt ? (
                                  <div className="flex flex-col gap-2 mt-2">
                                    {msg.attachments.map((attachment) => (
                                      <MessageAttachment key={attachment.id} attachment={attachment} canDelete={false} auth={auth} />
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                              {isLastInGroup && showFullDateId === msg.id && (
                                <span className="text-xs text-gray-500 block mt-1">
                                  {new Date(msg.timestamp).toLocaleString()}
                                </span>
                              )}
                              {isLastInGroup && showFullDateId !== msg.id && (
                                <span className="text-xs text-gray-500 block mt-1">
                                  {formatTimestamp(msg.timestamp)}
                                </span>
                              )}
                              {(canModerate || msg.userId === auth?.user?.id) && !msg.deletedAt && (
                                <button onClick={(e) => toggleMessageMenu(msg.id, e)} className="absolute -right-8 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-gray-700/80 hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <FiMoreVertical className="w-4 h-4 text-gray-300" />
                                </button>
                              )}
                              {messageMenuId === msg.id && (canModerate || msg.userId === auth?.user?.id) && (
                                <div ref={menuRef} className="absolute right-0 top-1/2 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[160px]">
                                  {canModerate && (
                                    <button onClick={() => handlePinMessage(msg.id, msg.isPinned)} className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2 rounded-t-lg">
                                      <BsPinAngle className="w-4 h-4" />
                                      {msg.isPinned ? 'Unpin message' : 'Pin message'}
                                    </button>
                                  )}
                                  {(canModerate || msg.userId === auth?.user?.id) && (
                                    <button onClick={() => handleDeleteMessage(msg.id)} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2 rounded-b-lg">
                                      <FiTrash2 className="w-4 h-4" />
                                      Delete message
                                    </button>
                                  )}
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
    )
};

export default BookClubChat;
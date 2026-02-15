import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiMoreVertical, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../../../common/FileUpload';
import MessageAttachment from '../../../common/MessageAttachment';
import apiClient from '@api/axios';
import { getProfileImageUrl } from '@config/constants';
import logger from '@utils/logger';

// Function to convert URLs in text to clickable links
const linkifyText = (text) => {
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

const DMChat = ({ otherUser, messages, onSendMessage, auth, setMessages, dmWs }) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [messageMenuId, setMessageMenuId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileUploadRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom when conversation changes
  useEffect(() => {
    if (otherUser) {
      scrollToBottom();
    }
  }, [otherUser]);

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

  const handleDeleteMessage = async (messageId) => {
    setMessageMenuId(null);
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      // Send WebSocket notification to the conversation partner only
      if (dmWs?.current && dmWs.current.readyState === WebSocket.OPEN) {
        dmWs.current.send(JSON.stringify({
          type: 'delete-dm-message',
          messageId,
          receiverId: otherUser?.id
        }));
      }
      
      // Call DM delete API endpoint
      const { data } = await apiClient.delete(`/v1/messages/${messageId}`);

      // Update local state immediately
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: '[Message deleted]', deletedAt: new Date().toISOString(), attachments: [] }
            : msg
        )
      );
    } catch (error) {
      logger.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  const toggleMessageMenu = (messageId, event) => {
    event.stopPropagation();
    setMessageMenuId(messageMenuId === messageId ? null : messageId);
  };

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
        onSendMessage(newMessage.trim(), []);
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
        onSendMessage(newMessage.trim(), []);
      }
      
      setNewMessage('');
      setSelectedFiles([]);
    } catch (error) {
      logger.error('Error sending DM:', error);
      alert('Failed to send message');
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const previousMsg = idx > 0 ? messages[idx - 1] : null;
            const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
            const { groupWithPrevious, isLastInGroup } = shouldGroupMessages(msg, previousMsg, nextMsg);
            
            return (
            <div 
              key={msg.id || idx} 
              className={`flex gap-3 group ${
                msg.senderId === auth?.user?.id ? 'justify-end' : 'justify-start'
              } ${groupWithPrevious ? 'mt-1' : 'mt-3'}`}
            >
              <div className="flex flex-col gap-2 max-w-xs lg:max-w-md relative">
                {msg.content && (
                  <div className={`px-4 py-2 rounded-2xl break-words ${msg.deletedAt ? 'opacity-60' : ''} ${
                      msg.senderId === auth?.user?.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-200'
                  }`}>
                      <p className={msg.deletedAt ? 'italic text-gray-300' : ''}>{linkifyText(msg.content)}</p>
                      {isLastInGroup && (
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                  </div>
                )}
                {msg.attachments && msg.attachments.length > 0 && !msg.deletedAt && (
                  <div className="flex flex-col gap-2">
                    {msg.attachments.map((attachment, attIdx) => (
                      <MessageAttachment 
                        key={attIdx} 
                        attachment={attachment}
                        isSender={msg.senderId === auth?.user?.id}
                      />
                    ))}
                  </div>
                )}
                {/* Three-dot menu button */}
                {!msg.deletedAt && msg.senderId === auth?.user?.id && (
                  <button
                    onClick={(e) => toggleMessageMenu(msg.id, e)}
                    className={`absolute top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-gray-700/80 hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity ${
                      msg.senderId === auth?.user?.id ? '-left-8' : '-right-8'
                    }`}
                  >
                    <FiMoreVertical className="w-4 h-4 text-gray-300" />
                  </button>
                )}
                {/* Delete menu */}
                {messageMenuId === msg.id && !msg.deletedAt && msg.senderId === auth?.user?.id && (
                  <div 
                    ref={menuRef} 
                    className={`absolute ${
                      msg.senderId === auth?.user?.id ? 'right-[80%]' : 'right-0'
                    } top-[80%] mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[160px]`}
                  >
                    <button 
                      onClick={() => handleDeleteMessage(msg.id)} 
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2 rounded-lg"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Delete message
                    </button>
                  </div>
                )}
              </div>
            </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="relative flex gap-2">
          <FileUpload 
            ref={fileUploadRef}
            onFilesSelected={setSelectedFiles}
            auth={auth}
            disabled={uploadingFiles}
          />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${otherUser.name}`}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && selectedFiles.length === 0) || uploadingFiles}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <FiSend /> {uploadingFiles ? 'Uploading...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DMChat;

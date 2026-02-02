import React, { useState, useRef, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../../FileUpload';
import MessageAttachment from '../../MessageAttachment';

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

const DMChat = ({ otherUser, messages, onSendMessage, auth }) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const messagesEndRef = useRef(null);
  const fileUploadRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    
    setUploadingFiles(true);
    
    try {
      let uploadedAttachments = [];
      
      if (selectedFiles.length > 0) {
        uploadedAttachments = await fileUploadRef.current?.uploadFiles();
      }
      
      onSendMessage(newMessage.trim(), uploadedAttachments);
      setNewMessage('');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error sending DM:', error);
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
          src={otherUser.profileImage 
            ? `http://localhost:3001${otherUser.profileImage}` 
            : '/images/default.webp'
          }
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
          <p className="text-gray-400 text-sm">{otherUser.email}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={msg.id || idx} 
              className={`flex ${msg.senderId === auth?.user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex flex-col gap-2 max-w-xs lg:max-w-md">
                {msg.content && (
                  <div className={`px-4 py-2 rounded-2xl break-words ${
                      msg.senderId === auth?.user?.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-200'
                  }`}>
                      <p>{linkifyText(msg.content)}</p>
                      <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                  </div>
                )}
                {msg.attachments && msg.attachments.length > 0 && (
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
              </div>
            </div>
          ))
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

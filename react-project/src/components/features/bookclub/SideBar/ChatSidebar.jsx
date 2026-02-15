import { useState, useRef, useEffect } from 'react';
import { FiSend, FiMessageSquare } from 'react-icons/fi';
import logger from '@utils/logger';

export default function ChatSidebar({ ws, username, messages, onSendMessage }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;

    onSendMessage(message.trim());
    setMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 border-l border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-700 bg-gray-900">
        <FiMessageSquare className="text-purple-400 text-xl" />
        <h3 className="text-white font-semibold">Live Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <FiMessageSquare className="mx-auto text-4xl mb-2 opacity-30" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.username === username ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  msg.username === username
                    ? 'bg-purple-600 text-white'
                    : msg.type === 'system'
                    ? 'bg-gray-700 text-gray-300 text-sm italic'
                    : 'bg-gray-700 text-white'
                }`}
              >
                {msg.type !== 'system' && (
                  <p className="text-xs opacity-70 mb-1">{msg.username}</p>
                )}
                <p className="text-sm break-words">{msg.text}</p>
                <p className="text-xs opacity-50 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-700 bg-gray-900">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
          >
            <FiSend className="text-lg" />
          </button>
        </div>
      </form>
    </div>
  );
}

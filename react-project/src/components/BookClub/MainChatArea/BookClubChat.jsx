
import React, { useRef, useEffect } from 'react';
import { FiHash } from 'react-icons/fi';
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

const BookClubChat = ({ messages, currentRoom, auth }) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <FiHash className="mx-auto text-4xl mb-2 opacity-30" />
                  <p className="text-sm">Welcome to #{currentRoom?.name}</p>
                  <p className="text-xs mt-1">Start a conversation!</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={msg.id || idx} className="flex flex-col">
                    {msg.type === 'system' ? (
                      <div className="text-center">
                        <span className="text-xs text-gray-500 italic">{msg.text}</span>
                      </div>
                    ) : (
                      <>
                        {/* Debug: Log message data */}
                        {console.log('Message:', msg.id, 'Text:', msg.text, 'Attachments:', msg.attachments)}
                        {msg.userId === auth?.user?.id ? (
                          <div className="flex gap-3 justify-end">
                            <div className="text-right max-w-md self-end">
                              {msg.text && (
                                <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl px-4 py-3 shadow-lg mb-2">
                                  <p className="text-white break-words font-medium">{linkifyText(msg.text)}</p>
                                </div>
                              )}
                              {msg.attachments && msg.attachments.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                  {msg.attachments.map((attachment) => (
                                    <MessageAttachment
                                      key={attachment.id}
                                      attachment={attachment}
                                      canDelete={true}
                                      onDelete={async () => {
                                        try {
                                          await fetch(`http://localhost:4000/chat-files/${attachment.id}`, {
                                            method: 'DELETE',
                                            headers: { 'Authorization': `Bearer ${auth.token}` }
                                          });
                                        } catch (err) {
                                          console.error('Error deleting file:', err);
                                        }
                                      }}
                                      auth={auth}
                                    />
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {msg.username?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-bold text-white">{msg.username}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              {msg.text && <p className="text-gray-200 break-words leading-relaxed mb-2">{linkifyText(msg.text)}</p>}
                              {msg.attachments && msg.attachments.length > 0 ? (
                                <div className="flex flex-col gap-2">
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
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
    )
};

export default BookClubChat;
import React from 'react';
import FileUpload from '../../common/FileUpload';
import logger from '@utils/logger';

const MessageInput = ({ 
  newMessage,
  setNewMessage,
  selectedFiles,
  uploadingFiles,
  currentRoom,
  fileUploadRef,
  onFilesSelected,
  onSubmit,
  auth
}) => {
  return (
    <form onSubmit={onSubmit} className="bg-gray-800 border-t border-gray-700 relative">
      {/* File Upload Preview */}
      
      <div className="flex gap-2 p-4">
        <FileUpload 
        ref={fileUploadRef}
        onFilesSelected={onFilesSelected} 
        auth={auth}
        disabled={!currentRoom}
        />
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`Message #${currentRoom?.name}`}
          className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          disabled={(!newMessage.trim() && selectedFiles.length === 0) || uploadingFiles}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {uploadingFiles ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;

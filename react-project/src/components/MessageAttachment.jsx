import React, { useState } from 'react';
import { FiDownload, FiFile, FiX } from 'react-icons/fi';

const MessageAttachment = ({ attachment, canDelete, onDelete, auth }) => {
  const [imageExpanded, setImageExpanded] = useState(false);

  const isImage = attachment.mimetype.startsWith('image/');

  const handleDownload = async () => {
    try {
      // Fetch the file as a blob to force download instead of opening in browser
      const response = await fetch(`http://localhost:4000${attachment.url}`);
      const blob = await response.blob();
      
      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = attachment.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isImage) {
    return (
      <>
        <div className="relative inline-block mt-2 group">
          <img
            src={`http://localhost:4000${attachment.url}`}
            alt={attachment.filename}
            className="max-w-sm max-h-64 rounded-lg cursor-pointer hover:brightness-110 transition-all duration-200 border border-gray-600/30 hover:border-purple-500/50 shadow-lg"
            onClick={() => setImageExpanded(true)}
            onError={(e) => { e.target.src = '/images/default.webp'; }}
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="bg-gray-900/90 backdrop-blur-sm text-white p-2 rounded-full hover:bg-gray-800 hover:scale-110 transition-all duration-200 shadow-lg"
              title="Download"
            >
              <FiDownload size={16} />
            </button>
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="bg-red-600/90 backdrop-blur-sm text-white p-2 rounded-full hover:bg-red-500 hover:scale-110 transition-all duration-200 shadow-lg"
                title="Delete"
              >
                <FiX size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Image Modal */}
        {imageExpanded && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setImageExpanded(false)}
          >
            <div className="relative max-w-7xl max-h-full">
              <img
                src={`http://localhost:4000${attachment.url}`}
                alt={attachment.filename}
                className="max-w-full max-h-[90vh] object-contain"
                onError={(e) => { e.target.src = '/images/default.webp'; }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageExpanded(false);
                }}
                className="absolute top-4 right-4 bg-gray-900 bg-opacity-80 text-white p-2 rounded-full hover:bg-opacity-100"
              >
                <FiX size={24} />
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-gray-700 to-gray-750 rounded-lg p-3 mt-2 max-w-xs hover:from-gray-650 hover:to-gray-700 transition-all duration-200 border border-gray-600/50 hover:border-purple-500/50 shadow-md hover:shadow-lg group">
      <div className="bg-purple-600/20 p-2 rounded-lg group-hover:bg-purple-600/30 transition-colors">
        <FiFile className="text-purple-400 flex-shrink-0" size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate" title={attachment.filename}>{attachment.filename}</p>
        <p className="text-gray-400 text-xs mt-0.5">
          {formatFileSize(attachment.size)}
        </p>
      </div>
      <button
        onClick={handleDownload}
        className="text-blue-400 hover:text-blue-300 flex-shrink-0 p-1.5 hover:bg-blue-400/10 rounded-lg transition-all duration-200 hover:scale-110"
        title="Download"
      >
        <FiDownload size={18} />
      </button>
      {canDelete && (
        <button
          onClick={onDelete}
          className="text-red-400 hover:text-red-300 flex-shrink-0 p-1.5 hover:bg-red-400/10 rounded-lg transition-all duration-200 hover:scale-110"
          title="Delete"
        >
          <FiX size={18} />
        </button>
      )}
    </div>
  );
};

export default MessageAttachment;

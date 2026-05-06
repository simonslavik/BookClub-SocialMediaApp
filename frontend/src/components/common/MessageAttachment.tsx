import React, { useState } from 'react';
import { FiDownload, FiFile, FiX } from 'react-icons/fi';
import { getCollabImageUrl } from '@config/constants';
import logger from '@utils/logger';
import { useToast } from '@hooks/useUIFeedback';

const MessageAttachment = ({ attachment, canDelete = false, onDelete, auth, isSender }: { attachment: any; canDelete?: boolean; onDelete?: (...args: any[]) => void; auth?: any; isSender?: boolean }) => {
  const [imageExpanded, setImageExpanded] = useState(false);
  const { toastError } = useToast();

  const isImage = attachment.mimetype.startsWith('image/');

  const handleDownload = async () => {
    try {
      // Fetch the file as a blob to force download instead of opening in browser
      const response = await fetch(getCollabImageUrl(attachment.url));
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
      logger.error('Download failed:', error);
      toastError('Failed to download file');
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
        <div className="relative inline-block group">
          <img
            src={getCollabImageUrl(attachment.url)}
            alt={attachment.filename}
            className="max-w-[200px] sm:max-w-xs md:max-w-sm max-h-48 md:max-h-64 rounded-md cursor-pointer hover:brightness-110 transition-colors border border-white/[0.06]"
            onClick={() => setImageExpanded(true)}
            onError={(e) => { (e.target as HTMLImageElement).src = '/images/default.webp'; }}
          />
          <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="bg-gray-900/80 backdrop-blur-sm text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
              title="Download"
            >
              <FiDownload size={12} />
            </button>
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="bg-red-600/80 backdrop-blur-sm text-white p-1 rounded-full hover:bg-red-500 transition-colors"
                title="Delete"
              >
                <FiX size={12} />
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
                src={getCollabImageUrl(attachment.url)}
                alt={attachment.filename}
                className="max-w-full max-h-[90vh] object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = '/images/default.webp'; }}
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
    <div className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.06] rounded-md px-2 py-1.5 max-w-[220px] border border-white/[0.06] transition-colors group">
      <FiFile className="text-gray-400 flex-shrink-0" size={14} />
      <div className="flex-1 min-w-0">
        <p className="text-gray-200 text-xs truncate" title={attachment.filename}>{attachment.filename}</p>
        <p className="text-gray-500 text-[10px]">
          {formatFileSize(attachment.size)}
        </p>
      </div>
      <button
        onClick={handleDownload}
        className="text-gray-400 hover:text-gray-200 flex-shrink-0 p-1 rounded transition-colors"
        title="Download"
      >
        <FiDownload size={12} />
      </button>
      {canDelete && (
        <button
          onClick={onDelete}
          className="text-red-400 hover:text-red-300 flex-shrink-0 p-1 rounded transition-colors"
          title="Delete"
        >
          <FiX size={12} />
        </button>
      )}
    </div>
  );
};

export default MessageAttachment;

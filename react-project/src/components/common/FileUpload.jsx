import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { FiPaperclip, FiX, FiFile, FiImage } from 'react-icons/fi';
import { uploadChatFile } from '@api/upload.api';
import logger from '@utils/logger';

const FileUpload = forwardRef(({ onFilesSelected, auth, disabled = false }, ref) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Expose uploadFiles method to parent via ref
  useImperativeHandle(ref, () => ({
    uploadFiles: async () => {
      if (selectedFiles.length === 0) return [];

      logger.debug('FileUpload: Starting upload for', selectedFiles.length, 'files');
      logger.debug('FileUpload: Auth token exists:', !!auth?.token);
      logger.debug('FileUpload: Auth token preview:', auth?.token?.substring(0, 20) + '...');

      setUploading(true);
      const uploadedFiles = [];

      try {
        for (const file of selectedFiles) {
          logger.debug('FileUpload: Uploading file:', file.name, 'Size:', file.size);

          const data = await uploadChatFile(file);
          logger.debug('FileUpload: Response data:', data);
          
          if (data.success) {
            uploadedFiles.push(data.data);
            logger.debug('FileUpload: File uploaded successfully:', data.data);
          } else {
            logger.error('FileUpload: Upload failed:', data);
            alert(`Failed to upload ${file.name}: ${data.message || data.error || 'Unknown error'}`);
          }
        }

        setSelectedFiles([]);
        logger.debug('FileUpload: All uploads complete. Total:', uploadedFiles.length);
        return uploadedFiles;
      } catch (error) {
        logger.error('FileUpload: Upload error:', error);
        throw error;
      } finally {
        setUploading(false);
      }
    }
  }));

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
    e.target.value = ''; // Reset input
  };

  const addFiles = (files) => {
    const validFiles = files.filter(file => {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large. Max size is 10MB`);
        return false;
      }
      return true;
    });

    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles); // Notify parent
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles); // Notify parent
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <FiImage className="text-blue-400" size={20} />;
    return <FiFile className="text-gray-400" size={20} />;
  };

  return (
    <>
      {/* File Preview Panel - Shows above message input when files are selected */}
      {selectedFiles.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 px-4 py-3 bg-gradient-to-b from-gray-750 to-gray-800 border border-purple-500/30 rounded-t-lg shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-purple-600/20 p-1.5 rounded-lg">
                <FiPaperclip className="text-purple-400" size={16} />
              </div>
              <span className="text-white text-sm font-semibold">
                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} ready to send
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedFiles([]);
                onFilesSelected([]);
              }}
              className="text-gray-400 hover:text-red-400 text-xs font-medium transition-colors px-2 py-1 rounded hover:bg-red-400/10"
            >
              Clear all
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex-shrink-0 relative group bg-gray-700 hover:bg-gray-650 rounded-xl p-2.5 w-36 border border-gray-600/50 hover:border-purple-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20"
              >
                {file.type.startsWith('image/') ? (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-all duration-200" />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg transform hover:scale-110"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex flex-col items-center justify-center gap-2 h-24 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg">
                      {getFileIcon(file)}
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg transform hover:scale-110"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                )}
                <p className="text-white text-xs truncate mt-2 font-medium" title={file.name}>{file.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">{formatFileSize(file.size)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachment Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        title="Attach file"
        type="button"
      >
        <FiPaperclip size={20} />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.zip"
      />
    </>
  );
});

export default FileUpload;

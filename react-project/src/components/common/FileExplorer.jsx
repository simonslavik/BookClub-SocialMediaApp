import { useState } from 'react';
import { 
  FiFile, FiFolder, FiFolderPlus, FiFilePlus, FiTrash2, 
  FiChevronRight, FiChevronDown 
} from 'react-icons/fi';
import logger from '@utils/logger';

export default function FileExplorer({ files, currentFile, onFileSelect, onCreateFile, onDeleteFile }) {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));
  const [newFileName, setNewFileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    onCreateFile(newFileName.trim());
    setNewFileName('');
    setIsCreating(false);
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop();
    const icons = {
      js: '📜',
      jsx: '⚛️',
      ts: '📘',
      tsx: '⚛️',
      py: '🐍',
      java: '☕',
      cpp: '⚙️',
      html: '🌐',
      css: '🎨',
      json: '📋',
    };
    return icons[ext] || '📄';
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-700">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">FILES</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="text-gray-400 hover:text-white transition-colors"
          title="New File"
        >
          <FiFilePlus className="text-lg" />
        </button>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isCreating && (
          <div className="mb-2 p-2 bg-gray-800 rounded">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFileName('');
                }
              }}
              onBlur={handleCreateFile}
              placeholder="filename.js"
              className="w-full px-2 py-1 bg-gray-700 border border-purple-500 text-white text-sm rounded focus:outline-none"
              autoFocus
            />
          </div>
        )}

        {files.length === 0 ? (
          <div className="text-center text-gray-500 mt-8 px-4">
            <FiFile className="mx-auto text-3xl mb-2 opacity-30" />
            <p className="text-xs">No files yet</p>
            <p className="text-xs mt-1">Create a new file to start</p>
          </div>
        ) : (
          <div className="space-y-1">
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => onFileSelect(file)}
                className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors group ${
                  currentFile?.id === file.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm">{getFileIcon(file.name)}</span>
                  <span className="text-sm truncate">{file.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(file.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                >
                  <FiTrash2 className="text-xs" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfileImageUrl } from '@config/constants';
import { userAPI } from '@api/user.api';
import { STATUS_OPTIONS, getStatusColor } from './statusUtils';
import logger from '@utils/logger';

const StatusPopup = ({ user, onClose, onStatusChange, wsRef, onLogout }) => {
  const popupRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleStatusSelect = async (status) => {
    try {
      await userAPI.updateStatus(status);
      onStatusChange(status);

      // Broadcast via WebSocket if available
      if (wsRef?.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'status-update', status }));
      }

      onClose();
    } catch (err) {
      logger.error('Failed to update status:', err);
    }
  };

  const currentStatus = user?.status || 'ONLINE';

  return (
    <div
      ref={popupRef}
      className="fixed bottom-16 left-2 w-56 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-[9999] overflow-hidden"
    >
      {/* User info */}
      <div className="p-3 border-b border-gray-700 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <img
            src={getProfileImageUrl(user?.profileImage) || '/images/default.webp'}
            alt={user?.name}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => { e.target.src = '/images/default.webp'; }}
          />
          <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-800 ${getStatusColor(currentStatus)}`} />
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
          <p className="text-gray-400 text-xs truncate">{user?.email}</p>
        </div>
      </div>

      {/* Status options */}
      <div className="py-1">
        <p className="px-3 py-1.5 text-xs text-gray-500 uppercase tracking-wide">Set Status</p>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleStatusSelect(opt.value)}
            className={`w-full px-3 py-2 text-left flex items-center gap-2.5 transition-colors hover:bg-gray-700 ${
              currentStatus === opt.value ? 'bg-gray-700/50' : ''
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${opt.color} flex-shrink-0`} />
            <span className="text-sm text-white">{opt.label}</span>
            {currentStatus === opt.value && (
              <span className="ml-auto text-xs text-stone-500">Current</span>
            )}
          </button>
        ))}
      </div>

      {/* View Profile & Logout */}
      <div className="border-t border-gray-700 py-1">
        <button
          onClick={() => { navigate(`/profile/${user?.id}`); onClose(); }}
          className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          View Profile
        </button>
        {onLogout && (
          <button
            onClick={() => { onLogout(); onClose(); }}
            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
          >
            Log Out
          </button>
        )}
      </div>
    </div>
  );
};

export default StatusPopup;

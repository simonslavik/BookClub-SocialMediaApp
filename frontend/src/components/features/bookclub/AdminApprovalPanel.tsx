import React, { useState, useEffect } from 'react';
import { FiUsers, FiCheck, FiX, FiClock, FiMessageSquare } from 'react-icons/fi';
import { bookclubAPI } from '@api/bookclub.api';
import logger from '@utils/logger';
import { useToast } from '@hooks/useUIFeedback';

const AdminApprovalPanel = ({ bookclubId, userRole }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const isAdmin = userRole && ['OWNER', 'ADMIN'].includes(userRole);
  const { toastError } = useToast();

  useEffect(() => {
    if (isAdmin) {
      fetchPendingRequests();
    }
  }, [bookclubId, isAdmin]);

  const fetchPendingRequests = async () => {
    try {
      logger.debug('Fetching pending requests for bookclub:', bookclubId);
      const response = await bookclubAPI.getPendingRequests(bookclubId);
      logger.debug('Pending requests response:', response);
      logger.debug('Requests data:', response.data);
      setRequests(response.data || []);
    } catch (error) {
      logger.error('Failed to fetch pending requests:', error);
      logger.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    try {
      await bookclubAPI.approveJoinRequest(bookclubId, requestId);
      setRequests(requests.filter(r => r.id !== requestId));
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setProcessingId(requestId);
    try {
      await bookclubAPI.rejectJoinRequest(bookclubId, requestId);
      setRequests(requests.filter(r => r.id !== requestId));
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-center py-6">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <FiUsers className="w-3.5 h-3.5 text-indigo-500" />
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Join Requests</h3>
        </div>
        <p className="text-gray-500 text-xs text-center py-6">No pending requests</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <FiUsers className="w-3.5 h-3.5 text-indigo-500" />
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Join Requests</h3>
        <span className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-full text-[10px] font-medium leading-none">
          {requests.length}
        </span>
      </div>

      <div className="space-y-2">
        {requests.map((request) => (
          <div
            key={request.id}
            className="border border-gray-700 rounded-md p-2.5 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                {request.user?.profilePicture ? (
                  <img
                    src={request.user.profilePicture}
                    alt={request.user.username}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-xs flex-shrink-0">
                    {request.user?.username?.charAt(0)?.toUpperCase() || request.userId?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-white truncate">
                    {request.user?.username || `User ${request.userId.slice(0, 8)}`}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full text-[10px] font-medium leading-none flex-shrink-0 ml-2">
                <FiClock className="w-2.5 h-2.5" />
                Pending
              </div>
            </div>

            {request.message && (
              <div className="bg-white/[0.03] border-l-2 border-gray-600 rounded-r p-2 mb-2">
                <div className="flex items-start gap-1.5">
                  <FiMessageSquare className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300 text-xs">{request.message}</p>
                </div>
              </div>
            )}

            <div className="flex gap-1.5">
              <button
                onClick={() => handleApprove(request.id)}
                disabled={processingId === request.id}
                className={`flex-1 px-2.5 py-1 rounded text-xs transition-colors flex items-center justify-center gap-1 ${
                  processingId === request.id
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <FiCheck className="w-3 h-3" />
                Approve
              </button>
              <button
                onClick={() => handleReject(request.id)}
                disabled={processingId === request.id}
                className={`flex-1 px-2.5 py-1 rounded text-xs transition-colors flex items-center justify-center gap-1 ${
                  processingId === request.id
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                <FiX className="w-3 h-3" />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminApprovalPanel;

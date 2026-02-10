import React, { useState, useEffect } from 'react';
import { FiUsers, FiCheck, FiX, FiClock, FiMessageSquare } from 'react-icons/fi';
import { bookclubAPI } from '../../../api/bookclub.api';

const AdminApprovalPanel = ({ bookclubId, userRole }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const isAdmin = userRole && ['OWNER', 'ADMIN'].includes(userRole);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingRequests();
    }
  }, [bookclubId, isAdmin]);

  const fetchPendingRequests = async () => {
    try {
      console.log('Fetching pending requests for bookclub:', bookclubId);
      const response = await bookclubAPI.getPendingRequests(bookclubId);
      console.log('Pending requests response:', response);
      console.log('Requests data:', response.data);
      setRequests(response.data || []);
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
      console.error('Error details:', error.response?.data);
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
      alert(error.response?.data?.message || 'Failed to approve request');
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
      alert(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FiUsers className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold text-gray-900 font-display">Join Requests</h3>
        </div>
        <div className="text-center py-8">
          <FiClock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-outfit">No pending requests</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <FiUsers className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-bold text-gray-900 font-display">Join Requests</h3>
        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
          {requests.length}
        </span>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="border-2 border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {request.user?.profilePicture ? (
                  <img 
                    src={request.user.profilePicture} 
                    alt={request.user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                    {request.user?.username?.charAt(0)?.toUpperCase() || request.userId?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 font-outfit">
                    {request.user?.username || `User ${request.userId.slice(0, 8)}`}
                  </p>
                  <p className="text-sm text-gray-500 font-outfit">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
                <FiClock className="w-4 h-4" />
                Pending
              </div>
            </div>

            {request.message && (
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-2">
                  <FiMessageSquare className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <p className="text-gray-700 text-sm font-outfit">{request.message}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(request.id)}
                disabled={processingId === request.id}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors font-outfit flex items-center justify-center gap-2 ${
                  processingId === request.id
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                <FiCheck className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => handleReject(request.id)}
                disabled={processingId === request.id}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors font-outfit flex items-center justify-center gap-2 ${
                  processingId === request.id
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                <FiX className="w-4 h-4" />
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

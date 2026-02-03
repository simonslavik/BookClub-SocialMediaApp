import React, { useState } from 'react';
import { FiX, FiLock, FiUnlock, FiEyeOff, FiUserPlus, FiCheckCircle } from 'react-icons/fi';
import { bookclubAPI } from '../../../api/bookclub.api';

const JoinBookclubModal = ({ isOpen, onClose, bookclub, onJoinSuccess }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !bookclub) return null;

  // If user is already a member, they shouldn't see this modal
  // But in case it's shown, just close it
  if (bookclub.isMember) {
    onClose();
    return null;
  }

  const isPublic = bookclub.visibility === 'PUBLIC';
  const isPrivate = bookclub.visibility === 'PRIVATE';
  const isInviteOnly = bookclub.visibility === 'INVITE_ONLY';

  const handleJoin = async () => {
    setLoading(true);
    setError('');

    try {
      if (isPublic) {
        // Instant join for PUBLIC clubs
        const response = await bookclubAPI.joinBookclubInstant(bookclub.id);
        setSuccess(true);
        setTimeout(() => {
          onJoinSuccess?.(response.data);
          onClose();
        }, 1500);
      } else if (isPrivate) {
        // Request to join for PRIVATE clubs
        await bookclubAPI.requestToJoinBookclub(bookclub.id, message);
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join bookclub');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    if (isPublic) return <FiUnlock className="w-16 h-16 text-green-500" />;
    if (isPrivate) return <FiLock className="w-16 h-16 text-yellow-500" />;
    if (isInviteOnly) return <FiEyeOff className="w-16 h-16 text-purple-500" />;
  };

  const getTitle = () => {
    if (isPublic) return 'Join Book Club';
    if (isPrivate) return 'Request to Join';
    if (isInviteOnly) return 'Invite Only';
  };

  const getDescription = () => {
    if (isPublic) return 'This is a public book club. You can join instantly!';
    if (isPrivate) return 'This is a private book club. Send a request to the admins for approval.';
    if (isInviteOnly) return 'This book club is invite-only. You need an invite code to join.';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-display font-bold">{getTitle()}</h2>
              <p className="text-white/90 font-outfit mt-1">{bookclub.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2 font-display">
                {isPublic ? 'Successfully Joined!' : 'Request Sent!'}
              </h3>
              <p className="text-gray-600 font-outfit">
                {isPublic
                  ? 'Welcome to the book club! Redirecting...'
                  : 'Admins will review your request soon.'}
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                {getIcon()}
                <p className="text-gray-600 mt-4 font-outfit">{getDescription()}</p>
              </div>

              {/* Member count */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-outfit">Members</span>
                  <span className="font-semibold text-gray-900">
                    {bookclub.memberCount || 0}
                  </span>
                </div>
                {bookclub.category && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-600 font-outfit">Category</span>
                    <span className="font-semibold text-gray-900">{bookclub.category}</span>
                  </div>
                )}
              </div>

              {/* Message input for PRIVATE clubs */}
              {isPrivate && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">
                    Message (Optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell the admins why you'd like to join..."
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none font-outfit resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1 font-outfit">
                    {message.length}/500 characters
                  </p>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-600 text-sm font-outfit">{error}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors font-outfit"
                  disabled={loading}
                >
                  Cancel
                </button>
                {!isInviteOnly && (
                  <button
                    onClick={handleJoin}
                    disabled={loading}
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors font-outfit flex items-center justify-center gap-2 ${
                      loading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {isPrivate ? 'Sending...' : 'Joining...'}
                      </>
                    ) : (
                      <>
                        <FiUserPlus className="w-5 h-5" />
                        {isPrivate ? 'Send Request' : 'Join Now'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinBookclubModal;

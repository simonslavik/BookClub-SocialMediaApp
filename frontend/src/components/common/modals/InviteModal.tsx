import React, { useState, useEffect, useContext } from 'react';
import { FiX, FiCopy, FiTrash2, FiCheck, FiLink, FiUsers, FiSearch } from 'react-icons/fi';
import AuthContext from '@context/index';
import { bookclubAPI } from '@api/bookclub.api';
import apiClient from '@api/axios';
import { getProfileImageUrl } from '@config/constants';
import logger from '@utils/logger';
import { useToast } from '@hooks/useUIFeedback';

const InviteModal = ({ bookClubId, bookClubName, bookClubMembers = [], currentUserRole, onClose }) => {
  const { auth } = useContext(AuthContext);
  const { toastSuccess, toastError, toastWarning } = useToast();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Friend search
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [sendingInvites, setSendingInvites] = useState(new Set());


  useEffect(() => {
    fetchInvite();
    fetchFriends();
  }, []);

  const fetchInvite = async () => {
    try {
      setLoading(true);
      logger.debug('Fetching shareable invite for bookclub:', bookClubId);
      
      const response = await bookclubAPI.getShareableInvite(bookClubId);
      logger.debug('Shareable invite response:', response);
      
      if (response.data) {
        setInvite(response.data);
        logger.debug('Using invite:', response.data);
      } else {
        logger.debug('No active invite found');
      }
    } catch (error) {
      logger.error('Error fetching invite:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const { data } = await apiClient.get('/v1/friends/list');
      logger.debug('Friends API Response:', data);
      // Extract the actual friend data from the response
      // API returns array of objects like: { friendshipId, friend: { id, username, ... }, since }
      const friendsList = (data.data || []).map(item => {
        // If item has a 'friend' property, use that, otherwise use the item itself
        const friendData = item.friend || item;
        logger.debug('Processing friend item:', item, 'Extracted:', friendData);
        return friendData;
      });
      logger.debug('Processed Friends List:', friendsList);
      setFriends(friendsList);
      setSearchResults(friendsList);
    } catch (error) {
      logger.error('Error fetching friends:', error);
      setFriends([]);
      setSearchResults([]);
    }
  };

  const copyInviteLink = () => {
    const inviteCode = invite.code || invite.inviteCode;
    const link = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendDMInvite = async (userId, username) => {
    try {
      setSendingInvites(prev => new Set(prev).add(userId));
      
      if (!auth?.token) {
        toastWarning('You must be logged in to send invites');
        return;
      }
      
      if (!invite) {
        logger.error('No invite available. Invite state:', invite);
        toastWarning('Invite link not available. Please try closing and reopening the modal.');
        return;
      }

      const inviteCode = invite.code || invite.inviteCode;
      const inviteLink = `${window.location.origin}/invite/${inviteCode}`;
      const message = `You've been invited to join "${bookClubName}"! Click here to join: ${inviteLink}`;

      logger.debug('Sending DM to:', userId, 'with invite link:', inviteLink);

      // Send DM with invite
      const { data: responseData } = await apiClient.post('/v1/messages', {
        receiverId: userId,
        content: message
      });

      logger.debug('DM Response:', responseData);

      toastSuccess(`Invite sent to ${username}!`);
    } catch (error) {
      logger.error('Error sending DM invite:', error);
      toastError('Failed to send invite: ' + error.message);
    } finally {
      setSendingInvites(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults(friends);
    } else {
      const filtered = friends.filter(friend =>
        (friend.username || friend.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (friend.email || '').toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    }
  };

  const isMember = (friendId) => {
    return bookClubMembers.some(member => member.id === friendId || member.userId === friendId);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-sm font-semibold text-white truncate">Invite to {bookClubName}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors flex-shrink-0 ml-2"
          >
            <FiX size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto">
          {loading ? (
            <div className="text-center py-6 text-gray-400 text-xs">Loading invite link...</div>
          ) : (
            <>
              {/* Invite Link Section */}
              {invite ? (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FiLink className="text-indigo-500" size={12} />
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Permanent Invite Link</h3>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 bg-gray-900 px-2.5 py-1.5 rounded border border-gray-600 font-mono text-xs text-gray-300 break-all min-w-0">
                      {window.location.origin}/invite/{invite.code || invite.inviteCode}
                    </div>
                    <button
                      onClick={copyInviteLink}
                      className="px-2.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded transition-colors flex items-center gap-1 text-xs flex-shrink-0"
                    >
                      {copied ? (
                        <>
                          <FiCheck size={12} />
                          Copied
                        </>
                      ) : (
                        <>
                          <FiCopy size={12} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Uses: {invite.currentUses} • Never expires
                  </p>
                </div>
              ) : (
                <div className="mb-4 p-2.5 bg-yellow-500/10 rounded border border-yellow-500/30">
                  <p className="text-yellow-400 text-xs font-semibold">No Invite Link Available</p>
                  <p className="text-[11px] text-yellow-300/80 mt-0.5">
                    This bookclub doesn't have an invite link. Contact the owner if this is unexpected.
                  </p>
                </div>
              )}

              {/* Friends Section */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <FiUsers className="text-gray-500" size={12} />
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Send to Friends</h3>
                  {!invite && (
                    <span className="text-[11px] text-gray-500">(Invite link required)</span>
                  )}
                </div>

                {/* Friend Search */}
                <div className="mb-2">
                  <div className="relative">
                    <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search friends..."
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Friends List */}
                {searchResults.length === 0 ? (
                  <p className="text-center text-gray-500 text-xs py-6">
                    {searchQuery ? 'No friends found' : 'No friends yet. Add some friends to invite them.'}
                  </p>
                ) : (
                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {searchResults.map(friend => {
                      const isAlreadyMember = isMember(friend.id);
                      const friendName = friend.username || friend.name || 'Unknown User';
                      const friendImage = getProfileImageUrl(friend.profileImage) || '/images/default.webp';

                      return (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-700/60 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={friendImage}
                              alt={friendName}
                              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/images/default.webp'; }}
                            />
                            <div className="min-w-0">
                              <div className="text-[13px] text-gray-200 truncate">{friendName}</div>
                              {friend.email && (
                                <div className="text-[11px] text-gray-500 truncate">{friend.email}</div>
                              )}
                            </div>
                          </div>
                          {isAlreadyMember ? (
                            <span className="px-2 py-0.5 bg-green-500/15 text-green-400 border border-green-500/30 rounded text-[11px] font-medium flex-shrink-0 ml-2">
                              Member
                            </span>
                          ) : (
                            <button
                              onClick={() => sendDMInvite(friend.id, friendName)}
                              disabled={sendingInvites.has(friend.id) || !invite}
                              className="px-2.5 py-1 bg-indigo-700 text-white rounded hover:bg-indigo-800 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-xs flex-shrink-0 ml-2"
                            >
                              {sendingInvites.has(friend.id) ? 'Sending…' : 'Invite'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteModal;

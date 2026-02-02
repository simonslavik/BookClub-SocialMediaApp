import React, { useState, useEffect, useContext } from 'react';
import { FiX, FiCopy, FiTrash2, FiCheck, FiLink, FiUsers, FiSearch } from 'react-icons/fi';
import AuthContext from '../../context';

const InviteModal = ({ bookClubId, bookClubName, onClose }) => {
  const { auth } = useContext(AuthContext);
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Friend search
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [sendingInvites, setSendingInvites] = useState(new Set());

  const GATEWAY_URL = 'http://localhost:3000';

  useEffect(() => {
    fetchInvite();
    fetchFriends();
  }, []);

  const fetchInvite = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${GATEWAY_URL}/v1/editor/bookclubs/${bookClubId}/invite`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      const data = await response.json();
      if (data.success) {
        setInvite(data.invite);
      }
    } catch (error) {
      console.error('Error fetching invite:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch(`${GATEWAY_URL}/v1/friends/list`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setFriends(data.data || []);
        setSearchResults(data.data || []);
      } else {
        setFriends([]);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]);
      setSearchResults([]);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/invite/${invite.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendDMInvite = async (userId, username) => {
    try {
      setSendingInvites(prev => new Set(prev).add(userId));
      
      if (!auth?.token) {
        alert('You must be logged in to send invites');
        return;
      }
      
      if (!invite) {
        alert('Invite link not available');
        return;
      }

      const inviteLink = `${window.location.origin}/invite/${invite.code}`;
      const message = `You've been invited to join "${bookClubName}"! Click here to join: ${inviteLink}`;

      console.log('Sending DM to:', userId, 'Token exists:', !!auth.token);

      // Send DM with invite
      const dmResponse = await fetch(`${GATEWAY_URL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          receiverId: userId,
          content: message
        })
      });

      const responseData = await dmResponse.json();
      console.log('DM Response:', responseData, 'Status:', dmResponse.status);

      if (dmResponse.ok) {
        alert(`Invite sent to ${username}!`);
      } else {
        console.error('Failed to send invite:', responseData);
        alert(`Failed to send invite: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending DM invite:', error);
      alert('Failed to send invite: ' + error.message);
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
        friend.name.toLowerCase().includes(query.toLowerCase()) ||
        friend.email.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Invite to {bookClubName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 100px)' }}>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <>
              {/* Invite Link Section */}
              {invite && (
                <div className="mb-6 p-5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <FiLink className="text-purple-600" size={20} />
                    <h3 className="font-semibold text-gray-900">Permanent Invite Link</h3>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 bg-white px-4 py-3 rounded-lg border border-gray-300 font-mono text-sm text-purple-600">
                      {window.location.origin}/invite/{invite.code}
                    </div>
                    <button
                      onClick={copyInviteLink}
                      className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <FiCheck size={18} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <FiCopy size={18} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Uses: {invite.currentUses} • Never expires • Share with anyone!
                  </p>
                </div>
              )}

              {/* Friends Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FiUsers className="text-gray-600" size={20} />
                  <h3 className="font-semibold text-gray-900">Send to Friends</h3>
                </div>

                {/* Friend Search */}
                <div className="mb-4">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search friends..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Friends List */}
                {searchResults.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    {searchQuery ? 'No friends found' : 'No friends yet. Add some friends to invite them!'}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {searchResults.map(friend => (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={friend.profileImage 
                              ? `http://localhost:3001${friend.profileImage}` 
                              : '/images/default.webp'}
                            alt={friend.name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => { e.target.src = '/images/default.webp'; }}
                          />
                          <div>
                            <div className="font-medium text-gray-900">{friend.name}</div>
                            <div className="text-sm text-gray-600">{friend.email}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => sendDMInvite(friend.id, friend.name)}
                          disabled={sendingInvites.has(friend.id)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                        >
                          {sendingInvites.has(friend.id) ? 'Sending...' : 'Send Invite'}
                        </button>
                      </div>
                    ))}
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

import React, { useState, useEffect } from 'react';
import { FiLink, FiCopy, FiTrash2, FiPlus, FiCheck, FiCalendar, FiUsers } from 'react-icons/fi';
import { bookclubAPI } from '@api/bookclub.api';
import logger from '@utils/logger';

const InviteLinkManager = ({ bookclubId, userRole }) => {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [maxUses, setMaxUses] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const isAdmin = userRole && ['OWNER', 'ADMIN'].includes(userRole);

  useEffect(() => {
    if (isAdmin) {
      fetchInvites();
    }
  }, [bookclubId, isAdmin]);

  const fetchInvites = async () => {
    try {
      const response = await bookclubAPI.getInvites(bookclubId);
      setInvites(response.data || []);
    } catch (error) {
      logger.error('Failed to fetch invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    setCreating(true);
    try {
      const payload = {};
      if (maxUses) payload.maxUses = parseInt(maxUses);
      if (expiresInDays) payload.expiresInDays = parseInt(expiresInDays);

      const response = await bookclubAPI.createInvite(bookclubId, payload);
      setInvites([response.data, ...invites]);
      setShowCreateForm(false);
      setMaxUses('');
      setExpiresInDays('');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create invite');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteInvite = async (inviteId) => {
    if (!confirm('Are you sure you want to delete this invite?')) return;

    try {
      await bookclubAPI.deleteInvite(bookclubId, inviteId);
      setInvites(invites.filter(inv => inv.id !== inviteId));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete invite');
    }
  };

  const handleCopyInviteLink = (code) => {
    const inviteUrl = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isMaxedOut = (invite) => {
    if (!invite.maxUses) return false;
    return invite.currentUses >= invite.maxUses;
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FiLink className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold text-gray-900 font-display">Invite Links</h3>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors font-outfit flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Create Invite
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-purple-50 rounded-xl p-4 mb-4 border-2 border-purple-200">
          <h4 className="font-semibold text-gray-900 mb-3 font-outfit">Create New Invite</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-outfit">
                Max Uses (Optional)
              </label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                min="1"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none font-outfit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-outfit">
                Expires In (Days, Optional)
              </label>
              <input
                type="number"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                placeholder="Never expires"
                min="1"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none font-outfit"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateInvite}
                disabled={creating}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors font-outfit ${
                  creating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors font-outfit"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invites list */}
      {invites.length === 0 ? (
        <div className="text-center py-8">
          <FiLink className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-outfit">No invite links yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invites.map((invite) => {
            const expired = isExpired(invite.expiresAt);
            const maxedOut = isMaxedOut(invite);
            const isInvalid = expired || maxedOut;

            return (
              <div
                key={invite.id}
                className={`border-2 rounded-xl p-4 ${
                  isInvalid ? 'border-gray-200 bg-gray-50' : 'border-purple-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <code className={`px-3 py-1 rounded-lg font-mono text-sm ${
                        isInvalid ? 'bg-gray-200 text-gray-500' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {invite.code}
                      </code>
                      {expired && (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                          Expired
                        </span>
                      )}
                      {maxedOut && (
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-semibold">
                          Max Uses Reached
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {invite.maxUses && (
                        <div className="flex items-center gap-1">
                          <FiUsers className="w-4 h-4" />
                          <span className="font-outfit">
                            {invite.currentUses}/{invite.maxUses} uses
                          </span>
                        </div>
                      )}
                      {!invite.maxUses && (
                        <div className="flex items-center gap-1">
                          <FiUsers className="w-4 h-4" />
                          <span className="font-outfit">{invite.currentUses} uses</span>
                        </div>
                      )}
                      {invite.expiresAt && (
                        <div className="flex items-center gap-1">
                          <FiCalendar className="w-4 h-4" />
                          <span className="font-outfit">
                            Expires {new Date(invite.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyInviteLink(invite.code)}
                      className={`p-2 rounded-lg transition-colors ${
                        isInvalid
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : copiedCode === invite.code
                          ? 'bg-green-500 text-white'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                      disabled={isInvalid}
                      title="Copy invite link"
                    >
                      {copiedCode === invite.code ? (
                        <FiCheck className="w-4 h-4" />
                      ) : (
                        <FiCopy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteInvite(invite.id)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete invite"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InviteLinkManager;

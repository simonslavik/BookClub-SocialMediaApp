import React, { useState } from 'react';
import { FiUsers, FiShield, FiUserX, FiChevronDown } from 'react-icons/fi';
import { bookclubAPI } from '../../../api/bookclub.api';

const ROLE_COLORS = {
  OWNER: 'bg-purple-100 text-purple-700 border-purple-300',
  ADMIN: 'bg-blue-100 text-blue-700 border-blue-300',
  MODERATOR: 'bg-green-100 text-green-700 border-green-300',
  MEMBER: 'bg-gray-100 text-gray-700 border-gray-300',
};

const ROLE_ORDER = ['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER'];

const MemberManagement = ({ bookclub, currentUserId, currentUserRole, onMemberUpdate }) => {
  const [processingUserId, setProcessingUserId] = useState(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(null);

  const isOwner = currentUserRole === 'OWNER';
  const isAdmin = ['OWNER', 'ADMIN'].includes(currentUserRole);

  const handleRoleChange = async (userId, newRole) => {
    if (!isOwner) {
      alert('Only the owner can change roles');
      return;
    }

    setProcessingUserId(userId);
    try {
      await bookclubAPI.updateMemberRole(bookclub.id, userId, newRole);
      onMemberUpdate?.();
      setShowRoleDropdown(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update role');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!isAdmin) {
      alert('Only admins and owners can remove members');
      return;
    }

    if (!confirm('Are you sure you want to remove this member?')) return;

    setProcessingUserId(userId);
    try {
      await bookclubAPI.removeMember(bookclub.id, userId);
      onMemberUpdate?.();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setProcessingUserId(null);
    }
  };

  const sortedMembers = [...(bookclub.members || [])].sort((a, b) => {
    const aIndex = ROLE_ORDER.indexOf(a.role);
    const bIndex = ROLE_ORDER.indexOf(b.role);
    if (aIndex !== bIndex) return aIndex - bIndex;
    return new Date(a.joinedAt) - new Date(b.joinedAt);
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <FiUsers className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-bold text-gray-900 font-display">Members</h3>
        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
          {sortedMembers.length}
        </span>
      </div>

      <div className="space-y-2">
        {sortedMembers.map((member) => {
          const isCurrentUser = member.userId === currentUserId;
          const canChangeRole = isOwner && !isCurrentUser && member.role !== 'OWNER';
          const canRemove = isAdmin && !isCurrentUser && member.role !== 'OWNER';
          const isProcessing = processingUserId === member.userId;

          return (
            <div
              key={member.id}
              className={`border-2 rounded-xl p-4 transition-colors ${
                isCurrentUser ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-purple-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                    {member.userId?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 font-outfit">
                        User ID: {member.userId}
                      </p>
                      {isCurrentUser && (
                        <span className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded text-xs font-semibold">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 font-outfit">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Role badge/dropdown */}
                  {canChangeRole ? (
                    <div className="relative">
                      <button
                        onClick={() => setShowRoleDropdown(showRoleDropdown === member.userId ? null : member.userId)}
                        disabled={isProcessing}
                        className={`px-3 py-1.5 rounded-lg border-2 font-semibold text-sm flex items-center gap-1 transition-colors ${
                          ROLE_COLORS[member.role]
                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                      >
                        {member.role}
                        <FiChevronDown className="w-4 h-4" />
                      </button>

                      {showRoleDropdown === member.userId && (
                        <div className="absolute right-0 top-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-10 min-w-[140px]">
                          {ROLE_ORDER.filter(role => role !== 'OWNER').map(role => (
                            <button
                              key={role}
                              onClick={() => handleRoleChange(member.userId, role)}
                              className={`w-full px-4 py-2 text-left text-sm font-semibold hover:bg-gray-50 transition-colors ${
                                role === member.role ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                              } ${role === 'ADMIN' ? 'rounded-t-lg' : ''} ${role === 'MEMBER' ? 'rounded-b-lg' : ''}`}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className={`px-3 py-1.5 rounded-lg border-2 font-semibold text-sm ${ROLE_COLORS[member.role]}`}>
                      {member.role}
                    </span>
                  )}

                  {/* Remove button */}
                  {canRemove && (
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      disabled={isProcessing}
                      className={`p-2 rounded-lg transition-colors ${
                        isProcessing
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                      title="Remove member"
                    >
                      {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FiUserX className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role legend */}
      <div className="mt-6 pt-6 border-t-2 border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-2 font-outfit flex items-center gap-2">
          <FiShield className="w-4 h-4" />
          Role Permissions
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>
            <span className="font-semibold">OWNER:</span> Full control
          </div>
          <div>
            <span className="font-semibold">ADMIN:</span> Manage members, approve requests
          </div>
          <div>
            <span className="font-semibold">MODERATOR:</span> Moderate content
          </div>
          <div>
            <span className="font-semibold">MEMBER:</span> Regular access
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberManagement;

import React, { useState } from 'react';
import { FiUsers, FiShield, FiUserX, FiChevronDown } from 'react-icons/fi';
import { bookclubAPI } from '@api/bookclub.api';
import { getProfileImageUrl } from '@config/constants';
import logger from '@utils/logger';
import { useConfirm, useToast } from '@hooks/useUIFeedback';

const ROLE_COLORS = {
  OWNER: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  ADMIN: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  MODERATOR: 'bg-green-500/15 text-green-400 border-green-500/30',
  MEMBER: 'bg-gray-700 text-gray-300 border-gray-600',
};

const ROLE_ORDER = ['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER'];

const MemberManagement = ({ bookclub, currentUserId, currentUserRole, onMemberUpdate }) => {
  const [processingUserId, setProcessingUserId] = useState(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(null);
  const [optimisticRoles, setOptimisticRoles] = useState({});

  const isOwner = currentUserRole === 'OWNER';
  const isAdmin = currentUserRole && ['OWNER', 'ADMIN'].includes(currentUserRole);
  const { confirm } = useConfirm();
  const { toastError, toastWarning } = useToast();

  // Debug logging
  logger.debug('MemberManagement Debug:', {
    bookclub,
    members: bookclub?.members,
    memberCount: bookclub?.members?.length,
    currentUserId,
    currentUserRole,
    firstMember: bookclub?.members?.[0]
  });

  const handleRoleChange = async (userId, newRole) => {
    if (!isOwner) {
      toastWarning('Only the owner can change roles');
      return;
    }

    setProcessingUserId(userId);
    // Optimistically update the role immediately
    setOptimisticRoles(prev => ({ ...prev, [userId]: newRole }));
    
    try {
      await bookclubAPI.updateMemberRole(bookclub.id, userId, newRole);
      await onMemberUpdate?.();
      setShowRoleDropdown(null);
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticRoles(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      toastError(error.response?.data?.message || 'Failed to update role');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!isAdmin) {
      toastWarning('Only admins and owners can remove members');
      return;
    }

    const ok = await confirm('Are you sure you want to remove this member?', { title: 'Remove Member', variant: 'danger', confirmLabel: 'Remove' });
    if (!ok) return;

    setProcessingUserId(userId);
    try {
      await bookclubAPI.removeMember(bookclub.id, userId);
      onMemberUpdate?.();
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setProcessingUserId(null);
    }
  };

  const sortedMembers = [...(bookclub.members || [])].sort((a, b) => {
    const aIndex = ROLE_ORDER.indexOf(a.role);
    const bIndex = ROLE_ORDER.indexOf(b.role);
    if (aIndex !== bIndex) return aIndex - bIndex;
    return new Date(a.joinedAt || 0).getTime() - new Date(b.joinedAt || 0).getTime();
  });

  logger.debug('Sorted Members:', sortedMembers);

  if (!bookclub || !bookclub.members || bookclub.members.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <FiUsers className="w-3.5 h-3.5 text-indigo-500" />
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Members</h3>
          <span className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-full text-[10px] font-medium leading-none">
            0
          </span>
        </div>
        <p className="text-gray-500 text-xs text-center py-6">No members found</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <FiUsers className="w-3.5 h-3.5 text-indigo-500" />
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Members</h3>
        <span className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-full text-[10px] font-medium leading-none">
          {sortedMembers.length}
        </span>
      </div>

      <div className="space-y-1">
        {sortedMembers.map((member) => {
          const memberRole = optimisticRoles[member.id] || member.role || 'MEMBER';
          const isCurrentUser = member.id === currentUserId;
          const canChangeRole = isOwner && !isCurrentUser && memberRole !== 'OWNER';
          const canRemove = isAdmin && !isCurrentUser && memberRole !== 'OWNER';
          const isProcessing = processingUserId === member.id;

          return (
            <div
              key={member.id}
              className={`border rounded-md px-2.5 py-2 transition-colors ${
                isCurrentUser
                  ? 'border-indigo-500/40 bg-indigo-500/[0.06]'
                  : 'border-transparent hover:border-gray-700 hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <img
                    src={getProfileImageUrl(member.profileImage) || '/images/default.webp'}
                    alt={member.username}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/default.webp'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-medium text-white truncate">
                        {member.username || 'Unknown User'}
                      </p>
                      {isCurrentUser && (
                        <span className="text-[10px] text-gray-500 leading-none">(you)</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500">
                      {member.joinedAt
                        ? `Joined ${new Date(member.joinedAt).toLocaleDateString()}`
                        : 'Member'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Role badge/dropdown */}
                  {canChangeRole ? (
                    <div className="relative">
                      <button
                        onClick={() => setShowRoleDropdown(showRoleDropdown === member.id ? null : member.id)}
                        disabled={isProcessing}
                        className={`px-1.5 py-0.5 rounded border text-[10px] font-medium flex items-center gap-0.5 leading-none transition-colors ${
                          ROLE_COLORS[memberRole]
                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                      >
                        {memberRole}
                        <FiChevronDown className="w-2.5 h-2.5" />
                      </button>

                      {showRoleDropdown === member.id && (
                        <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded shadow-xl z-10 min-w-[120px] p-0.5">
                          {ROLE_ORDER.filter(role => role !== 'OWNER').map(role => (
                            <button
                              key={role}
                              onClick={() => handleRoleChange(member.id, role)}
                              className={`w-full px-2 py-1 text-left text-xs rounded transition-colors ${
                                role === memberRole
                                  ? 'bg-indigo-500/20 text-indigo-300'
                                  : 'text-gray-300 hover:bg-gray-700'
                              }`}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium leading-none ${ROLE_COLORS[memberRole]}`}>
                      {memberRole}
                    </span>
                  )}

                  {/* Remove button */}
                  {canRemove && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={isProcessing}
                      className={`p-1 rounded transition-colors ${
                        isProcessing
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                      }`}
                      title="Remove member"
                    >
                      {isProcessing ? (
                        <div className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FiUserX className="w-3 h-3" />
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
      <div className="mt-4 pt-3 border-t border-gray-700">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
          <FiShield className="w-2.5 h-2.5" />
          Role Permissions
        </p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
          <div><span className="text-gray-400 font-medium">Owner:</span> Full control</div>
          <div><span className="text-gray-400 font-medium">Admin:</span> Manage members, approve requests</div>
          <div><span className="text-gray-400 font-medium">Moderator:</span> Moderate content</div>
          <div><span className="text-gray-400 font-medium">Member:</span> Regular access</div>
        </div>
      </div>
    </div>
  );
};

export default MemberManagement;

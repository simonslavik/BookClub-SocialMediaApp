import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiHash, FiLock, FiVolume2, FiUsers, FiTrash2, FiAlertTriangle, FiSearch, FiUserPlus, FiUserMinus, FiSettings, FiShield } from 'react-icons/fi';
import { bookclubAPI } from '@api/bookclub.api';
import { getProfileImageUrl } from '@config/constants';
import logger from '@utils/logger';

const ROOM_TYPES = [
  { value: 'PUBLIC', label: 'Public', icon: FiHash, description: 'Anyone in the book club can see and send messages', color: 'text-gray-400' },
  { value: 'PRIVATE', label: 'Private', icon: FiLock, description: 'Everyone can see this room, but only invited members can access it', color: 'text-yellow-400' },
  { value: 'ANNOUNCEMENT', label: 'Announcement', icon: FiVolume2, description: 'Everyone can read, only moderators+ can post', color: 'text-blue-400' },
];

const TABS = [
  { id: 'general', label: 'General', icon: FiSettings },
  { id: 'members', label: 'Members', icon: FiUsers },
  { id: 'danger', label: 'Danger Zone', icon: FiAlertTriangle },
];

// ─── General Tab ──────────────────────────────────────────────
const GeneralTab = ({ form, setForm, room, saving, onSave, error, userRole }) => {
  const canChangeType = ['OWNER', 'ADMIN'].includes(userRole) && !room.isDefault;

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-500/20 text-red-400 text-sm p-3 rounded border border-red-500/30">{error}</div>
      )}

      {/* Room Name */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-1">Room Name</label>
        <div className="relative">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
            maxLength={50}
            className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-600 focus:border-purple-500 focus:outline-none text-sm"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">
            {form.name.length}/50
          </span>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
          placeholder="What's this room for?"
          maxLength={200}
          rows={2}
          className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-600 focus:border-purple-500 focus:outline-none text-sm resize-none"
        />
        <span className="text-[10px] text-gray-500">{form.description.length}/200</span>
      </div>

      {/* Room Type */}
      {canChangeType && (
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Room Type</label>
          <div className="space-y-2">
            {ROOM_TYPES.map((rt) => {
              const Icon = rt.icon;
              const isSelected = form.type === rt.value;
              return (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, type: rt.value }))}
                  className={`w-full flex items-start gap-3 p-3 rounded border transition-colors text-left ${
                    isSelected ? 'border-purple-500 bg-purple-500/10' : 'border-gray-600 bg-gray-900 hover:border-gray-500'
                  }`}
                >
                  <Icon size={18} className={`mt-0.5 flex-shrink-0 ${isSelected ? 'text-purple-400' : rt.color}`} />
                  <div>
                    <p className={`text-sm font-medium ${isSelected ? 'text-purple-300' : 'text-white'}`}>{rt.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{rt.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Current type badge (for non-admin or default rooms) */}
      {!canChangeType && (
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-1">Room Type</label>
          <div className="flex items-center gap-2 text-gray-400 text-sm bg-gray-900 px-3 py-2 rounded border border-gray-700">
            {room.type === 'PRIVATE' ? <FiLock size={14} className="text-yellow-400" /> :
             room.type === 'ANNOUNCEMENT' ? <FiVolume2 size={14} className="text-blue-400" /> :
             <FiHash size={14} />}
            {ROOM_TYPES.find(t => t.value === room.type)?.label || room.type}
            {room.isDefault && <span className="ml-auto text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">Default</span>}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-1">
        <button
          onClick={onSave}
          disabled={saving || !form.name.trim()}
          className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

// ─── Members Tab ──────────────────────────────────────────────
const MembersTab = ({ room, bookClubId, allMembers, currentUserId, userRole }) => {
  const [roomMembers, setRoomMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingMember, setAddingMember] = useState(null);
  const [removingMember, setRemovingMember] = useState(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [error, setError] = useState('');

  const canManageMembers = ['OWNER', 'ADMIN', 'MODERATOR'].includes(userRole);

  const fetchMembers = useCallback(async () => {
    if (room.type !== 'PRIVATE') return;
    setLoadingMembers(true);
    try {
      const data = await bookclubAPI.getRoomMembers(bookClubId, room.id);
      setRoomMembers(data.members || []);
    } catch (err) {
      logger.error('Error fetching room members:', err);
    } finally {
      setLoadingMembers(false);
    }
  }, [bookClubId, room.id, room.type]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleAddMember = async (userId) => {
    setAddingMember(userId);
    setError('');
    try {
      await bookclubAPI.addRoomMembers(bookClubId, room.id, [userId]);
      await fetchMembers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setAddingMember(null);
    }
  };

  const handleRemoveMember = async (userId) => {
    setRemovingMember(userId);
    setError('');
    try {
      await bookclubAPI.removeRoomMember(bookClubId, room.id, userId);
      await fetchMembers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove member');
    } finally {
      setRemovingMember(null);
    }
  };

  // For non-private rooms: show a simple informational message
  if (room.type !== 'PRIVATE') {
    return (
      <div className="text-center py-8">
        <FiUsers size={32} className="mx-auto text-gray-500 mb-3" />
        <p className="text-gray-400 text-sm">
          {room.type === 'ANNOUNCEMENT'
            ? 'Announcement rooms are visible to all book club members.'
            : 'Public rooms are open to all book club members.'}
        </p>
        <p className="text-gray-500 text-xs mt-1">Member management is only available for private rooms.</p>
      </div>
    );
  }

  const roomMemberIds = new Set(roomMembers.map(m => m.userId));
  const nonMembers = (allMembers || []).filter(m =>
    !roomMemberIds.has(m.id) &&
    m.id !== currentUserId &&
    (!searchQuery || m.username?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/20 text-red-400 text-sm p-3 rounded border border-red-500/30">{error}</div>
      )}

      {/* Current Members */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-gray-300 text-sm font-medium">
            Current Members <span className="text-gray-500">({roomMembers.length})</span>
          </h4>
          {canManageMembers && (
            <button
              onClick={() => setShowAddSection(!showAddSection)}
              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              <FiUserPlus size={12} />
              {showAddSection ? 'Hide' : 'Add Members'}
            </button>
          )}
        </div>

        {loadingMembers ? (
          <div className="text-gray-500 text-sm text-center py-4">Loading members...</div>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {roomMembers.map((member) => {
              const userDetails = allMembers?.find(m => m.id === member.userId);
              const isCurrentUser = member.userId === currentUserId;
              return (
                <div
                  key={member.userId}
                  className="flex items-center gap-2 px-3 py-2 rounded bg-gray-900 border border-gray-700"
                >
                  <img
                    src={getProfileImageUrl(userDetails?.profileImage) || '/images/default.webp'}
                    alt=""
                    className="w-7 h-7 rounded-full flex-shrink-0 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {userDetails?.username || member.userId}
                      {isCurrentUser && <span className="text-gray-500 text-xs ml-1">(you)</span>}
                    </p>
                  </div>
                  {canManageMembers && !isCurrentUser && (
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      disabled={removingMember === member.userId}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Remove member"
                    >
                      {removingMember === member.userId ? (
                        <span className="text-xs">...</span>
                      ) : (
                        <FiUserMinus size={14} />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
            {roomMembers.length === 0 && (
              <p className="text-gray-500 text-xs text-center py-3">No members yet</p>
            )}
          </div>
        )}
      </div>

      {/* Add Members Section */}
      {showAddSection && canManageMembers && (
        <div>
          <h4 className="text-gray-300 text-sm font-medium mb-2">Add Members</h4>
          <div className="relative mb-2">
            <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search book club members..."
              className="w-full bg-gray-900 text-white pl-8 pr-3 py-2 rounded border border-gray-600 focus:border-purple-500 focus:outline-none text-sm"
            />
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto rounded border border-gray-700 bg-gray-900">
            {nonMembers.length === 0 ? (
              <p className="text-gray-500 text-xs p-3 text-center">
                {searchQuery ? 'No matching members found' : 'All book club members are already in this room'}
              </p>
            ) : (
              nonMembers.slice(0, 30).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 transition-colors"
                >
                  <img
                    src={getProfileImageUrl(member.profileImage) || '/images/default.webp'}
                    alt=""
                    className="w-6 h-6 rounded-full flex-shrink-0 object-cover"
                  />
                  <span className="text-sm text-gray-300 flex-1 truncate">{member.username}</span>
                  <button
                    onClick={() => handleAddMember(member.id)}
                    disabled={addingMember === member.id}
                    className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:opacity-50"
                  >
                    {addingMember === member.id ? '...' : 'Add'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Danger Zone Tab ──────────────────────────────────────────
const DangerZoneTab = ({ room, onDelete, userRole }) => {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const canDelete = ['OWNER', 'ADMIN'].includes(userRole) && !room.isDefault;

  return (
    <div className="space-y-6">
      {room.isDefault && (
        <div className="bg-gray-700/40 border border-gray-600 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <FiShield size={16} className="text-blue-400 flex-shrink-0" />
            <span>This is the default room and cannot be deleted.</span>
          </div>
        </div>
      )}

      {canDelete && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 space-y-4">
          <div className="flex items-start gap-3">
            <FiAlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-400 font-medium text-sm">Delete Room</h4>
              <p className="text-gray-400 text-xs mt-1">
                This will permanently delete <span className="text-white font-medium">#{room.name}</span> and
                all of its messages. This action cannot be undone.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-xs mb-1">
              Type <span className="text-white font-mono">{room.name}</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={room.name}
              className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-red-500/30 focus:border-red-500 focus:outline-none text-sm"
            />
          </div>

          <button
            onClick={async () => {
              setDeleting(true);
              try {
                await onDelete(room);
              } finally {
                setDeleting(false);
              }
            }}
            disabled={deleting || confirmText !== room.name}
            className="w-full px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            {deleting ? 'Deleting...' : 'Permanently Delete Room'}
          </button>
        </div>
      )}

      {!canDelete && !room.isDefault && (
        <div className="text-center py-8">
          <FiAlertTriangle size={32} className="mx-auto text-gray-500 mb-3" />
          <p className="text-gray-400 text-sm">Only Admins and Owners can delete rooms.</p>
        </div>
      )}
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────
const RoomSettingsModal = ({ isOpen, onClose, room, bookClubId, allMembers, currentUserId, userRole, onRoomUpdated, onRoomDeleted }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState({ name: '', description: '', type: 'PUBLIC' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && room) {
      setForm({
        name: room.name || '',
        description: room.description || '',
        type: room.type || 'PUBLIC',
      });
      setActiveTab('general');
      setError('');
    }
  }, [isOpen, room]);

  if (!isOpen || !room) return null;

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Room name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updates = {};
      if (form.name.trim() !== room.name) updates.name = form.name.trim();
      if ((form.description || '') !== (room.description || '')) updates.description = form.description.trim();
      if (form.type !== room.type && !room.isDefault) updates.type = form.type;

      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      const data = await bookclubAPI.updateRoom(bookClubId, room.id, updates);
      onRoomUpdated(data.room);
      onClose();
    } catch (err) {
      logger.error('Error updating room:', err);
      setError(err.response?.data?.error || err.message || 'Failed to update room');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await bookclubAPI.deleteRoom(bookClubId, room.id);
      onRoomDeleted(room);
      onClose();
    } catch (err) {
      logger.error('Error deleting room:', err);
      setError(err.response?.data?.error || err.message || 'Failed to delete room');
      throw err; // re-throw so DangerZoneTab can reset loading state
    }
  };

  const RoomIcon = room.type === 'PRIVATE' ? FiLock : room.type === 'ANNOUNCEMENT' ? FiVolume2 : FiHash;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-lg w-full max-w-lg border border-gray-700 shadow-xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <RoomIcon size={18} className={
              room.type === 'PRIVATE' ? 'text-yellow-400' :
              room.type === 'ANNOUNCEMENT' ? 'text-blue-400' :
              'text-gray-400'
            } />
            <h2 className="text-white font-semibold text-lg truncate">Room Settings</h2>
            <span className="text-gray-500 text-sm truncate">#{room.name}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-2">
            <FiX size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 flex-shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            // Hide danger tab for non-admins who can't delete
            if (tab.id === 'danger' && !['OWNER', 'ADMIN'].includes(userRole)) return null;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? 'text-purple-400 border-purple-400'
                    : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-600'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {activeTab === 'general' && (
            <GeneralTab
              form={form}
              setForm={setForm}
              room={room}
              saving={saving}
              onSave={handleSave}
              error={error}
              userRole={userRole}
            />
          )}
          {activeTab === 'members' && (
            <MembersTab
              room={room}
              bookClubId={bookClubId}
              allMembers={allMembers}
              currentUserId={currentUserId}
              userRole={userRole}
            />
          )}
          {activeTab === 'danger' && (
            <DangerZoneTab
              room={room}
              onDelete={handleDelete}
              userRole={userRole}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomSettingsModal;

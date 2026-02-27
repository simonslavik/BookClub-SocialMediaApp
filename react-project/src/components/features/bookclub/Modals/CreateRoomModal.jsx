import React, { useState, useEffect } from 'react';
import { FiX, FiHash, FiLock, FiVolume2 } from 'react-icons/fi';
import { getProfileImageUrl } from '@config/constants';
import logger from '@utils/logger';

const ROOM_TYPES = [
  {
    value: 'PUBLIC',
    label: 'Public',
    icon: FiHash,
    description: 'Anyone in the book club can see and send messages',
    color: 'text-gray-400'
  },
  {
    value: 'PRIVATE',
    label: 'Private',
    icon: FiLock,
    description: 'Everyone can see this room, but only invited members can access it',
    color: 'text-yellow-400'
  },
  {
    value: 'ANNOUNCEMENT',
    label: 'Announcement',
    icon: FiVolume2,
    description: 'Everyone can read, only moderators+ can post',
    color: 'text-blue-400'
  }
];

const CreateRoomModal = ({ isOpen, onClose, onCreateRoom, members, currentUserId }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('PUBLIC');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setType('PUBLIC');
      setSelectedMembers([]);
      setMemberSearch('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredMembers = (members || []).filter(m => {
    if (m.id === currentUserId) return false;
    if (selectedMembers.includes(m.id)) return false;
    if (memberSearch) {
      return m.username?.toLowerCase().includes(memberSearch.toLowerCase());
    }
    return true;
  });

  const toggleMember = (memberId) => {
    setSelectedMembers(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const removeMember = (memberId) => {
    setSelectedMembers(prev => prev.filter(id => id !== memberId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Room name is required');
      return;
    }

    if (name.trim().length > 50) {
      setError('Room name must be 50 characters or less');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const roomData = {
        name: name.trim(),
        type,
        ...(description.trim() && { description: description.trim() }),
        ...(type === 'PRIVATE' && selectedMembers.length > 0 && { memberIds: selectedMembers })
      };

      await onCreateRoom(roomData);
      onClose();
    } catch (err) {
      logger.error('Error creating room:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const selectedTypeInfo = ROOM_TYPES.find(t => t.value === type);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-lg w-full max-w-md border border-gray-700 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-white font-semibold text-lg">Create Room</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-500/20 text-red-400 text-sm p-3 rounded border border-red-500/30">
              {error}
            </div>
          )}

          {/* Room Name */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1">Room Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. discussion, spoilers, off-topic"
              maxLength={50}
              className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-600 focus:border-purple-500 focus:outline-none text-sm"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1">
              Description <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this room for?"
              maxLength={200}
              className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-600 focus:border-purple-500 focus:outline-none text-sm"
            />
          </div>

          {/* Room Type */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Room Type</label>
            <div className="space-y-2">
              {ROOM_TYPES.map((roomType) => {
                const Icon = roomType.icon;
                const isSelected = type === roomType.value;
                return (
                  <button
                    key={roomType.value}
                    type="button"
                    onClick={() => setType(roomType.value)}
                    className={`w-full flex items-start gap-3 p-3 rounded border transition-colors text-left ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-600 bg-gray-900 hover:border-gray-500'
                    }`}
                  >
                    <Icon size={18} className={`mt-0.5 flex-shrink-0 ${isSelected ? 'text-purple-400' : roomType.color}`} />
                    <div>
                      <p className={`text-sm font-medium ${isSelected ? 'text-purple-300' : 'text-white'}`}>
                        {roomType.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{roomType.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Member Selection (Private rooms only) */}
          {type === 'PRIVATE' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">
                Add Members <span className="text-gray-500">(you are added automatically)</span>
              </label>

              {/* Selected Members Chips */}
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedMembers.map((memberId) => {
                    const member = members?.find(m => m.id === memberId);
                    return (
                      <span
                        key={memberId}
                        className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full border border-purple-500/30"
                      >
                        {member?.username || 'Unknown'}
                        <button
                          type="button"
                          onClick={() => removeMember(memberId)}
                          className="hover:text-white"
                        >
                          <FiX size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Search Members */}
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search members..."
                className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-600 focus:border-purple-500 focus:outline-none text-sm mb-2"
              />

              {/* Member List */}
              <div className="max-h-32 overflow-y-auto rounded border border-gray-700 bg-gray-900">
                {filteredMembers.length === 0 ? (
                  <p className="text-gray-500 text-xs p-2 text-center">
                    {memberSearch ? 'No members found' : 'No more members to add'}
                  </p>
                ) : (
                  filteredMembers.slice(0, 20).map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMember(member.id)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-800 transition-colors text-left"
                    >
                      <img
                        src={getProfileImageUrl(member.profileImage) || '/images/default.webp'}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-sm text-gray-300">{member.username}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;

import { useState } from 'react';
import { FiSettings as FiSettingsIcon, FiLock, FiUnlock, FiEyeOff, FiImage, FiTrash2, FiX, FiAlertTriangle } from 'react-icons/fi';
import { getCollabImageUrl, BOOKCLUB_CATEGORIES } from '@config/constants';
import AdminApprovalPanel from '@components/features/bookclub/AdminApprovalPanel';
import MemberManagement from '@components/features/bookclub/MemberManagement';

/**
 * Settings panel for a bookclub — general info, visibility, image, members.
 *
 * Props:
 *  - bookClub, settingsForm, setSettingsForm, savingSettings
 *  - handleSaveSettings, uploadingImage, fileInputRef
 *  - handleImageUpload, handleDeleteImage
 *  - bookClubId, mappedBookClubMembers, userRole
 *  - auth, onMemberUpdate, onClose
 */
const BookclubSettingsPanel = ({
  bookClub,
  settingsForm,
  setSettingsForm,
  savingSettings,
  handleSaveSettings,
  uploadingImage,
  fileInputRef,
  handleImageUpload,
  handleDeleteImage,
  bookClubId,
  mappedBookClubMembers,
  userRole,
  auth,
  onMemberUpdate,
  onClose,
  onDeleteBookclub,
}) => {
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingBookclub, setDeletingBookclub] = useState(false);
  const isOwner = userRole === 'OWNER';
  const expectedConfirm = bookClub?.name || '';

  return (
  <div className="flex-1 overflow-y-auto bg-gray-900 p-3 md:p-4">
    {/* Header */}
    <div className="flex items-center justify-between mb-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <FiSettingsIcon className="w-3.5 h-3.5 text-indigo-500" />
        <h2 className="text-sm font-semibold text-white">Bookclub Settings</h2>
      </div>
      <button
        onClick={onClose}
        className="p-1 hover:bg-gray-800 rounded transition-colors"
        aria-label="Close settings"
      >
        <FiX className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
      </button>
    </div>

    <div className="max-w-3xl mx-auto">
    {/* General form */}
    <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">General Settings</h3>
      <form onSubmit={handleSaveSettings} className="space-y-4">
        {/* Image */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">Bookclub Image</label>
          <div className="relative group w-28 h-28 md:w-32 md:h-32">
            <img
              src={bookClub?.imageUrl ? getCollabImageUrl(bookClub.imageUrl) : '/images/default.webp'}
              alt={bookClub?.name}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => { (e.target as HTMLImageElement).src = '/images/default.webp'; }}
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="px-2 py-1 bg-indigo-700 hover:bg-indigo-800 text-white rounded text-xs flex items-center gap-1"
              >
                <FiImage size={12} />
                {uploadingImage ? '…' : 'Change'}
              </button>
              {bookClub?.imageUrl && (
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs flex items-center gap-1"
                >
                  <FiTrash2 size={12} />
                  Delete
                </button>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Name */}
        <div>
          <label htmlFor="settings-name" className="block text-xs font-medium text-gray-300 mb-1.5">Bookclub Name</label>
          <input
            id="settings-name"
            type="text"
            value={settingsForm.name}
            onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 text-white text-sm rounded focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="settings-desc" className="block text-xs font-medium text-gray-300 mb-1.5">Description</label>
          <textarea
            id="settings-desc"
            value={settingsForm.description}
            onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 text-white text-sm rounded focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="settings-category" className="block text-xs font-medium text-gray-300 mb-1.5">Category</label>
          <select
            id="settings-category"
            value={settingsForm.category}
            onChange={(e) => setSettingsForm({ ...settingsForm, category: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 text-white text-sm rounded focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Select a category</option>
            {BOOKCLUB_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-2">Visibility</label>
          <div className="space-y-1.5">
            {[
              { value: 'PUBLIC', icon: FiUnlock, color: 'text-green-400', label: 'Public', desc: 'Anyone can see and join instantly' },
              { value: 'PRIVATE', icon: FiLock, color: 'text-yellow-400', label: 'Private', desc: 'Anyone can see, join requires approval' },
              { value: 'INVITE_ONLY', icon: FiEyeOff, color: 'text-indigo-500', label: 'Invite Only', desc: 'Only visible to members, join via invite' },
            ].map((opt) => {
              const VisIcon = opt.icon;
              const isSelected = settingsForm.visibility === opt.value;
              return (
              <label
                key={opt.value}
                className={`flex items-center gap-2.5 p-2.5 rounded cursor-pointer border transition-colors ${
                  isSelected
                    ? 'bg-indigo-500/10 border-indigo-500'
                    : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  value={opt.value}
                  checked={isSelected}
                  onChange={(e) => setSettingsForm({ ...settingsForm, visibility: e.target.value })}
                  className="w-3.5 h-3.5"
                />
                <VisIcon size={13} className={`flex-shrink-0 ${opt.color}`} />
                <div className="min-w-0">
                  <span className="text-xs font-medium text-white">{opt.label}</span>
                  <p className="text-[11px] text-gray-400">{opt.desc}</p>
                </div>
              </label>
              );
            })}
          </div>
        </div>

        {/* Approval checkbox */}
        {settingsForm.visibility === 'PRIVATE' && (
          <div className="bg-gray-700 p-2.5 rounded">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settingsForm.requiresApproval}
                onChange={(e) => setSettingsForm({ ...settingsForm, requiresApproval: e.target.checked })}
                className="w-3.5 h-3.5"
              />
              <span className="text-xs font-medium text-white">Require admin approval for join requests</span>
            </label>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={savingSettings}
          className={`w-full px-3 py-1.5 rounded text-xs transition-colors ${
            savingSettings
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-700 text-white hover:bg-indigo-800'
          }`}
        >
          {savingSettings ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>

    {/* Admin panels */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <AdminApprovalPanel bookclubId={bookClubId} userRole={userRole} />
    </div>

    {/* Member management */}
    <MemberManagement
      bookclub={{ ...bookClub, members: mappedBookClubMembers }}
      currentUserId={auth?.user?.id}
      currentUserRole={userRole}
      onMemberUpdate={onMemberUpdate}
    />

    {/* Danger zone — owner only */}
    {isOwner && (
      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 mt-4 space-y-4">
        <div className="flex items-start gap-3">
          <FiAlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-400 font-medium text-sm">Delete Bookclub</h3>
            <p className="text-gray-400 text-xs mt-1">
              This will permanently delete <span className="text-white font-medium">{expectedConfirm}</span>,
              including all rooms, messages, books, meetings and members. This action cannot be undone.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="delete-confirm" className="block text-gray-400 text-xs mb-1">
            Type <span className="text-white font-mono">{expectedConfirm}</span> to confirm
          </label>
          <input
            id="delete-confirm"
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder={expectedConfirm}
            className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-red-500/30 focus:border-red-500 focus:outline-none text-sm"
          />
        </div>

        <button
          type="button"
          onClick={async () => {
            setDeletingBookclub(true);
            try {
              await onDeleteBookclub?.();
            } finally {
              setDeletingBookclub(false);
            }
          }}
          disabled={deletingBookclub || deleteConfirmText !== expectedConfirm || !expectedConfirm}
          className="w-full px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center gap-2"
        >
          <FiTrash2 size={14} />
          {deletingBookclub ? 'Deleting…' : 'Permanently Delete Bookclub'}
        </button>
      </div>
    )}
    </div>
  </div>
  );
};

export default BookclubSettingsPanel;

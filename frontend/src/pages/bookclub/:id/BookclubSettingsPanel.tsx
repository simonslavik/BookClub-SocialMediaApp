import { FiSettings as FiSettingsIcon, FiLock, FiUnlock, FiEyeOff, FiImage, FiTrash2, FiX } from 'react-icons/fi';
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
}) => (
  <div className="flex-1 overflow-y-auto bg-gray-900 p-3 md:p-6">
    {/* Header */}
    <div className="flex items-center justify-between mb-4 md:mb-6">
      <div className="flex items-center gap-2 md:gap-3">
        <FiSettingsIcon className="w-5 h-5 md:w-6 md:h-6 text-stone-500" />
        <h2 className="text-lg md:text-2xl font-bold text-white">Bookclub Settings</h2>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        aria-label="Close settings"
      >
        <FiX className="w-6 h-6 text-gray-400 hover:text-white" />
      </button>
    </div>

    {/* General form */}
    <div className="bg-gray-800 rounded-xl p-4 md:p-6 mb-4 md:mb-6">
      <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">General Settings</h3>
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Image */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Bookclub Image</label>
          <div className="relative group w-36 h-36 md:w-52 md:h-52">
            <img
              src={bookClub?.imageUrl ? getCollabImageUrl(bookClub.imageUrl) : '/images/default.webp'}
              alt={bookClub?.name}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => { e.target.src = '/images/default.webp'; }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-lg">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="px-2 py-1 bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
              >
                <FiImage size={14} />
                {uploadingImage ? 'Uploading...' : 'Change'}
              </button>
              {bookClub?.imageUrl && (
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
                >
                  <FiTrash2 size={14} />
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
          <label htmlFor="settings-name" className="block text-sm font-semibold text-gray-300 mb-2">Bookclub Name</label>
          <input
            id="settings-name"
            type="text"
            value={settingsForm.name}
            onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-stone-500 outline-none"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="settings-desc" className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
          <textarea
            id="settings-desc"
            value={settingsForm.description}
            onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-stone-500 outline-none resize-none"
          />
        </div>

        {/* Category — uses shared constant */}
        <div>
          <label htmlFor="settings-category" className="block text-sm font-semibold text-gray-300 mb-2">Category</label>
          <select
            id="settings-category"
            value={settingsForm.category}
            onChange={(e) => setSettingsForm({ ...settingsForm, category: e.target.value })}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-stone-500 outline-none"
          >
            <option value="">Select a category</option>
            {BOOKCLUB_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">Visibility</label>
          <div className="space-y-3">
            {[
              { value: 'PUBLIC', icon: FiUnlock, color: 'text-green-400', label: 'Public', desc: 'Anyone can see and join instantly' },
              { value: 'PRIVATE', icon: FiLock, color: 'text-yellow-400', label: 'Private', desc: 'Anyone can see, join requires approval' },
              { value: 'INVITE_ONLY', icon: FiEyeOff, color: 'text-stone-500', label: 'Invite Only', desc: 'Only visible to members, join via invite' },
            ].map((opt) => {
              const VisIcon = opt.icon;
              return (
              <label key={opt.value} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-650">
                <input
                  type="radio"
                  value={opt.value}
                  checked={settingsForm.visibility === opt.value}
                  onChange={(e) => setSettingsForm({ ...settingsForm, visibility: e.target.value })}
                  className="w-4 h-4"
                />
                <VisIcon className={opt.color} />
                <div>
                  <span className="font-semibold text-white">{opt.label}</span>
                  <p className="text-sm text-gray-400">{opt.desc}</p>
                </div>
              </label>
              );
            })}
          </div>
        </div>

        {/* Approval checkbox */}
        {settingsForm.visibility === 'PRIVATE' && (
          <div className="bg-gray-700 p-4 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settingsForm.requiresApproval}
                onChange={(e) => setSettingsForm({ ...settingsForm, requiresApproval: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="font-semibold text-white">Require admin approval for join requests</span>
            </label>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={savingSettings}
          className={`w-full px-6 py-3 rounded-xl font-semibold transition-colors ${
            savingSettings
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-stone-700 text-white hover:bg-stone-800'
          }`}
        >
          {savingSettings ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>

    {/* Admin panels */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <AdminApprovalPanel bookclubId={bookClubId} userRole={userRole} />
    </div>

    {/* Member management */}
    <MemberManagement
      bookclub={{ ...bookClub, members: mappedBookClubMembers }}
      currentUserId={auth?.user?.id}
      currentUserRole={userRole}
      onMemberUpdate={onMemberUpdate}
    />
  </div>
);

export default BookclubSettingsPanel;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSettings, FiLock, FiUnlock, FiEyeOff } from 'react-icons/fi';
import { bookclubAPI } from '../../api/bookclub.api';
import HomePageHeader from '../../components/layout/Header';
import AdminApprovalPanel from '../../components/features/bookclub/AdminApprovalPanel';
import MemberManagement from '../../components/features/bookclub/MemberManagement';

const BookclubSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bookclub, setBookclub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [membership, setMembership] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [requiresApproval, setRequiresApproval] = useState(false);

  useEffect(() => {
    fetchBookclub();
  }, [id]);

  const fetchBookclub = async () => {
    try {
      const response = await bookclubAPI.getBookclubFull(id);
      const data = response.data;
      setBookclub(data);
      setName(data.name || '');
      setDescription(data.description || '');
      setCategory(data.category || '');
      setVisibility(data.visibility || 'PUBLIC');
      setRequiresApproval(data.requiresApproval || false);

      // Get current user's membership
      const authData = JSON.parse(localStorage.getItem('auth') || '{}');
      setCurrentUser(authData.user);
      
      const userMembership = data.members?.find(m => m.userId === authData.user?.id);
      setMembership(userMembership);
    } catch (error) {
      console.error('Failed to fetch bookclub:', error);
      if (error.response?.status === 403) {
        alert('You do not have access to this bookclub');
        navigate('/discover');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await bookclubAPI.updateBookclubSettings(id, {
        name,
        description,
        category,
        visibility,
        requiresApproval: visibility === 'PRIVATE' ? requiresApproval : false,
      });
      alert('Settings updated successfully!');
      fetchBookclub();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = membership?.role && ['OWNER', 'ADMIN'].includes(membership.role);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomePageHeader />
        <div className="pt-24 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomePageHeader />
        <div className="pt-24 max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-display">Access Denied</h2>
            <p className="text-gray-600 mb-6 font-outfit">Only admins and owners can access settings</p>
            <button
              onClick={() => navigate(`/bookclubpage/${id}`)}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors font-outfit"
            >
              Back to Book Club
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HomePageHeader />
      
      <div className="pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(`/bookclubpage/${id}`)}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold mb-4 font-outfit"
            >
              <FiArrowLeft className="w-5 h-5" />
              Back to Book Club
            </button>
            <div className="flex items-center gap-3">
              <FiSettings className="w-8 h-8 text-purple-600" />
              <h1 className="text-4xl font-display font-bold text-gray-900">{bookclub.name} Settings</h1>
            </div>
          </div>

          {/* Settings Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 font-display">General Settings</h2>
            <form onSubmit={handleUpdateSettings} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">
                  Book Club Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none font-outfit"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none font-outfit resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-outfit">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none font-outfit"
                >
                  <option value="General">General</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="Mystery">Mystery</option>
                  <option value="Romance">Romance</option>
                  <option value="Science Fiction">Science Fiction</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Thriller">Thriller</option>
                  <option value="Biography">Biography</option>
                  <option value="History">History</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 font-outfit">
                  Visibility
                </label>
                <div className="space-y-3">
                  <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    visibility === 'PUBLIC' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200'
                  }`}>
                    <input
                      type="radio"
                      name="visibility"
                      value="PUBLIC"
                      checked={visibility === 'PUBLIC'}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FiUnlock className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-gray-900 font-outfit">Public</span>
                      </div>
                      <p className="text-sm text-gray-600 font-outfit">Anyone can see and join instantly</p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    visibility === 'PRIVATE' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200'
                  }`}>
                    <input
                      type="radio"
                      name="visibility"
                      value="PRIVATE"
                      checked={visibility === 'PRIVATE'}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FiLock className="w-5 h-5 text-yellow-600" />
                        <span className="font-semibold text-gray-900 font-outfit">Private</span>
                      </div>
                      <p className="text-sm text-gray-600 font-outfit">Anyone can see, join requires approval</p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    visibility === 'INVITE_ONLY' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200'
                  }`}>
                    <input
                      type="radio"
                      name="visibility"
                      value="INVITE_ONLY"
                      checked={visibility === 'INVITE_ONLY'}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FiEyeOff className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-gray-900 font-outfit">Invite Only</span>
                      </div>
                      <p className="text-sm text-gray-600 font-outfit">Only visible to members, join via invite</p>
                    </div>
                  </label>
                </div>
              </div>

              {visibility === 'PRIVATE' && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresApproval}
                      onChange={(e) => setRequiresApproval(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="font-semibold text-gray-900 font-outfit">Require admin approval for join requests</span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className={`w-full px-6 py-3 rounded-xl font-semibold transition-colors font-outfit ${
                  saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>

          {/* Admin Panels */}
          <div className="mb-6">
            <AdminApprovalPanel bookclubId={id} userRole={membership?.role} />
          </div>

          {/* Member Management */}
          <MemberManagement
            bookclub={bookclub}
            currentUserId={currentUser?.id}
            currentUserRole={membership?.role}
            onMemberUpdate={fetchBookclub}
          />
        </div>
      </div>
    </div>
  );
};

export default BookclubSettings;

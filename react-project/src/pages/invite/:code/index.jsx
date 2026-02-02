import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../../../context';
import HomePageHeader from '../../../components/HomePageHeader';
import { FiCheck, FiX, FiUsers, FiBook } from 'react-icons/fi';

const InviteJoinPage = () => {
  const { code } = useParams();
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [error, setError] = useState(null);
  const [joined, setJoined] = useState(false);

  const GATEWAY_URL = 'http://localhost:3000';

  useEffect(() => {
    fetchInviteInfo();
  }, [code]);

  const fetchInviteInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${GATEWAY_URL}/v1/editor/invites/${code}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setInviteInfo(data);
      } else {
        setError(data.error || 'Invalid invite link');
      }
    } catch (err) {
      console.error('Error fetching invite:', err);
      setError('Failed to load invite information');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!auth?.token) {
      // Redirect to login and come back
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      navigate('/login');
      return;
    }

    try {
      setJoining(true);
      const response = await fetch(`${GATEWAY_URL}/v1/editor/invites/${code}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setJoined(true);
        // Redirect to bookclub after a short delay
        setTimeout(() => {
          navigate(`/bookclub/${data.bookClub.id}`);
        }, 2000);
      } else {
        setError(data.error || 'Failed to join book club');
      }
    } catch (err) {
      console.error('Error joining bookclub:', err);
      setError('Failed to join book club');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <HomePageHeader />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-600">Loading invite...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <HomePageHeader />
        <div className="flex items-center justify-center h-screen">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiX size={40} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <HomePageHeader />
        <div className="flex items-center justify-center h-screen">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheck size={40} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h1>
            <p className="text-gray-600 mb-6">
              You've successfully joined <span className="font-semibold">{inviteInfo.bookClub.name}</span>
            </p>
            <p className="text-sm text-gray-500">Redirecting to book club...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <HomePageHeader />
      <div className="flex items-center justify-center min-h-screen py-12">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          {/* Book Club Image */}
          <div className="mb-6">
            <img
              src={inviteInfo.bookClub.imageUrl 
                ? `http://localhost:4000${inviteInfo.bookClub.imageUrl}` 
                : '/images/default.webp'}
              alt={inviteInfo.bookClub.name}
              className="w-full h-48 object-cover rounded-xl"
              onError={(e) => { e.target.src = '/images/default.webp'; }}
            />
          </div>

          {/* Book Club Info */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You've been invited to join
          </h1>
          <h2 className="text-3xl font-bold text-purple-600 mb-4">
            {inviteInfo.bookClub.name}
          </h2>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <FiUsers className="text-purple-600 mx-auto mb-2" size={24} />
              <div className="text-2xl font-bold text-gray-900">
                {inviteInfo.bookClub.memberCount}
              </div>
              <div className="text-sm text-gray-600">Members</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <FiBook className="text-blue-600 mx-auto mb-2" size={24} />
              <div className="text-2xl font-bold text-gray-900">
                {inviteInfo.bookClub.category}
              </div>
              <div className="text-sm text-gray-600">Category</div>
            </div>
          </div>

          {/* Join Button */}
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {joining ? 'Joining...' : auth?.token ? 'Join Book Club' : 'Login to Join'}
          </button>

          {!auth?.token && (
            <p className="text-sm text-gray-500 text-center mt-4">
              You'll be redirected to login and then join the book club
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteJoinPage;

import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '@context/index';
import HomePageHeader from '@components/layout/Header';
import { FiCheck, FiX, FiUsers, FiBook } from 'react-icons/fi';
import { getCollabImageUrl } from '@config/constants';
import apiClient from '@api/axios';
import logger from '@utils/logger';

const InviteJoinPage = () => {
  const { code } = useParams();
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [error, setError] = useState(null);
  const [joined, setJoined] = useState(false);


  useEffect(() => {
    fetchInviteInfo();
  }, [code]);

  const fetchInviteInfo = async () => {
    try {
      setLoading(true);
      logger.debug('Fetching invite info for code:', code);
      const { data } = await apiClient.get(`/v1/invites/${code}`);

      logger.debug('Invite info response:', data);

      if (data.success) {
        setInviteInfo(data);
      } else {
        setError(data.error || data.message || 'Invalid invite link');
      }
    } catch (err) {
      logger.error('Error fetching invite:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load invite information');
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
      logger.debug('Joining via invite code:', code);
      const { data } = await apiClient.post(`/v1/invites/${code}/join`);

      logger.debug('Join response:', data);

      if (data.success) {
        setJoined(true);
        // Redirect to bookclub after a short delay
        setTimeout(() => {
          navigate(`/bookclub/${data.bookClub.id}`);
        }, 2000);
      } else {
        setError(data.error || data.message || 'Failed to join book club');
      }
    } catch (err) {
      logger.error('Error joining bookclub:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to join book club');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <HomePageHeader />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-pulse bg-warmgray-200 w-20 h-20 rounded-full" />
              <div className="animate-pulse bg-warmgray-200 h-6 w-48 rounded" />
              <div className="animate-pulse bg-warmgray-200 h-4 w-64 rounded" />
              <div className="animate-pulse bg-warmgray-200 h-12 w-full rounded-xl mt-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50">
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
              className="px-6 py-3 bg-stone-700 text-white rounded-lg hover:bg-stone-800 transition-colors"
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
      <div className="min-h-screen bg-stone-50">
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
    <div className="min-h-screen bg-stone-50">
      <HomePageHeader />
      <div className="flex items-center justify-center min-h-screen py-12">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          {/* Book Club Image */}
          <div className="mb-6">
            <img
              src={inviteInfo.bookClub.imageUrl 
                ? getCollabImageUrl(inviteInfo.bookClub.imageUrl) 
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
          <h2 className="text-3xl font-bold text-stone-700 mb-4">
            {inviteInfo.bookClub.name}
          </h2>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-stone-50 rounded-lg p-4 text-center">
              <FiUsers className="text-stone-700 mx-auto mb-2" size={24} />
              <div className="text-2xl font-bold text-gray-900">
                {inviteInfo.bookClub.memberCount}
              </div>
              <div className="text-sm text-gray-600">Members</div>
            </div>
            <div className="bg-stone-50 rounded-lg p-4 text-center">
              <FiBook className="text-stone-600 mx-auto mb-2" size={24} />
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
            className="w-full px-6 py-3 bg-stone-700 hover:bg-stone-800 text-white rounded-lg font-semibold shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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

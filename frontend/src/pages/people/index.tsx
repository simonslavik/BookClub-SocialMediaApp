import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiUserPlus, FiCheck, FiClock, FiArrowLeft } from 'react-icons/fi';
import HomePageHeader from '@components/layout/Header';
import { AuthContext } from '@context/index';
import { getProfileImageUrl } from '@config/constants';
import apiClient from '@api/axios';
import logger from '@utils/logger';
import { useToast } from '@hooks/useUIFeedback';

const FindPeople = () => {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();
    const { toastSuccess, toastError, toastWarning } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);

    // Fetch initial data
    useEffect(() => {
        if (!auth?.user) return;
        
        const fetchData = async () => {
            setLoading(true);
            try {
                const [suggestionsRes, friendsRes, requestsRes] = await Promise.all([
                    apiClient.get('/v1/users/suggestions?limit=30'),
                    apiClient.get('/v1/friends/list'),
                    apiClient.get('/v1/friends/requests'),
                ]);
                setSuggestedUsers(suggestionsRes.data?.data || []);
                setFriends(friendsRes.data?.data || []);
                setFriendRequests(requestsRes.data?.data || []);
                
                // Extract sent request recipient IDs from both friend requests and suggestions
                const sentFromRequests = (requestsRes.data?.data || [])
                    .filter(r => r.userId === auth.user.id)
                    .map(r => r.friendId);
                const sentFromSuggestions = (suggestionsRes.data?.data || [])
                    .filter(u => u.friendshipStatus === 'pending')
                    .map(u => u.id);
                setSentRequests([...new Set([...sentFromRequests, ...sentFromSuggestions])]);
            } catch (err) {
                logger.error('Error fetching people data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [auth?.user?.id]);

    // Search users with debounce
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const response = await apiClient.get(`/v1/users/search?q=${encodeURIComponent(searchQuery.trim())}&limit=20`);
                setSearchResults(response.data?.data || []);
            } catch (err) {
                logger.error('Error searching users:', err);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Get all friend IDs for quick lookup
    const friendIds = new Set(friends.map(f => f.friend?.id || f.friendId).filter(Boolean));

    // Check relationship status with a user
    const getRelationship = useCallback((userId) => {
        if (friendIds.has(userId)) return 'friends';
        if (sentRequests.includes(userId)) return 'pending';
        // Check if they sent us a request
        const received = friendRequests.find(r => 
            (r.user?.id === userId || r.userId === userId) && r.friendId === auth?.user?.id
        );
        if (received) return 'received';
        return 'none';
    }, [friendIds, sentRequests, friendRequests, auth]);

    const handleSendFriendRequest = async (userId) => {
        if (!auth?.token) {
            toastWarning('Please log in to send friend requests');
            return;
        }
        try {
            await apiClient.post('/v1/friends/request', { recipientId: userId });
            toastSuccess('Friend request sent!');
            setSentRequests(prev => [...prev, userId]);
            // Remove from suggestions
            setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
            toastError('Failed to send friend request: ' + errorMsg);
        }
    };

    const handleAcceptRequest = async (requestId) => {
        try {
            await apiClient.post('/v1/friends/accept', { friendshipId: requestId });
            toastSuccess('Friend request accepted!');
            // Refresh data
            const [friendsRes, requestsRes] = await Promise.all([
                apiClient.get('/v1/friends/list'),
                apiClient.get('/v1/friends/requests'),
            ]);
            setFriends(friendsRes.data?.data || []);
            setFriendRequests(requestsRes.data?.data || []);
        } catch (err) {
            toastError('Failed to accept request');
        }
    };

    const displayUsers = searchQuery.trim() ? searchResults : suggestedUsers;
    const isSearchMode = searchQuery.trim().length > 0;

    // Filter out self from display
    const filteredUsers = displayUsers.filter(u => u.id !== auth?.user?.id);

    return (
        <div className="min-h-screen bg-warmgray-50 dark:bg-gray-900">
            <HomePageHeader />
            
            <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
                {/* Back button + title */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 rounded-lg hover:bg-warmgray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                        <FiArrowLeft className="w-5 h-5 text-stone-600 dark:text-gray-400" />
                    </button>
                    <h1 className="text-2xl font-bold text-stone-800 dark:text-warmgray-100">
                        Find People
                    </h1>
                </div>

                {/* Search bar */}
                <div className="relative mb-8">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 dark:text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-warmgray-200 dark:border-gray-700 rounded-xl text-stone-800 dark:text-warmgray-100 placeholder-stone-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-gray-600 transition-all text-sm"
                    />
                    {searching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                {/* Pending friend requests received */}
                {!isSearchMode && friendRequests.filter(r => r.friendId === auth?.user?.id).length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-sm font-semibold text-stone-600 dark:text-gray-400 mb-3 uppercase tracking-wide">
                            Friend Requests
                        </h2>
                        <div className="space-y-2">
                            {friendRequests
                                .filter(r => r.friendId === auth?.user?.id)
                                .map((request) => {
                                    const sender = request.user;
                                    if (!sender) return null;
                                    return (
                                        <div
                                            key={request.id}
                                            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-warmgray-200 dark:border-gray-700"
                                        >
                                            <button
                                                onClick={() => navigate(`/profile/${sender.id}`)}
                                                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                                            >
                                                <img
                                                    src={getProfileImageUrl(sender.profileImage) || '/images/default.webp'}
                                                    alt={sender.name}
                                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-200 dark:ring-amber-700 flex-shrink-0"
                                                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                                                />
                                                <span className="text-sm font-medium text-stone-700 dark:text-warmgray-200 truncate">
                                                    {sender.name}
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => handleAcceptRequest(request.id)}
                                                className="px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer font-medium flex-shrink-0"
                                            >
                                                Accept
                                            </button>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {/* Section title */}
                <h2 className="text-sm font-semibold text-stone-600 dark:text-gray-400 mb-4 uppercase tracking-wide">
                    {isSearchMode
                        ? `Search Results${searchResults.length > 0 ? ` (${searchResults.length})` : ''}`
                        : 'People You Might Know'}
                </h2>

                {/* Loading skeleton */}
                {loading && !isSearchMode && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-4 border border-warmgray-200 dark:border-gray-700">
                                <div className="w-16 h-16 rounded-full bg-warmgray-200 dark:bg-gray-700 mx-auto mb-3" />
                                <div className="h-3 bg-warmgray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-2" />
                                <div className="h-7 bg-warmgray-200 dark:bg-gray-700 rounded w-2/3 mx-auto" />
                            </div>
                        ))}
                    </div>
                )}

                {/* User grid */}
                {!loading && filteredUsers.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {filteredUsers.map((user) => {
                            const relationship = getRelationship(user.id);
                            return (
                                <div
                                    key={user.id}
                                    className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-warmgray-200 dark:border-gray-700 hover:shadow-md hover:border-stone-300 dark:hover:border-gray-600 transition-all group"
                                >
                                    <button
                                        onClick={() => navigate(`/profile/${user.id}`)}
                                        className="flex flex-col items-center gap-2 cursor-pointer"
                                    >
                                        <img
                                            src={getProfileImageUrl(user.profileImage) || '/images/default.webp'}
                                            alt={user.name}
                                            className="w-16 h-16 rounded-full object-cover ring-2 ring-warmgray-200 dark:ring-gray-600 group-hover:ring-stone-400 dark:group-hover:ring-gray-500 transition-all"
                                            onError={(e) => { e.target.src = '/images/default.webp'; }}
                                        />
                                        <span className="text-sm font-medium text-stone-700 dark:text-warmgray-200 text-center truncate w-full">
                                            {user.name || user.username}
                                        </span>
                                    </button>

                                    {relationship === 'none' && (
                                        <button
                                            onClick={() => handleSendFriendRequest(user.id)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800/60 transition-colors cursor-pointer font-medium"
                                        >
                                            <FiUserPlus className="w-3 h-3" />
                                            Add Friend
                                        </button>
                                    )}
                                    {relationship === 'pending' && (
                                        <span className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-lg font-medium">
                                            <FiClock className="w-3 h-3" />
                                            Pending
                                        </span>
                                    )}
                                    {relationship === 'friends' && (
                                        <span className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 dark:bg-gray-700 text-stone-600 dark:text-gray-300 text-xs rounded-lg font-medium">
                                            <FiCheck className="w-3 h-3" />
                                            Friends
                                        </span>
                                    )}
                                    {relationship === 'received' && (
                                        <button
                                            onClick={() => {
                                                const req = friendRequests.find(r => (r.user?.id === user.id || r.userId === user.id));
                                                if (req) handleAcceptRequest(req.id);
                                            }}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer font-medium"
                                        >
                                            <FiCheck className="w-3 h-3" />
                                            Accept
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Empty state */}
                {!loading && filteredUsers.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-warmgray-200 dark:border-gray-700">
                        <div className="text-4xl mb-3">
                            {isSearchMode ? '🔍' : '👋'}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isSearchMode
                                ? `No users found for "${searchQuery}"`
                                : 'No suggestions available right now. Try searching for someone!'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FindPeople;

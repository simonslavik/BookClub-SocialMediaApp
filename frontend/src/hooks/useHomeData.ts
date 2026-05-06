import { useContext, useEffect, useState, useCallback } from 'react';
import AuthContext from '@context/index';
import apiClient from '@api/axios';
import logger from '@utils/logger';
import { useToast } from '@hooks/useUIFeedback';

/**
 * Custom hook that encapsulates all data-fetching and state logic
 * for the Home page (book clubs, friends, suggestions).
 */
const useHomeData = () => {
  const { auth } = useContext(AuthContext);
  const { toastSuccess, toastError, toastWarning } = useToast();

  const [bookClubs, setBookClubs] = useState([]);
  const [allMyBookClubs, setAllMyBookClubs] = useState([]);
  const [friends, setFriends] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  const handleSendFriendRequest = useCallback(async (userId) => {
    if (!auth?.token) {
      toastWarning('Please log in to send friend requests');
      return;
    }

    try {
      const response = await apiClient.post('/v1/friends/request', { recipientId: userId });

      if (response.status === 403 || response.status === 401) {
        toastWarning('Your session has expired. Please log out and log back in.');
        return;
      }

      toastSuccess('Friend request sent!');
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        toastWarning('Your session has expired. Please log out and log back in.');
        return;
      }
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      toastError('Failed to send friend request: ' + errorMsg);
    }
  }, [auth?.token, toastSuccess, toastError, toastWarning]);

  // Fetch all data on auth change
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      // Fetch social data if authenticated
      if (auth?.user && auth?.token) {
        const [friendsRes, suggestionsRes] = await Promise.allSettled([
          apiClient.get('/v1/friends/list'),
          apiClient.get('/v1/users/suggestions?limit=12'),
        ]);

        if (cancelled) return;

        if (friendsRes.status === 'fulfilled') {
          setFriends(friendsRes.value.data?.data || []);
        }
        if (suggestionsRes.status === 'fulfilled') {
          setSuggestedUsers(suggestionsRes.value.data?.data || []);
        }
      }

      // Always fetch public bookclubs
      try {
        const response = await apiClient.get('/v1/bookclubs/discover');
        if (cancelled) return;

        const responseData = response.data;
        const clubs = responseData.success
          ? responseData.data
          : (responseData.bookClubs || []);

        // Batch-fetch current books
        let clubsWithBooks = clubs;
        try {
          const clubIds = clubs.map((c) => c.id);
          if (clubIds.length > 0) {
            const booksRes = await apiClient.post('/v1/bookclub/batch-current-books', { bookClubIds: clubIds });
            if (booksRes.data?.success && Array.isArray(booksRes.data.currentBooks)) {
              const booksMap = new Map(
                booksRes.data.currentBooks.map((b) => [b.bookClubId, b.currentBooks || []])
              );
              clubsWithBooks = clubs.map((club) => ({
                ...club,
                currentBooks: booksMap.get(club.id) || [],
              }));
            }
          }
        } catch (err) {
          logger.error('Error fetching batch current books:', err);
        }

        if (cancelled) return;

        setBookClubs(clubsWithBooks);

        if (auth?.user) {
          const myClubs = clubsWithBooks.filter(
            (club) => club.creatorId === auth.user.id || club.isMember === true
          );
          setAllMyBookClubs(myClubs);
        }
      } catch (error) {
        logger.error('Error fetching all book clubs:', error);
      }
    };

    loadData();

    return () => { cancelled = true; };
  }, [auth?.user?.id, auth?.token]);

  return {
    auth,
    bookClubs,
    allMyBookClubs,
    friends,
    suggestedUsers,
    handleSendFriendRequest,
  };
};

export default useHomeData;

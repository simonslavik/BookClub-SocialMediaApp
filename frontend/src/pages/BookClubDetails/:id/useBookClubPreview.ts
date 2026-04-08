import { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '@context/index';
import apiClient from '@api/axios';
import logger from '@utils/logger';
import { useToast } from '@hooks/useUIFeedback';

export default function useBookClubPreview() {
    const { id: bookClubId } = useParams();
    const navigate = useNavigate();
    const { auth } = useContext(AuthContext);
    const { toastSuccess, toastError } = useToast();

    const [bookClub, setBookClub] = useState(null);
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [members, setMembers] = useState([]);
    const [currentBooks, setCurrentBooks] = useState([]);
    const [upcomingBooks, setUpcomingBooks] = useState([]);
    const [completedBooks, setCompletedBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ── Fetch club preview ───────────────────────────────
    useEffect(() => {
        const run = async () => {
            try {
                const { data: res } = await apiClient.get(`/v1/bookclubs/${bookClubId}/preview`);
                const data = res.success ? res.data : res;
                setBookClub(data);
                setConnectedUsers(data.connectedUsers || []);
                setMembers(data.members || []);
            } catch (err) {
                logger.error('Error fetching book club:', err);
                setError(err.response?.data?.error || err.response?.data?.message || 'Failed to connect to server');
            } finally {
                setLoading(false);
            }
        };
        if (bookClubId) run();
    }, [bookClubId, auth?.user?.id]);

    // ── Fetch books ──────────────────────────────────────
    useEffect(() => {
        if (!bookClubId) return;
        const run = async () => {
            try {
                const { data } = await apiClient.get(`/v1/bookclub/${bookClubId}/books`);
                if (data.success) {
                    setCurrentBooks(data.data.filter(b => b.status === 'current'));
                    setUpcomingBooks(data.data.filter(b => b.status === 'upcoming'));
                    setCompletedBooks(data.data.filter(b => b.status === 'completed').slice(0, 3));
                }
            } catch (err) {
                logger.error('Error fetching books:', err);
            }
        };
        run();
    }, [bookClubId]);

    const totalBooks = completedBooks.length + currentBooks.length + upcomingBooks.length;

    // ── Actions ──────────────────────────────────────────
    const handleAction = useCallback(async () => {
        if (!auth?.user) return 'login';
        if (bookClub?.isMember) { navigate(`/bookclub/${bookClubId}`); return; }
        try {
            if (bookClub?.visibility === 'PUBLIC') {
                await apiClient.post(`/v1/bookclubs/${bookClubId}/join`);
                navigate(`/bookclub/${bookClubId}`);
            } else {
                await apiClient.post(`/v1/bookclubs/${bookClubId}/request`);
                toastSuccess('Join request sent! Wait for admin approval.');
                window.location.reload();
            }
        } catch (err) {
            logger.error('Error joining bookclub:', err);
            toastError(err.response?.data?.message || 'Failed to join bookclub');
        }
    }, [auth?.user, bookClub, bookClubId, navigate, toastSuccess, toastError]);

    const actionLabel = !auth?.user ? 'Login to Join' : bookClub?.isMember ? 'Enter BookClub' : 'Join Club';

    return {
        bookClub, members, connectedUsers,
        currentBooks, upcomingBooks, completedBooks,
        loading, error, totalBooks,
        handleAction, actionLabel, navigate,
    };
}

import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '@context/index';
import apiClient from '@api/axios';
import logger from '@utils/logger';
import { useConfirm, useToast } from '@hooks/useUIFeedback';

export default function useProfileData() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { auth, setAuth } = useContext(AuthContext);
    const { confirm } = useConfirm();
    const { toastError, toastWarning } = useToast();

    const [profile, setProfile] = useState(null);
    const [createdBookClubs, setCreatedBookClubs] = useState([]);
    const [memberBookClubs, setMemberBookClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [friendRequestLoading, setFriendRequestLoading] = useState(false);

    // Image upload
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef(null);

    // Books
    const [favoriteBooks, setFavoriteBooks] = useState([]);
    const [booksReading, setBooksReading] = useState([]);
    const [booksToRead, setBooksToRead] = useState([]);
    const [booksRead, setBooksRead] = useState([]);

    const isOwnProfile = auth?.user?.id === id;

    // ── Fetch books ──────────────────────────────────────
    const fetchBooks = useCallback(async (userId) => {
        const uid = userId || id;
        const statuses = [
            { key: 'favorite', setter: setFavoriteBooks },
            { key: 'reading', setter: setBooksReading },
            { key: 'want_to_read', setter: setBooksToRead },
            { key: 'completed', setter: setBooksRead },
        ];
        await Promise.allSettled(
            statuses.map(async ({ key, setter }) => {
                try {
                    const { data } = await apiClient.get(`/v1/user-books?status=${key}&userId=${uid}`);
                    if (data.success) setter(data.data || []);
                } catch (err) {
                    logger.warn(`Failed to fetch ${key} books:`, err);
                }
            })
        );
    }, [id]);

    // ── Fetch profile ────────────────────────────────────
    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        const run = async () => {
            try {
                setLoading(true);

                // Fetch profile first (needed for error/not-found check)
                const { data: profileRes } = await apiClient.get(`/v1/profile/${id}`);
                if (cancelled) return;
                if (!profileRes.success) {
                    setError('Failed to load profile');
                    return;
                }
                setProfile(profileRes.data);

                // Fetch clubs + books in parallel (independent of each other)
                const [clubsResult] = await Promise.allSettled([
                    apiClient.get('/v1/bookclubs/discover'),
                    fetchBooks(id),
                ]);

                if (cancelled) return;

                if (clubsResult.status === 'fulfilled') {
                    const clubsRes = clubsResult.value.data;
                    const clubs = clubsRes.success ? clubsRes.data : (clubsRes.bookClubs || []);
                    setCreatedBookClubs(clubs.filter(c => c.creatorId === id));
                    setMemberBookClubs(clubs.filter(c => c.isMember && c.creatorId !== id));
                }
            } catch (err) {
                if (cancelled) return;
                logger.error('Error fetching profile:', err);
                setError('Failed to load profile data');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        run();
        return () => { cancelled = true; };
    }, [id, auth?.token, fetchBooks]);

    // ── Image upload ─────────────────────────────────────
    const handleImageSelect = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);

        // Auto-upload
        (async () => {
            if (!auth?.token) { toastWarning('Please login to change profile picture'); return; }
            setUploadingImage(true);
            try {
                const formData = new FormData();
                formData.append('image', file);
                const { data } = await apiClient.post('/v1/profile/image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setProfile(prev => ({ ...prev, profileImage: data.imageUrl }));
                if (auth?.user && isOwnProfile) {
                    setAuth({ user: { ...auth.user, profileImage: data.imageUrl }, token: auth.token });
                }
                setImagePreview(null);
            } catch (err) {
                logger.error('Error uploading image:', err);
                toastError(err.response?.data?.message || 'Failed to upload image');
            } finally {
                setUploadingImage(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        })();
    }, [auth, isOwnProfile, setAuth, toastError, toastWarning]);

    // ── Friend request ───────────────────────────────────
    // Pass `onRequireAuth` from the page so unauthenticated users can be
    // shown the login modal instead of redirected to a non-existent /login.
    const sendFriendRequest = useCallback(async (onRequireAuth?: () => void) => {
        if (!auth?.token) { onRequireAuth?.(); return; }
        setFriendRequestLoading(true);
        try {
            await apiClient.post('/v1/friends/request', { recipientId: id });
            setProfile(prev => ({ ...prev, friendshipStatus: 'request_sent' }));
        } catch (err) {
            logger.error('Error sending friend request:', err);
            toastError(err.response?.data?.message || 'Failed to send friend request');
        } finally {
            setFriendRequestLoading(false);
        }
    }, [auth?.token, id, toastError]);

    // ── Delete book ──────────────────────────────────────
    const deleteBook = useCallback(async (userBookId) => {
        const ok = await confirm('Remove this book from your library?', { title: 'Remove Book', variant: 'danger', confirmLabel: 'Remove' });
        if (!ok) return;
        try {
            await apiClient.delete(`/v1/user-books/${userBookId}`);
            const remove = (prev) => prev.filter(b => b.id !== userBookId);
            setFavoriteBooks(remove);
            setBooksReading(remove);
            setBooksToRead(remove);
            setBooksRead(remove);
        } catch (err) {
            logger.error('Error deleting user book:', err);
            toastError(err.response?.data?.message || 'Failed to delete book');
        }
    }, [confirm, toastError]);

    const allClubs = [...createdBookClubs, ...memberBookClubs];

    return {
        id, profile, allClubs, createdBookClubs,
        loading, error, isOwnProfile,
        imagePreview, uploadingImage, fileInputRef, handleImageSelect,
        friendRequestLoading, sendFriendRequest,
        favoriteBooks, booksReading, booksToRead, booksRead,
        fetchBooks, deleteBook, navigate,
        isAuthed: !!auth?.token,
    };
}

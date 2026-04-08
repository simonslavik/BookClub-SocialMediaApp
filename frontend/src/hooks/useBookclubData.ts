import { useEffect, useState, useContext, useRef, useCallback } from 'react';
import AuthContext from '@context/index';
import { useConfirm, useToast } from '@hooks/useUIFeedback';
import { bookclubAPI } from '@api/bookclub.api';
import apiClient from '@api/axios';
import logger from '@utils/logger';

/**
 * Encapsulates all data-fetching, state management and derived data for the
 * BookClub detail page.
 *
 * Returns everything the page (and its children) need to render — the page
 * component itself becomes a thin orchestrator of layout + child components.
 */
export function useBookclubData(bookClubId) {
  const { auth, setAuth, logout } = useContext(AuthContext);
  const { confirm } = useConfirm();
  const { toastSuccess, toastError } = useToast();

  // ─── Core bookclub state ──────────────────────────────────
  const [bookClub, setBookClub] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myBookClubs, setMyBookClubs] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [friends, setFriends] = useState([]);

  // ─── Books state ──────────────────────────────────────────
  const [bookclubBooks, setBookclubBooks] = useState({ current: [], upcoming: [], completed: [] });
  const [loadingBooks, setLoadingBooks] = useState(false);

  // ─── Settings form state ──────────────────────────────────
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    category: '',
    visibility: 'PUBLIC',
    requiresApproval: false,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // ─── Image upload ─────────────────────────────────────────
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // ─── Role update counter (forces re-memo when members' roles change) ──
  const [roleUpdateCounter, setRoleUpdateCounter] = useState(0);

  // ─── Fetch bookclub details ───────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchBookClub = async () => {
      try {
        const response = await apiClient.get(`/v1/bookclubs/${bookClubId}`);
        const responseData = response.data;
        const data = responseData.success ? responseData.data : responseData;

        if (cancelled) return;
        setBookClub(data);
        setRooms(data.rooms || []);

        if (data.rooms?.length > 0) {
          const accessibleRoom = data.rooms.find(
            (r) => r.type !== 'PRIVATE' || r.isMember !== false,
          );
          setCurrentRoom(accessibleRoom || data.rooms[0]);
        }
      } catch (err) {
        if (cancelled) return;
        logger.error('Error fetching book club:', err);
        setError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to connect to server',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (bookClubId) fetchBookClub();
    return () => { cancelled = true; };
  }, [bookClubId, auth?.token]);

  // ─── Fetch bookclub books ─────────────────────────────────
  const fetchBookclubBooks = useCallback(async () => {
    if (!auth?.token || !bookClubId) return;
    setLoadingBooks(true);
    try {
      const response = await apiClient.get(`/v1/bookclub/${bookClubId}/books`);
      if (response.data?.success) {
        const books = response.data.data;
        setBookclubBooks({
          current: books.filter((b) => b.status === 'current'),
          upcoming: books.filter((b) => b.status === 'upcoming'),
          completed: books.filter((b) => b.status === 'completed'),
        });
      }
    } catch (err) {
      logger.error('Error fetching bookclub books:', err);
    } finally {
      setLoadingBooks(false);
      window.__calendarBookRefresh?.();
    }
  }, [auth?.token, bookClubId]);

  useEffect(() => {
    if (bookClubId && auth?.token) fetchBookclubBooks();
  }, [bookClubId, auth?.token, fetchBookclubBooks]);

  // ─── Fetch sidebar bookclubs (once) ───────────────────────
  useEffect(() => {
    const userId = auth?.user?.id;
    if (!userId) return;
    apiClient.get('/v1/bookclubs/discover')
      .then((response) => {
        const data = response.data;
        const clubs = data.success ? data.data : (data.bookClubs || []);
        const myClubs = clubs
          .filter((c) => c.creatorId === userId || c.isMember === true)
          .sort((a, b) => a.name.localeCompare(b.name));
        setMyBookClubs(myClubs);
      })
      .catch((err) => logger.error('Error fetching my book clubs:', err));
  }, [auth?.user?.id]);

  // ─── Fetch friends ────────────────────────────────────────
  useEffect(() => {
    if (!auth?.token) return;
    apiClient.get('/v1/friends/list')
      .then((res) => setFriends(res.data?.data || []))
      .catch((err) => logger.error('Error fetching friends:', err));
  }, [auth?.token]);

  // ─── Populate settings form when bookclub data arrives ────
  useEffect(() => {
    if (!bookClub) return;
    setSettingsForm({
      name: bookClub.name || '',
      description: bookClub.description || '',
      category: bookClub.category || '',
      visibility: bookClub.visibility || 'PUBLIC',
      requiresApproval: bookClub.requiresApproval || false,
    });
  }, [bookClub]);

  // ─── Handlers ─────────────────────────────────────────────
  const handleSaveSettings = useCallback(async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await bookclubAPI.updateBookclubSettings(bookClubId, {
        ...settingsForm,
        requiresApproval: settingsForm.visibility === 'PRIVATE' ? settingsForm.requiresApproval : false,
      });
      toastSuccess('Settings updated successfully!');
      const response = await bookclubAPI.getBookclubPreview(bookClubId);
      setBookClub(response.data);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  }, [bookClubId, settingsForm, toastSuccess, toastError]);

  const handleStatusChange = useCallback(async (bookId, newStatus) => {
    if (!auth?.token) return;
    try {
      const response = await apiClient.patch(`/v1/bookclub/${bookClubId}/books/${bookId}`, { status: newStatus });
      if (response.data?.success) fetchBookclubBooks();
      else toastError(response.data?.error || 'Failed to update book status');
    } catch (err) {
      logger.error('Error updating book status:', err);
      toastError('Failed to update book status');
    }
  }, [auth?.token, bookClubId, fetchBookclubBooks, toastError]);

  const handleRateBook = useCallback(async (bookClubBookId, rating) => {
    if (!auth?.token) return;
    try {
      const response = await apiClient.post(`/v1/bookclub/${bookClubId}/books/${bookClubBookId}/rate`, { rating });
      if (response.data?.success) fetchBookclubBooks();
    } catch (err) {
      logger.error('Error rating book:', err);
      toastError('Failed to rate book');
      throw err;
    }
  }, [auth?.token, bookClubId, fetchBookclubBooks, toastError]);

  const handleRemoveRating = useCallback(async (bookClubBookId) => {
    if (!auth?.token) return;
    try {
      const response = await apiClient.delete(`/v1/bookclub/${bookClubId}/books/${bookClubBookId}/rate`);
      if (response.data?.success) fetchBookclubBooks();
    } catch (err) {
      logger.error('Error removing rating:', err);
      toastError('Failed to remove rating');
      throw err;
    }
  }, [auth?.token, bookClubId, fetchBookclubBooks, toastError]);

  const handleImageUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploadingImage(true);
    try {
      const response = await apiClient.post(`/v1/bookclubs/${bookClubId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBookClub((prev) => ({ ...prev, imageUrl: response.data.imageUrl }));
    } catch (err) {
      logger.error('Error uploading image:', err);
      toastError(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [bookClubId, toastError]);

  const handleDeleteImage = useCallback(async () => {
    const ok = await confirm('Are you sure you want to delete the bookclub image?', {
      title: 'Delete Image',
      variant: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await apiClient.delete(`/v1/bookclubs/${bookClubId}/image`);
      setBookClub((prev) => ({ ...prev, imageUrl: null }));
    } catch (err) {
      logger.error('Error deleting image:', err);
      toastError(err.response?.data?.error || 'Failed to delete image');
    }
  }, [bookClubId, confirm, toastError]);

  const handleSendFriendRequest = useCallback(async (userId) => {
    if (!auth?.token) return;
    try {
      const response = await apiClient.post('/v1/friends/request', { recipientId: userId });
      toastSuccess(response.data.message || 'Friend request sent!');
      try {
        const friendsRes = await apiClient.get('/v1/friends/list');
        setFriends(friendsRes.data?.data || []);
      } catch { /* refresh best-effort */ }
    } catch (err) {
      logger.error('Error sending friend request:', err);
      toastError(
        err.response?.data?.error || err.response?.data?.message || 'Failed to send friend request',
      );
    }
  }, [auth?.token, toastSuccess, toastError]);

  // ─── Room handlers ────────────────────────────────────────
  const handleCreateRoomSubmit = useCallback(async (roomData) => {
    const response = await apiClient.post(`/v1/bookclubs/${bookClubId}/rooms`, roomData);
    const newRoom = response.data.room;
    setRooms((prev) => [...prev, newRoom]);
    return newRoom;
  }, [bookClubId]);

  const handleRoomUpdated = useCallback((updatedRoom) => {
    setRooms((prev) => prev.map((r) => (r.id === updatedRoom.id ? { ...r, ...updatedRoom } : r)));
    setCurrentRoom((prev) => (prev?.id === updatedRoom.id ? { ...prev, ...updatedRoom } : prev));
  }, []);

  const handleRoomDeleted = useCallback((deletedRoom) => {
    setRooms((prev) => {
      const remaining = prev.filter((r) => r.id !== deletedRoom.id);
      setCurrentRoom((cur) => (cur?.id === deletedRoom.id ? remaining[0] || null : cur));
      return remaining;
    });
  }, []);

  const handleMemberUpdate = useCallback(async () => {
    const response = await bookclubAPI.getBookclubPreview(bookClubId);
    setBookClub(response.data);
    setRoleUpdateCounter((prev) => prev + 1);
  }, [bookClubId]);

  // ─── Extract user role from members ───────────────────────
  const extractUserRole = useCallback((bookClubMembers) => {
    if (!auth?.user?.id) return;
    if (bookClub?.creatorId === auth.user.id) {
      setUserRole('OWNER');
      return;
    }
    if (bookClubMembers?.length > 0) {
      const membership = bookClubMembers.find((m) => m.userId === auth.user.id);
      setUserRole(membership?.role ?? null);
    }
  }, [auth?.user?.id, bookClub?.creatorId]);

  // ─── Map members with roles ───────────────────────────────
  const buildMappedMembers = useCallback((bookClubMembers) => {
    const activeMembers = bookClubMembers.filter((member) => {
      if (!bookClub?.members) return true;
      return bookClub.members.some((m) => (m.userId || m.id) === member.id);
    });
    return activeMembers.map((member) => {
      const memberWithRole = bookClub?.members?.find((m) => (m.userId || m.id) === member.id);
      return {
        ...member,
        role: memberWithRole?.role || (member.id === bookClub?.creatorId ? 'OWNER' : 'MEMBER'),
      };
    });
  }, [bookClub?.members, bookClub?.creatorId]);

  return {
    // Auth
    auth, setAuth, logout,

    // Core state
    bookClub, setBookClub, rooms, setRooms, currentRoom, setCurrentRoom,
    loading, error, myBookClubs, userRole, setUserRole, friends,

    // Books
    bookclubBooks, loadingBooks, fetchBookclubBooks,
    handleStatusChange, handleRateBook, handleRemoveRating,

    // Settings
    settingsForm, setSettingsForm, savingSettings, handleSaveSettings,

    // Image upload
    uploadingImage, fileInputRef, handleImageUpload, handleDeleteImage,

    // Room handlers
    handleCreateRoomSubmit, handleRoomUpdated, handleRoomDeleted,

    // Social
    handleSendFriendRequest,

    // Role & member helpers
    roleUpdateCounter, extractUserRole, buildMappedMembers, handleMemberUpdate,

    // UI feedback
    confirm, toastSuccess, toastError,
  };
}

import { useEffect, useState, useContext, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../../../context';
import MyBookClubsSidebar from '../../../components/features/bookclub/MyBookClubsSidebar';
import SideBarRooms from '../../../components/features/bookclub/SideBar/SideBarRooms';
import AddCurrentBookModal from '../../../components/features/bookclub/Modals/AddCurrentBookModal';
import CurrentBookDetailsModal from '../../../components/features/bookclub/Modals/CurrentBookDetailsModal';
import AddBookToBookclubModal from '../../../components/features/bookclub/Modals/AddBookToBookclubModal';

// Function to convert URLs in text to clickable links
const linkifyText = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-blue-300"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};
import CalendarView from '../../../components/features/bookclub/MainChatArea/CalendarView';
import AddEventModal from '../../../components/features/bookclub/Modals/AddEventModal';
import BookSuggestionsView from '../../../components/features/bookclub/MainChatArea/BookSuggestionsView';
import BookClubBookView from '../../../components/features/bookclub/MainChatArea/BookClubBookView';
import BookClubChat from '../../../components/features/bookclub/MainChatArea/BookClubChat';
import ConnectedUsersSidebar from '../../../components/features/bookclub/ConnectedUsersSidebar';
import MessageInput from '../../../components/features/bookclub/MessageInput';
import BookclubHeader from '../../../components/features/bookclub/MainChatArea/BookclubHeader';
import InviteModal from '../../../components/common/modals/InviteModal';
import AdminApprovalPanel from '../../../components/features/bookclub/AdminApprovalPanel';
import InviteLinkManager from '../../../components/features/bookclub/InviteLinkManager';
import MemberManagement from '../../../components/features/bookclub/MemberManagement';
import { useBookclubWebSocket } from '../../../hooks/useBookclubWebSocket';
import { messageModerationAPI } from '../../../api/messageModeration.api';
import { bookclubAPI } from '../../../api/bookclub.api';
import { FiX, FiSettings as FiSettingsIcon, FiLock, FiUnlock, FiEyeOff, FiImage, FiTrash2 } from 'react-icons/fi';


const BookClub = () => {
  const { id: bookClubId } = useParams();
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Bookclub states
  const [bookClub, setBookClub] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [myBookClubs, setMyBookClubs] = useState([]);
  
  // Modal states
  const [addCurrentBookState, setAddCurrentBookState] = useState(false);
  const [currentBookDetailsOpen, setCurrentBookDetailsOpen] = useState(false);
  const [currentBookData, setCurrentBookData] = useState(null);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  
  // View states
  const [showBooksHistory, setShowBooksHistory] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [previousView, setPreviousView] = useState(null); // Store previous view before opening settings
  
  // Settings form states
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    category: '',
    visibility: 'PUBLIC',
    requiresApproval: false
  });
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Books states
  const [bookclubBooks, setBookclubBooks] = useState({ current: [], upcoming: [], completed: [] });
  const [loadingBooks, setLoadingBooks] = useState(false);
  
  // Calendar states
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [selectedEventDate, setSelectedEventDate] = useState(null);
  const [calendarRefresh, setCalendarRefresh] = useState(null);
  
  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);

  // File upload states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  // User's role in the current bookclub
  const [userRole, setUserRole] = useState(null);
  
  // Friends list for connected users sidebar
  const [friends, setFriends] = useState([]);
  
  // Force re-render counter for role updates
  const [roleUpdateCounter, setRoleUpdateCounter] = useState(0);
  
  const fileInputRef = useRef(null);
  const fileUploadRef = useRef(null);

  // Use custom WebSocket hook for bookclub chat
  const { 
    ws, 
    messages, 
    setMessages, 
    connectedUsers, 
    setConnectedUsers,
    bookClubMembers,
    setBookClubMembers
  } = useBookclubWebSocket(bookClub, currentRoom, auth, bookClubId);

  // Extract user's role from bookClubMembers
  useEffect(() => {
    if (!auth?.user?.id) return;
    
    console.log('UserRole Debug:', {
      bookClubMembers,
      authUserId: auth.user.id,
      bookClubData: bookClub,
      creatorId: bookClub?.creatorId
    });
    
    // First check if user is the creator
    if (bookClub?.creatorId === auth.user.id) {
      console.log('✅ User is creator, setting OWNER role');
      setUserRole('OWNER');
      return;
    }
    
    // Otherwise check membership in bookClubMembers
    if (bookClubMembers && bookClubMembers.length > 0) {
      console.log('BookClub Members details:', bookClubMembers.map(m => ({
        userId: m.userId,
        role: m.role,
        matches: m.userId === auth.user.id
      })));
      
      const membership = bookClubMembers.find(m => m.userId === auth.user.id);
      console.log('Membership found:', membership);
      if (membership) {
        setUserRole(membership.role);
      } else {
        setUserRole(null);
      }
    }
  }, [bookClubMembers, auth?.user?.id, bookClub]);

  // Reset books history and calendar view when bookClubId changes
  useEffect(() => {
    setShowBooksHistory(false);
    setShowCalendar(false);
    setShowSuggestions(false);
    setShowSettings(false);
    setBookclubBooks({ current: [], upcoming: [], completed: [] });
  }, [bookClubId]);

  // Populate settings form when bookClub loads
  useEffect(() => {
    if (bookClub) {
      setSettingsForm({
        name: bookClub.name || '',
        description: bookClub.description || '',
        category: bookClub.category || '',
        visibility: bookClub.visibility || 'PUBLIC',
        requiresApproval: bookClub.requiresApproval || false
      });
    }
  }, [bookClub]);

  // Handle settings form submission
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await bookclubAPI.updateBookclubSettings(bookClubId, {
        ...settingsForm,
        requiresApproval: settingsForm.visibility === 'PRIVATE' ? settingsForm.requiresApproval : false
      });
      alert('Settings updated successfully!');
      // Refresh bookclub data
      const response = await bookclubAPI.getBookclubPreview(bookClubId);
      setBookClub(response.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Fetch bookclub books history
  const fetchBookclubBooks = async () => {
    if (!auth?.token || !bookClubId) return;
    
    setLoadingBooks(true);
    try {
      const response = await fetch(
        `http://localhost:3000/v1/bookclub/${bookClubId}/books`,
        {
          headers: {
            'Authorization': `Bearer ${auth.token}`
          }
        }
      );
      const data = await response.json();
      
      if (data.success) {
        // Organize books by status
        const organized = {
          current: data.data.filter(book => book.status === 'current'),
          upcoming: data.data.filter(book => book.status === 'upcoming'),
          completed: data.data.filter(book => book.status === 'completed')
        };
        setBookclubBooks(organized);
      }
    } catch (err) {
      console.error('Error fetching bookclub books:', err);
    } finally {
      setLoadingBooks(false);
    }
  };

  const handleShowBooksHistory = () => {
    setShowBooksHistory(true);
    setShowCalendar(false);
    setShowSuggestions(false);
    setShowSettings(false);
    fetchBookclubBooks();
  };

  const handleStatusChange = async (bookId, newStatus) => {
    if (!auth?.token) return;
    
    try {
      const response = await fetch(
        `http://localhost:3000/v1/bookclub/${bookClubId}/books/${bookId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );
      
      const data = await response.json();
      if (data.success) {
        // Refresh the books list
        fetchBookclubBooks();
      } else {
        alert(data.error || 'Failed to update book status');
      }
    } catch (err) {
      console.error('Error updating book status:', err);
      alert('Failed to update book status');
    }
  };

  // Fetch bookclub details
  useEffect(() => {
    const fetchBookClub = async () => {
      try {
        const headers = auth?.token 
          ? { Authorization: `Bearer ${auth.token}` }
          : {};
        
        const response = await fetch(`http://localhost:3000/v1/bookclubs/${bookClubId}`, { headers });
        const responseData = await response.json();
        
        if (response.ok) {
          // Handle new response format { success: true, data: {...} }
          const data = responseData.success ? responseData.data : responseData;
          setBookClub(data);
          setRooms(data.rooms || []);
          
          // Select first room by default
          if (data.rooms && data.rooms.length > 0) {
            setCurrentRoom(data.rooms[0]);
          }
        } else {
          setError(responseData.message || responseData.error || 'Failed to load book club');
        }
      } catch (err) {
        console.error('Error fetching book club:', err);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    if (bookClubId) {
      fetchBookClub();
    }
  }, [bookClubId, auth]);

  // Fetch bookclub books when bookClubId changes
  useEffect(() => {
    if (bookClubId && auth?.token) {
      fetchBookclubBooks();
    }
  }, [bookClubId, auth?.token]);

  // Fetch my bookclubs only once on mount (not on bookClubId change to prevent reordering)
  useEffect(() => {
    if (auth?.user) {
        const headers = auth?.token 
          ? { Authorization: `Bearer ${auth.token}` }
          : {};
        
        fetch('http://localhost:3000/v1/bookclubs/discover', { headers })
            .then(response => response.json())
            .then(data => {
                console.log('My Bookclubs response:', data);
                // Handle new API response format { success: true, data: [...] }
                const clubs = data.success ? data.data : (data.bookClubs || []);
                // Filter for clubs where user is a member (including INVITE_ONLY clubs)
                const myClubs = clubs.filter(club => 
                  club.creatorId === auth.user.id || club.isMember === true
                );
                setMyBookClubs(myClubs);
            })
            .catch(error => console.error('Error fetching my book clubs:', error));
    }
  }, [auth]);

  // Fetch friends list for connected users sidebar
  useEffect(() => {
    const fetchFriends = async () => {
      if (!auth?.token) return;
      
      try {
        const response = await fetch('http://localhost:3000/v1/friends/list', {
          headers: { Authorization: `Bearer ${auth.token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
          setFriends(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching friends:', err);
      }
    };

    fetchFriends();
  }, [auth?.token]);









  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    console.log('=== SEND MESSAGE DEBUG ===');
    console.log('Message text:', newMessage);
    console.log('Selected files count:', selectedFiles.length);
    console.log('Selected files:', selectedFiles);
    console.log('FileUploadRef exists:', !!fileUploadRef.current);
    console.log('ws ref exists:', !!ws);
    console.log('ws.current exists:', !!ws.current);
    console.log('ws.current readyState:', ws.current?.readyState);
    console.log('WebSocket.OPEN value:', WebSocket.OPEN);
    
    const hasMessage = newMessage.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;
    const hasContent = hasMessage || hasFiles;
    const wsReady = ws.current && ws.current.readyState === WebSocket.OPEN;
    
    console.log('Has message:', hasMessage);
    console.log('Has files:', hasFiles);
    console.log('Has content:', hasContent);
    console.log('WS ready:', wsReady);
    
    if (!hasContent || !wsReady) {
      console.log('Validation failed - returning early');
      console.log('Reason: hasContent=', hasContent, 'wsReady=', wsReady);
      return;
    }

    setUploadingFiles(true);
    
    try {
      let attachments = [];
      
      // Upload files if any are selected
      if (selectedFiles.length > 0 && fileUploadRef.current) {
        console.log('Starting file upload...');
        attachments = await fileUploadRef.current.uploadFiles();
        console.log('Uploaded attachments:', attachments);
      } else {
        console.log('No files to upload or ref missing');
      }

      // If there's a text message and files, send text message first
      if (newMessage.trim() && attachments.length > 0) {
        const textMessageData = {
          type: 'chat-message',
          message: newMessage.trim(),
          attachments: []
        };
        console.log('Sending text message:', textMessageData);
        ws.current.send(JSON.stringify(textMessageData));
      }

      // Send each file as a separate message
      if (attachments.length > 0) {
        for (const attachment of attachments) {
          const fileMessageData = {
            type: 'chat-message',
            message: newMessage.trim() && attachments.length === 1 ? newMessage.trim() : null,
            attachments: [attachment]
          };
          console.log('Sending file message:', fileMessageData);
          ws.current.send(JSON.stringify(fileMessageData));
        }
      } else if (newMessage.trim()) {
        // If only text, no files
        const messageData = {
          type: 'chat-message',
          message: newMessage.trim(),
          attachments: []
        };
        console.log('Sending text-only message:', messageData);
        ws.current.send(JSON.stringify(messageData));
      }

      setNewMessage('');
      setSelectedFiles([]); // Clear selected files after sending
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleFilesSelected = (files) => {
    setSelectedFiles(files);
  };

  const handleCreateRoom = async () => {
    const roomName = prompt('Enter room name:');
    if (!roomName || !roomName.trim()) return;

    try {
      const response = await fetch(`http://localhost:3000/v1/bookclubs/${bookClubId}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ name: roomName.trim() })
      });

      const data = await response.json();
      
      if (response.ok) {
        setRooms(prev => [...prev, data.room]);
        // Redirect to the newly created room
        switchRoom(data.room);
      } else {
        alert(data.error || 'Failed to create room');
      }
    } catch (err) {
      console.error('Error creating room:', err);
      alert('Failed to create room');
    }
  };

  const switchRoom = (room) => {
    if (room.id !== currentRoom?.id) {
      setMessages([]);
      setCurrentRoom(room);
      setShowBooksHistory(false);
      setShowCalendar(false);
      setShowSuggestions(false);
      setShowSettings(false);
      
      // Send switch-room message to server
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'switch-room',
          roomId: room.id
        }));
      }
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const response = await fetch(`http://localhost:3000/v1/bookclubs/${bookClubId}/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        setBookClub(prev => ({ ...prev, imageUrl: data.imageUrl }));
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async () => {
    if (!confirm('Are you sure you want to delete the bookclub image?')) return;

    try {
      const response = await fetch(`http://localhost:3000/v1/bookclubs/${bookClubId}/image`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setBookClub(prev => ({ ...prev, imageUrl: null }));
      } else {
        alert(data.error || 'Failed to delete image');
      }
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Failed to delete image');
    }
  };

  const handleSendFriendRequest = async (userId) => {
    if (!auth?.token) return;
    
    try {
      const response = await fetch('http://localhost:3000/v1/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ recipientId: userId })
      });
      
      const data = await response.json();
      console.log('Friend request response:', data, 'Status:', response.status);
      
      if (response.ok) {
        alert('Friend request sent!');
        setSelectedUserId(null);
      } else {
        console.error('Friend request failed:', data);
        alert(data.error || data.message || 'Failed to send friend request');
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
      alert('Failed to send friend request: ' + err.message);
    }
  };

  // Calendar event handlers
  const handleAddEvent = (date = null) => {
    setEventToEdit(null);
    setSelectedEventDate(date);
    setShowAddEventModal(true);
  };

  const handleEditEvent = (event) => {
    setEventToEdit(event);
    setShowAddEventModal(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!auth?.token) return;
    
    try {
      const response = await fetch(`http://localhost:3000/v1/editor/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      
      if (response.ok) {
        // Event deleted successfully - calendar will refetch
        return true;
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete event');
        return false;
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event');
      return false;
    }
  };

  const handleEventSaved = () => {
    // Trigger calendar refresh
    if (calendarRefresh) {
      calendarRefresh();
    }
    setShowAddEventModal(false);
    setEventToEdit(null);
    setSelectedEventDate(null);
  };

  const handleCalendarRefreshCallback = (refreshFn) => {
    setCalendarRefresh(() => refreshFn);
  };


  // Memoize mapped members with roles to trigger re-render when roles update
  const mappedBookClubMembers = useMemo(() => {
    console.log('🔄 Recalculating mappedBookClubMembers', {
      bookClubMembersCount: bookClubMembers.length,
      bookClubDotMembersCount: bookClub?.members?.length,
      roleUpdateCounter,
      bookClubMembers: bookClubMembers,
      bookClubDotMembers: bookClub?.members
    });
    
    return bookClubMembers.map(member => {
      // bookClubMembers from WebSocket has: id, username, email, profileImage
      // bookClub.members from API has: id, userId, role, bookClubId
      // Match by: bookClub.members.userId === bookClubMembers.id
      const memberWithRole = bookClub?.members?.find(m => m.userId === member.id);
      const mappedMember = {
        ...member,
        id: member.id,
        role: memberWithRole?.role || (member.id === bookClub?.creatorId ? 'OWNER' : 'MEMBER')
      };
      
      console.log('👤 Mapping member:', {
        memberName: member.username,
        memberId: member.id,
        lookingForUserId: member.id,
        foundMemberWithRole: memberWithRole,
        finalRole: mappedMember.role,
        bookClubCreatorId: bookClub?.creatorId
      });
      
      return mappedMember;
    });
  }, [bookClubMembers, bookClub?.members, bookClub?.creatorId, roleUpdateCounter]);


  


  
  


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading book club...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
        <div className="text-red-400 text-xl mb-4">{error}</div>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
        <div className='flex justify-center'>
          {/* My Bookclubs Sidebar */}
          <MyBookClubsSidebar 
            bookClubs={myBookClubs} 
            currentBookClubId={bookClubId}
            onSelectBookClub={(id) => {
              navigate(`/bookclub/${id}`);
            }}
            onOpenDM={() => navigate('/dm')}
            auth={auth}
          />
          
          {/* Bookclub Rooms Sidebar */}
          <SideBarRooms
            bookClub={bookClub}
            rooms={rooms}
            currentRoom={currentRoom}
            switchRoom={switchRoom}
            handleCreateRoom={handleCreateRoom}
            auth={auth}
            uploadingImage={uploadingImage}
            fileInputRef={fileInputRef}
            handleImageUpload={handleImageUpload}
            handleDeleteImage={handleDeleteImage}
            onNameUpdate={(newName) => setBookClub(prev => ({ ...prev, name: newName }))}
            onOpenDM={() => navigate('/dm')}
            setAddCurrentBookState={setAddCurrentBookState}
            addCurrentBookState={addCurrentBookState}
            onCurrentBookClick={(bookData) => {
              setCurrentBookData(bookData);
              setCurrentBookDetailsOpen(true);
            }}
            onShowBooksHistory={handleShowBooksHistory}
            setShowBooksHistory={setShowBooksHistory}
            showBooksHistory={showBooksHistory}
            onShowCalendar={() => {
              setShowCalendar(true);
              setShowBooksHistory(false);
              setShowSuggestions(false);
              setShowSettings(false);
              setCurrentRoom(null);
            }}
            showCalendar={showCalendar}
            onShowSuggestions={() => {
              setShowSuggestions(true);
              setShowBooksHistory(false);
              setShowCalendar(false);
              setShowSettings(false);
              setCurrentRoom(null);
            }}
            showSuggestions={showSuggestions}
          />
        </div>
        
        <div className="flex flex-1">
        {/* Main Chat Area */}
        <div className="flex flex-col flex-1">
          {/* Room Header */}
          <BookclubHeader 
            showBooksHistory={showBooksHistory}
            showCalendar={showCalendar}
            showSuggestions={showSuggestions}
            showSettings={showSettings}
            currentRoom={currentRoom}
            auth={auth}
            onInviteClick={() => {
              console.log('Invite button clicked!');
              setShowInviteModal(true);
            }}
            onSettingsClick={() => {
              // Store current view state before opening settings
              setPreviousView({
                showBooksHistory,
                showCalendar,
                showSuggestions
              });
              setShowBooksHistory(false);
              setShowCalendar(false);
              setShowSuggestions(false);
              setShowSettings(true);
            }}
            userRole={userRole}
          />

          {/* Content Area - Settings, Calendar, Books History, Suggestions, or Messages */}
          {showSettings ? (
            <div className="flex-1 overflow-y-auto bg-gray-900 p-6">
              {/* Settings Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <FiSettingsIcon className="w-6 h-6 text-purple-400" />
                    <h2 className="text-2xl font-bold text-white">Bookclub Settings</h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      // Restore previous view if any
                      if (previousView) {
                        setShowBooksHistory(previousView.showBooksHistory);
                        setShowCalendar(previousView.showCalendar);
                        setShowSuggestions(previousView.showSuggestions);
                        setPreviousView(null);
                      }
                    }}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <FiX className="w-6 h-6 text-gray-400 hover:text-white" />
                  </button>
                </div>

                {/* Settings Form */}
                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                  <h3 className="text-xl font-bold text-white mb-6">General Settings</h3>
                  <form onSubmit={handleSaveSettings} className="space-y-6">
                    {/* Bookclub Image */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Bookclub Image</label>
                      <div className="relative group w-52 h-52">
                        <img 
                          src={bookClub?.imageUrl ? `http://localhost:4000${bookClub.imageUrl}` : '/images/default.webp'}
                          alt={bookClub?.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => { e.target.src = '/images/default.webp'; }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-lg">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
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
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Bookclub Name</label>
                      <input
                        type="text"
                        value={settingsForm.name}
                        onChange={(e) => setSettingsForm({...settingsForm, name: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                      <textarea
                        value={settingsForm.description}
                        onChange={(e) => setSettingsForm({...settingsForm, description: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Category</label>
                      <select
                        value={settingsForm.category}
                        onChange={(e) => setSettingsForm({...settingsForm, category: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="">Select a category</option>
                        <option value="Fiction">Fiction</option>
                        <option value="Non-Fiction">Non-Fiction</option>
                        <option value="Mystery">Mystery</option>
                        <option value="Romance">Romance</option>
                        <option value="Science Fiction">Science Fiction</option>
                        <option value="Fantasy">Fantasy</option>
                        <option value="Thriller">Thriller</option>
                        <option value="Biography">Biography</option>
                        <option value="Self-Help">Self-Help</option>
                        <option value="History">History</option>
                        <option value="Poetry">Poetry</option>
                        <option value="Young Adult">Young Adult</option>
                        <option value="Classic Literature">Classic Literature</option>
                        <option value="Horror">Horror</option>
                        <option value="Philosophy">Philosophy</option>
                      </select>
                    </div>

                    {/* Visibility */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">Visibility</label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-650">
                          <input
                            type="radio"
                            value="PUBLIC"
                            checked={settingsForm.visibility === 'PUBLIC'}
                            onChange={(e) => setSettingsForm({...settingsForm, visibility: e.target.value})}
                            className="w-4 h-4"
                          />
                          <FiUnlock className="text-green-400" />
                          <div>
                            <span className="font-semibold text-white">Public</span>
                            <p className="text-sm text-gray-400">Anyone can see and join instantly</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-650">
                          <input
                            type="radio"
                            value="PRIVATE"
                            checked={settingsForm.visibility === 'PRIVATE'}
                            onChange={(e) => setSettingsForm({...settingsForm, visibility: e.target.value})}
                            className="w-4 h-4"
                          />
                          <FiLock className="text-yellow-400" />
                          <div>
                            <span className="font-semibold text-white">Private</span>
                            <p className="text-sm text-gray-400">Anyone can see, join requires approval</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-650">
                          <input
                            type="radio"
                            value="INVITE_ONLY"
                            checked={settingsForm.visibility === 'INVITE_ONLY'}
                            onChange={(e) => setSettingsForm({...settingsForm, visibility: e.target.value})}
                            className="w-4 h-4"
                          />
                          <FiEyeOff className="text-purple-400" />
                          <div>
                            <span className="font-semibold text-white">Invite Only</span>
                            <p className="text-sm text-gray-400">Only visible to members, join via invite</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Approval Checkbox */}
                    {settingsForm.visibility === 'PRIVATE' && (
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsForm.requiresApproval}
                            onChange={(e) => setSettingsForm({...settingsForm, requiresApproval: e.target.checked})}
                            className="w-5 h-5"
                          />
                          <span className="font-semibold text-white">Require admin approval for join requests</span>
                        </label>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className={`w-full px-6 py-3 rounded-xl font-semibold transition-colors ${
                        savingSettings
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {savingSettings ? 'Saving...' : 'Save Settings'}
                    </button>
                  </form>
                </div>

                {/* Admin Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <AdminApprovalPanel bookclubId={bookClubId} userRole={userRole} />
                  <InviteLinkManager bookclubId={bookClubId} userRole={userRole} />
                </div>

                {/* Member Management */}
                <MemberManagement
                  bookclub={{
                    ...bookClub,
                    members: mappedBookClubMembers
                  }}
                  currentUserId={auth?.user?.id}
                  currentUserRole={userRole}
                  onMemberUpdate={async () => {
                    const response = await bookclubAPI.getBookclubPreview(bookClubId);
                    setBookClub(response.data);
                    // Increment counter to force re-render
                    setRoleUpdateCounter(prev => prev + 1);
                  }}
                />
              </div>
            ) : showCalendar ? (
              <div className="flex-1 overflow-hidden">
                <CalendarView
                  bookClubId={bookClubId}
                  auth={auth}
                  onAddEvent={handleAddEvent}
                  onEditEvent={handleEditEvent}
                  onDeleteEvent={handleDeleteEvent}
                  onEventSaved={handleCalendarRefreshCallback}
                />
              </div>
            ) : showSuggestions ? (
              <div className="flex-1 overflow-hidden">
                <BookSuggestionsView
                  bookClubId={bookClubId}
                  auth={auth}
                />
              </div>
            ) : showBooksHistory ? (
              <div className="flex-1 overflow-y-auto p-6">
                {loadingBooks ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p>Loading books...</p>
                  </div>
                ) : (
                  <BookClubBookView setShowAddBookModal={setShowAddBookModal} bookclubBooks={bookclubBooks} setCurrentBookData={setCurrentBookData} setCurrentBookDetailsOpen={setCurrentBookDetailsOpen} handleStatusChange={handleStatusChange} />
                )}
              </div>
            ) : (
              <BookClubChat 
                messages={messages} 
                setMessages={setMessages}
                currentRoom={currentRoom} 
                auth={auth} 
                userRole={userRole}
                ws={ws}
              />
            )}

            {/* Message Input - Only show when not viewing special views */}
            {!showBooksHistory && !showCalendar && !showSuggestions && !showSettings && auth?.user ? (
              <MessageInput
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                selectedFiles={selectedFiles}
                uploadingFiles={uploadingFiles}
                currentRoom={currentRoom}
                fileUploadRef={fileUploadRef}
                onFilesSelected={handleFilesSelected}
                onSubmit={handleSendMessage}
                auth={auth}
              />
            ) : !showBooksHistory && !showCalendar && !showSuggestions && !showSettings ? (
              <div className="bg-gray-800 border-t border-gray-700 p-4 text-center">
                <p className="text-gray-400">
                  Please <button onClick={() => navigate('/login', { state: { from: `/bookclub/${bookClubId}` } })} className="text-purple-400 hover:underline">log in</button> to chat
                </p>
              </div>
            ) : null}

          </div>
          )}
          {/* Connected Users Sidebar */}
          <ConnectedUsersSidebar
              bookClubMembers={mappedBookClubMembers}
              connectedUsers={connectedUsers}
              friends={friends}
              auth={auth}
              onSendFriendRequest={handleSendFriendRequest}
            />
        </div>


        {/* MODALS  */}

        {/* Add Current Book Modal */}
        {addCurrentBookState && (
          <AddCurrentBookModal
            bookClubId={bookClubId}
            onClose={() => setAddCurrentBookState(false)}
            onBookAdded={(book) => {
              console.log('Book added:', book);
              setAddCurrentBookState(false);
              // Trigger refresh in SideBarRooms by updating a timestamp or similar
            }}
          />
        )}

        {/* Current Book Details Modal */}
        {currentBookDetailsOpen && currentBookData && (
          <CurrentBookDetailsModal
            bookClubId={bookClubId}
            currentBookData={currentBookData}
            onClose={() => setCurrentBookDetailsOpen(false)}
            onBookUpdated={(updatedBook) => {
              setCurrentBookData(updatedBook);
              // Trigger refresh in SideBarRooms
            }}
            onBookRemoved={() => {
              setCurrentBookData(null);
              setCurrentBookDetailsOpen(false);
              // Trigger refresh in SideBarRooms
            }}
          />
        )}


        {/* Add Book to Bookclub Modal */}
        {showAddBookModal && (
          <AddBookToBookclubModal
            bookClubId={bookClubId}
            onClose={() => setShowAddBookModal(false)}
            onBookAdded={(book) => {
              console.log('Book added:', book);
              setShowAddBookModal(false);
              // Refresh the books list
              fetchBookclubBooks();
            }}
          />
        )}

        {/* Add/Edit Event Modal */}
        {showAddEventModal && (
          <AddEventModal
            isOpen={showAddEventModal}
            onClose={() => {
              setShowAddEventModal(false);
              setEventToEdit(null);
              setSelectedEventDate(null);
            }}
            bookClubId={bookClubId}
            auth={auth}
            eventToEdit={eventToEdit}
            selectedDate={selectedEventDate}
            onEventSaved={handleEventSaved}
          />
        )}

        {/* Invite Modal */}
        {console.log('showInviteModal:', showInviteModal)}
        {showInviteModal && (
          <InviteModal
            bookClubId={bookClubId}
            bookClubName={bookClub?.name}
            onClose={() => setShowInviteModal(false)}
          />
        )}
    </div>
  );
};

export default BookClub;

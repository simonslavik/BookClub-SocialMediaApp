import { lazy, Suspense, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookclubData } from '@hooks/useBookclubData';
import { useBookclubViews } from '@hooks/useBookclubViews';
import { useModals } from '@hooks/useModals';
import { useBookclubWebSocket } from '@hooks/useBookclubWebSocket';

// Layout / chrome
import MyBookClubsSidebar from '@components/features/bookclub/MyBookClubsSidebar';
import SideBarRooms from '@components/features/bookclub/SideBar/SideBarRooms';
import ConnectedUsersSidebar from '@components/features/bookclub/ConnectedUsersSidebar';
import ResizablePanel from '@components/common/ResizablePanel';
import BookclubHeader from '@components/features/bookclub/MainChatArea/BookclubHeader';
import { ChatSkeleton, SidebarSkeleton } from '@components/common/Skeleton';

// Content views
import BookClubChat from '@components/features/bookclub/MainChatArea/BookClubChat';
import BookClubBookView from '@components/features/bookclub/MainChatArea/BookClubBookView';
import CalendarView from '@components/features/bookclub/MainChatArea/CalendarView';
import BookSuggestionsView from '@components/features/bookclub/MainChatArea/BookSuggestionsView';
import MeetingsView from '@components/features/bookclub/MainChatArea/MeetingsView';
import BookclubSettingsPanel from './BookclubSettingsPanel';

// Modals — lazy-loaded (only fetched when a modal is actually opened)
const AddCurrentBookModal = lazy(() => import('@components/features/bookclub/Modals/AddCurrentBookModal'));
const CurrentBookDetailsModal = lazy(() => import('@components/features/bookclub/Modals/CurrentBookDetailsModal'));
const AddBookToBookclubModal = lazy(() => import('@components/features/bookclub/Modals/AddBookToBookclubModal'));
const CreateRoomModal = lazy(() => import('@components/features/bookclub/Modals/CreateRoomModal'));
const RoomSettingsModal = lazy(() => import('@components/features/bookclub/Modals/RoomSettingsModal'));
const ScheduleMeetingModal = lazy(() => import('@components/features/bookclub/Modals/ScheduleMeetingModal'));
const InviteModal = lazy(() => import('@components/common/modals/InviteModal'));

// Input area
import MessageInput from '@components/features/bookclub/MessageInput';
import TypingIndicator from '@components/common/TypingIndicator';

import { FiX, FiMenu, FiUsers } from 'react-icons/fi';
import logger from '@utils/logger';

// ─────────────────────────────────────────────────────────────
const BookClub = () => {
  const { id: bookClubId } = useParams();
  const navigate = useNavigate();

  // ─── Data layer ─────────────────────────────────────────
  const data = useBookclubData(bookClubId);
  const {
    auth, setAuth, logout,
    bookClub, setBookClub, rooms, setRooms, currentRoom, setCurrentRoom,
    loading, error, myBookClubs, userRole, setUserRole, friends,
    bookclubBooks, loadingBooks, fetchBookclubBooks,
    handleStatusChange, handleRateBook, handleRemoveRating,
    settingsForm, setSettingsForm, savingSettings, handleSaveSettings,
    uploadingImage, fileInputRef, handleImageUpload, handleDeleteImage,
    handleCreateRoomSubmit, handleRoomUpdated, handleRoomDeleted,
    handleSendFriendRequest, handleMemberUpdate,
    roleUpdateCounter, extractUserRole, buildMappedMembers,
    toastError,
  } = data;

  // ─── View state machine ────────────────────────────────
  const {
    activeView, switchView, openSettings, closeSettings, is, isSpecialView,
  } = useBookclubViews(bookClubId, null); // viewSection wired after WS hook

  // ─── Modals (simple open/close) ────────────────────────
  const modals = useModals([
    'addCurrentBook', 'addBook', 'createRoom', 'invite',
  ]);

  // Data-carrying modal state (needs associated payload)
  const [currentBookData, setCurrentBookData] = useState(null);
  const [roomSettingsTarget, setRoomSettingsTarget] = useState(null);
  const [meetingToEdit, setMeetingToEdit] = useState(null);
  const [showScheduleMeetingModal, setShowScheduleMeetingModal] = useState(false);

  // ─── Chat-related local state ──────────────────────────
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const fileUploadRef = useRef(null);

  // ─── Mobile sidebar toggles ────────────────────────────
  const [showMobileLeftSidebar, setShowMobileLeftSidebar] = useState(false);
  const [showMobileRightSidebar, setShowMobileRightSidebar] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e) => {
      if (e.matches) {
        setShowMobileLeftSidebar(false);
        setShowMobileRightSidebar(false);
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // ─── WebSocket ─────────────────────────────────────────
  const handleWsInit = useCallback(({ rooms: wsRooms, userRole: wsUserRole }) => {
    if (wsRooms?.length > 0) {
      setRooms(wsRooms);
      if (currentRoom) {
        const updated = wsRooms.find((r) => r.id === currentRoom.id);
        if (updated) setCurrentRoom((prev) => ({ ...prev, ...updated }));
      }
    }
    if (wsUserRole) setUserRole(wsUserRole);
  }, [currentRoom, setRooms, setCurrentRoom, setUserRole]);

  const {
    ws, messages, setMessages, connectedUsers,
    bookClubMembers, unreadRooms, setUnreadRooms,
    unreadSections, viewSection, notifySectionActivity,
    lastReadAt, hasMoreMessages, loadingOlder, loadOlderMessages,
    typingUsers, sendTyping,
  } = useBookclubWebSocket(bookClub, currentRoom, auth, bookClubId, { onInit: handleWsInit });

  // ─── Extract role whenever members change ──────────────
  useEffect(() => {
    extractUserRole(bookClubMembers);
  }, [bookClubMembers, extractUserRole]);

  // ─── Mapped members with roles ─────────────────────────
  const mappedBookClubMembers = useMemo(
    () => buildMappedMembers(bookClubMembers),
    [bookClubMembers, buildMappedMembers, roleUpdateCounter],
  );

  // ─── Room switching ────────────────────────────────────
  const switchRoom = useCallback((room) => {
    if (room.id === currentRoom?.id) return;
    setMessages([]);
    setCurrentRoom(room);
    switchView('chat');
    setUnreadRooms((prev) => {
      const next = new Set(prev);
      next.delete(room.id);
      return next;
    });
  }, [currentRoom?.id, setMessages, setCurrentRoom, switchView, setUnreadRooms]);

  // ─── View switching with WS section notification ───────
  const handleSwitchView = useCallback((view) => {
    switchView(view);
    if (view !== 'chat' && view !== 'settings') {
      viewSection(view === 'books' ? 'books' : view);
    }
    if (view !== 'chat') setCurrentRoom(null);
    if (view === 'books') fetchBookclubBooks();
  }, [switchView, viewSection, setCurrentRoom, fetchBookclubBooks]);

  // ─── Send message handler ─────────────────────────────
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    const rawMessage = e._rawMessage || newMessage;
    const hasMessage = rawMessage.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;
    if ((!hasMessage && !hasFiles) || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    setUploadingFiles(true);
    try {
      let attachments = [];
      if (selectedFiles.length > 0 && fileUploadRef.current) {
        attachments = await fileUploadRef.current.uploadFiles();
      }

      const msgText = rawMessage.trim() || null;
      const replyId = replyingTo?.id || null;

      if (attachments.length > 0) {
        // Send each attachment as its own message; attach text to the first one
        attachments.forEach((attachment, i) => {
          ws.current.send(JSON.stringify({
            type: 'chat-message',
            message: i === 0 ? msgText : null,
            attachments: [attachment],
            replyToId: replyId,
          }));
        });
      } else if (msgText) {
        // Text-only message
        ws.current.send(JSON.stringify({
          type: 'chat-message', message: msgText, attachments: [], replyToId: replyId,
        }));
      }

      setNewMessage('');
      setSelectedFiles([]);
      setReplyingTo(null);
    } catch (err) {
      logger.error('Error sending message:', err);
      toastError('Failed to send message');
    } finally {
      setUploadingFiles(false);
    }
  }, [newMessage, selectedFiles, ws, replyingTo, toastError]);

  // ─── Loading / Error states ────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen bg-gray-900">
        <div className="w-[72px] bg-[#1a1a2e] border-r border-white/5"><SidebarSkeleton /></div>
        <div className="w-60 bg-[#1e1e2e] p-3 space-y-2">
          <div className="animate-pulse bg-white/10 h-8 rounded-lg mb-4" />
          {[...Array(5)].map((_, i) => <div key={i} className="animate-pulse bg-white/5 h-9 rounded-lg" />)}
        </div>
        <div className="flex-1 bg-[#12121c]">
          <div className="h-14 bg-[#1e1e2e] border-b border-white/5 animate-pulse" />
          <ChatSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
            <FiX className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-200 mb-2 font-display">Failed to Load</h2>
          <p className="text-sm text-gray-400 mb-6 font-outfit">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-stone-700 text-white rounded-xl text-sm font-semibold hover:bg-stone-800 transition-colors font-outfit">Retry</button>
            <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-white/10 text-gray-300 rounded-xl text-sm font-medium hover:bg-white/15 transition-colors font-outfit">Go Home</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main layout ───────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Mobile overlay */}
      {(showMobileLeftSidebar || showMobileRightSidebar) && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-[70]"
          onClick={() => { setShowMobileLeftSidebar(false); setShowMobileRightSidebar(false); }}
        />
      )}

      {/* ── Left sidebars ─────────────────────────────── */}
      <div className={`${showMobileLeftSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-[80] flex transition-transform duration-300 ease-in-out`}>
        <ResizablePanel side="right" defaultWidth={80} minWidth={80} maxWidth={80} collapseThreshold={50} storageKey="bookclub-mybookclubs-width">
          <MyBookClubsSidebar
            bookClubs={myBookClubs}
            currentBookClubId={bookClubId}
            onSelectBookClub={(id) => navigate(`/bookclub/${id}`)}
            onOpenDM={() => navigate('/dm')}
            auth={auth} setAuth={setAuth} wsRef={ws} onLogout={logout}
          />
        </ResizablePanel>

        <ResizablePanel side="right" defaultWidth={256} minWidth={180} maxWidth={400} storageKey="bookclub-rooms-width">
          <SideBarRooms
            bookClub={bookClub} rooms={rooms} currentRoom={currentRoom}
            switchRoom={switchRoom}
            handleCreateRoom={() => modals.open('createRoom')}
            onOpenRoomSettings={(room) => setRoomSettingsTarget(room)}
            auth={auth} userRole={userRole}
            uploadingImage={uploadingImage} fileInputRef={fileInputRef}
            handleImageUpload={handleImageUpload} handleDeleteImage={handleDeleteImage}
            onNameUpdate={(name) => setBookClub((prev) => ({ ...prev, name }))}
            onOpenDM={() => navigate('/dm')}
            setAddCurrentBookState={(v) => v ? modals.open('addCurrentBook') : modals.close('addCurrentBook')}
            addCurrentBookState={modals.isOpen('addCurrentBook')}
            onCurrentBookClick={(bookData) => { setCurrentBookData(bookData); }}
            onShowBooksHistory={() => handleSwitchView('books')}
            setShowBooksHistory={(v) => v ? handleSwitchView('books') : switchView('chat')}
            showBooksHistory={is('books')}
            onShowCalendar={() => handleSwitchView('calendar')}
            showCalendar={is('calendar')}
            onShowSuggestions={() => handleSwitchView('suggestions')}
            showSuggestions={is('suggestions')}
            onShowMeetings={() => handleSwitchView('meetings')}
            showMeetings={is('meetings')}
            unreadRooms={unreadRooms} unreadSections={unreadSections}
          />
        </ResizablePanel>
      </div>

      <div className="flex flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between bg-gray-800 border-b border-gray-700 px-3 py-2">
          <button onClick={() => setShowMobileLeftSidebar(true)} className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors" aria-label="Open navigation">
            <FiMenu size={20} />
          </button>
          <span className="text-white font-medium text-sm truncate mx-2">{bookClub?.name || 'Book Club'}</span>
          <button onClick={() => setShowMobileRightSidebar(true)} className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors" aria-label="Open members panel">
            <FiUsers size={20} />
          </button>
        </div>

        {/* ── Main content area ───────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 pt-12 md:pt-0">
          <BookclubHeader
            showBooksHistory={is('books')}
            showCalendar={is('calendar')}
            showSuggestions={is('suggestions')}
            showMeetings={is('meetings')}
            showSettings={is('settings')}
            currentRoom={currentRoom}
            auth={auth}
            onInviteClick={() => modals.open('invite')}
            onSettingsClick={openSettings}
            userRole={userRole}
          />

          {/* ── View router ────────────────────────────── */}
          {is('settings') ? (
            <BookclubSettingsPanel
              bookClub={bookClub} settingsForm={settingsForm}
              setSettingsForm={setSettingsForm} savingSettings={savingSettings}
              handleSaveSettings={handleSaveSettings}
              uploadingImage={uploadingImage} fileInputRef={fileInputRef}
              handleImageUpload={handleImageUpload} handleDeleteImage={handleDeleteImage}
              bookClubId={bookClubId} mappedBookClubMembers={mappedBookClubMembers}
              userRole={userRole} auth={auth}
              onMemberUpdate={handleMemberUpdate} onClose={closeSettings}
            />
          ) : is('calendar') ? (
            <div className="flex-1 overflow-hidden">
              <CalendarView bookClubId={bookClubId} />
            </div>
          ) : is('suggestions') ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <BookSuggestionsView
                bookClubId={bookClubId} auth={auth} members={bookClubMembers}
                onSuggestionAdded={() => notifySectionActivity('suggestions')}
              />
            </div>
          ) : is('meetings') ? (
            <MeetingsView
              bookClubId={bookClubId} currentUserId={auth?.user?.id}
              allMembers={bookClubMembers} userRole={userRole}
              onScheduleMeeting={() => { setMeetingToEdit(null); setShowScheduleMeetingModal(true); }}
              onEditMeeting={(m) => { setMeetingToEdit(m); setShowScheduleMeetingModal(true); }}
            />
          ) : is('books') ? (
            <div className="flex-1 overflow-y-auto p-3 md:p-6">
              {loadingBooks ? (
                <div className="space-y-4 mt-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                      <div className="animate-pulse bg-white/10 w-16 h-24 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="animate-pulse bg-white/10 h-5 w-3/4 rounded" />
                        <div className="animate-pulse bg-white/10 h-4 w-1/2 rounded" />
                        <div className="animate-pulse bg-white/10 h-3 w-1/4 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <BookClubBookView
                  setShowAddBookModal={(v) => v ? modals.open('addBook') : modals.close('addBook')}
                  bookclubBooks={bookclubBooks}
                  setCurrentBookData={setCurrentBookData}
                  setCurrentBookDetailsOpen={(v) => v && currentBookData}
                  handleStatusChange={handleStatusChange}
                  onRateBook={handleRateBook} onRemoveRating={handleRemoveRating}
                  currentUserId={auth?.user?.id} userRole={userRole}
                />
              )}
            </div>
          ) : (
            <BookClubChat
              messages={messages} setMessages={setMessages}
              currentRoom={currentRoom} auth={auth} userRole={userRole} ws={ws}
              members={bookClubMembers} onReply={setReplyingTo}
              friends={friends} onSendFriendRequest={handleSendFriendRequest}
              connectedUsers={connectedUsers} lastReadAt={lastReadAt}
              hasMoreMessages={hasMoreMessages} loadingOlder={loadingOlder}
              onLoadOlder={loadOlderMessages}
            />
          )}

          {/* Typing indicator — chat view only */}
          {!isSpecialView && <TypingIndicator typingUsers={typingUsers} />}

          {/* Message input — chat view only */}
          {!isSpecialView && auth?.user ? (
            currentRoom?.type === 'ANNOUNCEMENT' && !['OWNER', 'ADMIN', 'MODERATOR'].includes(userRole) ? (
              <div className="bg-gray-800 border-t border-gray-700 p-4 text-center">
                <p className="text-gray-400 text-sm">📢 This is an announcement channel — only moderators can post.</p>
              </div>
            ) : (
              <MessageInput
                newMessage={newMessage} setNewMessage={setNewMessage}
                selectedFiles={selectedFiles} uploadingFiles={uploadingFiles}
                currentRoom={currentRoom} fileUploadRef={fileUploadRef}
                onFilesSelected={setSelectedFiles} onSubmit={handleSendMessage}
                auth={auth} members={bookClubMembers}
                replyingTo={replyingTo} onCancelReply={() => setReplyingTo(null)}
                onTyping={sendTyping}
              />
            )
          ) : !isSpecialView ? (
            <div className="bg-gray-800 border-t border-gray-700 p-4 text-center">
              <p className="text-gray-400">
                Please <button onClick={() => navigate('/login', { state: { from: `/bookclub/${bookClubId}` } })} className="text-stone-500 hover:underline">log in</button> to chat
              </p>
            </div>
          ) : null}
        </div>

        {/* ── Right sidebar (connected users) ─────────── */}
        <div className={`${showMobileRightSidebar ? 'fixed inset-y-0 right-0 translate-x-0' : 'hidden md:block md:static'} md:translate-x-0 z-[80] transition-transform duration-300 ease-in-out`}>
          <ResizablePanel side="left" defaultWidth={176} minWidth={120} maxWidth={320} storageKey="bookclub-users-width">
            <ConnectedUsersSidebar
              bookClubMembers={mappedBookClubMembers} connectedUsers={connectedUsers}
              friends={friends} auth={auth} onSendFriendRequest={handleSendFriendRequest}
            />
          </ResizablePanel>
        </div>
      </div>

      {/* ── Modals (lazy-loaded) ─────────────────────────── */}
      <Suspense fallback={null}>
        {modals.isOpen('addCurrentBook') && (
        <AddCurrentBookModal
          bookClubId={bookClubId}
          onClose={() => modals.close('addCurrentBook')}
          onBookAdded={() => modals.close('addCurrentBook')}
        />
      )}

      {currentBookData && (
        <CurrentBookDetailsModal
          bookClubId={bookClubId} currentBookData={currentBookData}
          members={bookClubMembers}
          onClose={() => setCurrentBookData(null)}
          onBookUpdated={setCurrentBookData}
          onBookRemoved={() => setCurrentBookData(null)}
        />
      )}

      {modals.isOpen('addBook') && (
        <AddBookToBookclubModal
          bookClubId={bookClubId}
          onClose={() => modals.close('addBook')}
          onBookAdded={() => { modals.close('addBook'); fetchBookclubBooks(); notifySectionActivity('books'); }}
        />
      )}

      {modals.isOpen('invite') && (
        <InviteModal
          bookClubId={bookClubId} bookClubName={bookClub?.name}
          bookClubMembers={mappedBookClubMembers} currentUserRole={userRole}
          onClose={() => modals.close('invite')}
        />
      )}

      <CreateRoomModal
        isOpen={modals.isOpen('createRoom')}
        onClose={() => modals.close('createRoom')}
        onCreateRoom={async (roomData) => {
          const room = await handleCreateRoomSubmit(roomData);
          switchRoom(room);
        }}
        members={bookClubMembers} currentUserId={auth?.user?.id}
      />

      <RoomSettingsModal
        isOpen={!!roomSettingsTarget} onClose={() => setRoomSettingsTarget(null)}
        room={roomSettingsTarget} bookClubId={bookClubId}
        allMembers={bookClubMembers} currentUserId={auth?.user?.id}
        userRole={userRole}
        onRoomUpdated={handleRoomUpdated} onRoomDeleted={handleRoomDeleted}
      />

      <ScheduleMeetingModal
        isOpen={showScheduleMeetingModal}
        onClose={() => { setShowScheduleMeetingModal(false); setMeetingToEdit(null); }}
        bookClubId={bookClubId} meeting={meetingToEdit}
        onMeetingSaved={() => {
          if (window.__meetingsRefresh) window.__meetingsRefresh();
          notifySectionActivity('meetings');
        }}
      />
      </Suspense>
    </div>
  );
};

export default BookClub;

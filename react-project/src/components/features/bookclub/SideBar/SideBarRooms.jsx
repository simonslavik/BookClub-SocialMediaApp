

import React from 'react';
import { FiHome, FiPlus, FiHash, FiMail, FiBook, FiCalendar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import BookClubImage from './BookClubImage';




const SideBarRooms = ({
    bookClub,
    rooms,
    currentRoom,
    switchRoom,
    handleCreateRoom,
    auth,
    uploadingImage,
    fileInputRef,
    handleImageUpload,
    handleDeleteImage,
    onOpenDM,
    setAddCurrentBookState,
    addCurrentBookState,
    onCurrentBookClick,
    onShowBooksHistory,
    setShowBooksHistory,
    showBooksHistory,
    onShowCalendar,
    showCalendar,
    onShowSuggestions,
    showSuggestions
}) => {
    const navigate = useNavigate();

    if (!bookClub) {
        return (
            <div className="w-64 bg-gray-800 border-r border-gray-700 flex items-center justify-center h-full">
                <p className="text-gray-400">Loading...</p>
            </div>
        );
    }

    return (
          <>
          <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-full  overflow-y-auto">
            {/* Bookclub Header with Image */}
            <div className="p-4 border-b border-gray-700 flex-shrink-0">
              {/* Bookclub Image */}
              <BookClubImage 
                bookClub={bookClub} 
                auth={auth} 
                uploadingImage={uploadingImage} 
                fileInputRef={fileInputRef} 
                handleImageUpload={handleImageUpload} 
                handleDeleteImage={handleDeleteImage}
              />
              
              <h2 
                className="text-white font-bold text-lg truncate cursor-pointer hover:text-purple-400"
                onClick={() => navigate(`/bookclubpage/${bookClub?.id}`)}
              >
                {bookClub?.name}
              </h2>
            </div>

            {/* Book Suggestions Button */}
            <div className='border-b border-gray-700 p-4 flex-shrink-0'>
              <button
                onClick={() => onShowSuggestions && onShowSuggestions()}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors text-sm ${
                  showSuggestions 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                <span className="text-lg">📚</span>
                Book Suggestions
              </button>
            </div>
            
            {/* Books History Button */}
            <div className='border-b border-gray-700 p-4 flex-shrink-0'>
              <button
                onClick={() => onShowBooksHistory && onShowBooksHistory()}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors text-sm ${
                  showBooksHistory 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                <FiBook size={14} />
                BookClub Books
              </button>
            </div>

            {/* Calendar Button */}
            <div className='border-b border-gray-700 p-4 flex-shrink-0'>
              <button
                onClick={() => onShowCalendar && onShowCalendar()}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors text-sm ${
                  showCalendar 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                <FiCalendar size={14} />
                BookClub Calendar
              </button>
            </div>

            {/* Rooms List */}
            <div className="flex-1">
              <div className="p-2">
                <div className="flex items-center justify-between px-2 py-1 mb-2">
                  <h3 className="text-gray-400 text-xs font-semibold uppercase">Rooms</h3>
                  {auth?.user && (
                    <button 
                      onClick={handleCreateRoom}
                      className="text-gray-400 hover:text-white"
                      title="Create Room"
                    >
                      <FiPlus size={14} />
                    </button>
                  )}
                </div>
                
                {rooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => switchRoom(room)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                      currentRoom?.id === room.id && !showBooksHistory && !showCalendar && !showSuggestions
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <FiHash size={16} />
                    <span className="truncate">{room.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          </>
    );
};

export default SideBarRooms;
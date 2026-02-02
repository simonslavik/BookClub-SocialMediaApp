

import React, { useState, useRef, useEffect } from 'react';
import { FiHome, FiPlus, FiHash, FiMail, FiBook, FiCalendar, FiChevronUp, FiChevronDown } from 'react-icons/fi';
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
    onNameUpdate,
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
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState(bookClub?.name || '');
    const [currentBook, setCurrentBook] = useState(null);
    const nameInputRef = useRef(null);
    const [displayBooksSection, setDisplayBooksSection] = useState(true);

    useEffect(() => {
        setNewName(bookClub?.name || '');
    }, [bookClub]);

    useEffect(() => {
        const fetchCurrentBook = async () => {
            if (!bookClub?.id || !auth?.token) return;
            
            try {
                const response = await fetch(
                    `http://localhost:3000/v1/bookclub/${bookClub.id}/books?status=current`,
                    {
                        headers: {
                            'Authorization': `Bearer ${auth.token}`
                        }
                    }
                );
                const data = await response.json();
                if (data.success && data.data && data.data.length > 0) {
                    setCurrentBook(data.data[0]);
                }
            } catch (err) {
                console.error('Error fetching current book:', err);
            }
        };

        fetchCurrentBook();
    }, [bookClub?.id, auth?.token, addCurrentBookState]);

    const calculateDaysRemaining = () => {
        if (!currentBook?.endDate) return 0;
        const today = new Date();
        const end = new Date(currentBook.endDate);
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };

    const calculateProgress = () => {
        if (!currentBook?.startDate || !currentBook?.endDate) return 0;
        const start = new Date(currentBook.startDate);
        const end = new Date(currentBook.endDate);
        const today = new Date();
        const total = end - start;
        const elapsed = today - start;
        const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100));
        return Math.round(percentage);
    };

    const handleNameDoubleClick = () => {
        if (auth?.user && auth.user.id === bookClub?.creatorId) {
            setEditingName(true);
            setTimeout(() => {
                if (nameInputRef.current) {
                    nameInputRef.current.focus();
                }
            }, 0);
        }
    };

    const handleNameChange = (e) => {
        setNewName(e.target.value);
    };

    const handleNameBlur = async () => {
        await saveNameChange();
    };

    const handleNameKeyDown = async (e) => {
        if (e.key === 'Enter') {
            await saveNameChange();
        } else if (e.key === 'Escape') {
            setEditingName(false);
            setNewName(bookClub?.name || '');
        }
    };

    const saveNameChange = async () => {
        if (!newName.trim() || newName === bookClub?.name) {
            setEditingName(false);
            setNewName(bookClub?.name || '');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/v1/editor/bookclubs/${bookClub.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.token}`
                },
                body: JSON.stringify({ name: newName.trim() })
            });

            const data = await response.json();
            
            if (response.ok && onNameUpdate) {
                onNameUpdate(data.bookClub.name);
                setEditingName(false);
            } else {
                alert(data.error || 'Failed to update book club name');
                setEditingName(false);
                setNewName(bookClub?.name || '');
            }
        } catch (err) {
            console.error('Error updating book club name:', err);
            alert('Failed to update book club name');
            setEditingName(false);
            setNewName(bookClub?.name || '');
        }
    };

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
              
              {editingName ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={newName}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  onKeyDown={handleNameKeyDown}
                  className="text-white font-bold text-lg bg-gray-700 px-2 py-1 rounded border border-purple-500 focus:outline-none w-full"
                />
              ) : (
                <div className="flex items-center">
                  <h2 
                    className={`text-white font-bold text-lg truncate ${
                      auth?.user && auth.user.id === bookClub?.creatorId 
                        ? 'cursor-pointer hover:text-purple-400' 
                        : ''
                    }`}
                    
                    onClick={() => navigate(`/bookclubpage/${bookClub?.id}`)}
                  >
                    {bookClub?.name}
                  </h2>
                  {auth?.user && auth.user.id === bookClub?.creatorId ? <button onClick={handleNameDoubleClick} className="ml-2 text-gray-400 hover:text-white">
                    <FiPlus size={14} />
                  </button> : null}
                  
                </div>
              )}
            </div>

            {/* Toggle Books Section Button */}
            <button 
              onClick={() => setDisplayBooksSection(!displayBooksSection)} 
              className="p-3 border-b border-gray-700 text-white bg-gray-750 hover:bg-gray-700 w-full flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-2">
                <FiBook size={16} className="text-purple-400" />
                <span className="font-semibold text-sm">Current Book</span>
              </div>
              {displayBooksSection ? (
                <FiChevronUp size={16} className="text-gray-400 group-hover:text-white transition-colors" />
              ) : (
                <FiChevronDown size={16} className="text-gray-400 group-hover:text-white transition-colors" />
              )}
            </button>

            {/* Books Section */}
            {displayBooksSection && (
            <div className="border-b border-gray-700 p-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-400 text-xs font-semibold uppercase">Current Book</h3>
              </div>
              
              {currentBook ? (
                <div 
                  onClick={() => onCurrentBookClick && onCurrentBookClick(currentBook)}
                  className="bg-gray-700 rounded-lg p-3 mb-3 cursor-pointer hover:bg-gray-600 transition-colors"
                >
                  {/* Book Cover and Info */}
                  <div className="flex gap-3 mb-3">
                    <img
                      src={currentBook.book?.coverUrl || '/images/default.webp'}
                      alt={currentBook.book?.title}
                      className="w-16 h-24 object-cover rounded shadow-md"
                      onError={(e) => { e.target.src = '/images/default.webp'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                        {currentBook.book?.title}
                      </h4>
                      <p className="text-gray-400 text-xs mb-2">
                        {currentBook.book?.author}
                      </p>
                      {currentBook.book?.pageCount && (
                        <p className="text-gray-500 text-xs">
                          {currentBook.book.pageCount} pages
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{calculateProgress()}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${calculateProgress()}%` }}
                      />
                    </div>
                  </div>

                  {/* Days Remaining */}
                  <div className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⏱️</span>
                      <div>
                        <p className="text-white font-bold text-lg">
                          {calculateDaysRemaining()}
                        </p>
                        <p className="text-gray-400 text-xs">days left</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">Due</p>
                      <p className="text-white text-xs font-medium">
                        {new Date(currentBook.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-700 rounded-lg p-4 mb-3 text-center">
                  <p className="text-gray-400 text-sm mb-2">📚</p>
                  <p className="text-gray-400 text-xs">No current book</p>
                </div>
              )}

              <button
                onClick={() => setAddCurrentBookState(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm"
              >
                {currentBook ? 'Change Book' : 'Add Current Book'}
              </button>
            </div>
            )}
            
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
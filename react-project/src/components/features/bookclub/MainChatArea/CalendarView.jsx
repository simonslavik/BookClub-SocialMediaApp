import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import apiClient from '@api/axios';
import logger from '@utils/logger';

const CalendarView = ({ bookClubId, auth, onAddEvent, onEditEvent, onDeleteEvent, onEventSaved }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookClubBooks, setBookClubBooks] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    fetchEvents();
    fetchBookClubBooks();
  }, [bookClubId, refreshTrigger]);

  // Expose refresh function to parent via callback (only once on mount)
  useEffect(() => {
    if (onEventSaved) {
      // Pass refresh function to parent
      const refresh = () => setRefreshTrigger(prev => prev + 1);
      onEventSaved(refresh);
    }
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await apiClient.get(`/v1/editor/bookclubs/${bookClubId}/events`);
      setEvents(data.events || []);
    } catch (error) {
      logger.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookClubBooks = async () => {
    try {
      const { data } = await apiClient.get(`/v1/bookclub/${bookClubId}/books`);
      return setBookClubBooks(data.data || []);
    } catch (error) {
      logger.error('Error fetching book club books:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    
    return events.filter(event => {
      const eventDate = new Date(event.eventDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getBooksForDate = (date) => {
    if (!date) return [];
    
    return bookClubBooks.filter(book => {
      if (!book.startDate && !book.endDate) return false;
      
      const dateTime = date.getTime();
      const startTime = book.startDate ? new Date(book.startDate).getTime() : null;
      const endTime = book.endDate ? new Date(book.endDate).getTime() : null;
      
      // Show book on start date
      if (startTime && new Date(book.startDate).toDateString() === date.toDateString()) {
        return true;
      }
      
      // Show book on end date
      if (endTime && new Date(book.endDate).toDateString() === date.toDateString()) {
        return true;
      }
      
      return false;
    });
  };

  const getBookStatusColor = (status) => {
    const colors = {
      current: 'bg-emerald-600',
      upcoming: 'bg-amber-600',
      completed: 'bg-slate-600'
    };
    return colors[status] || 'bg-gray-600';
  };

  const getBookStatusLabel = (book, date) => {
    if (book.startDate && new Date(book.startDate).toDateString() === date.toDateString()) {
      return '📖 Start';
    }
    if (book.endDate && new Date(book.endDate).toDateString() === date.toDateString()) {
      return '✓ Due';
    }
    return book.status;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getEventTypeColor = (type) => {
    const colors = {
      meeting: 'bg-blue-500',
      book_deadline: 'bg-red-500',
      discussion: 'bg-green-500',
      other: 'bg-purple-500'
    };
    return colors[type] || colors.other;
  };

  const getEventTypeLabel = (type) => {
    const labels = {
      meeting: 'Meeting',
      book_deadline: 'Book Deadline',
      discussion: 'Discussion',
      other: 'Event'
    };
    return labels[type] || 'Event';
  };

  const days = getDaysInMonth(currentDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <FiChevronLeft className="text-white" />
          </button>
          <h2 className="text-white font-bold text-xl min-w-[200px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <FiChevronRight className="text-white" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm"
          >
            Today
          </button>
          {auth?.user && (
            <button
              onClick={() => onAddEvent && onAddEvent()}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors flex items-center gap-1 text-sm"
            >
              <FiPlus size={16} /> Add Event
            </button>
          )}
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-gray-400 text-sm font-semibold py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const dayBooks = getBooksForDate(date);
          const today = isToday(date);
          
          return (
            <div
              key={index}
              className={`min-h-[100px] p-2 rounded border ${
                date
                  ? today
                    ? 'bg-purple-900 bg-opacity-30 border-purple-500'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                  : 'bg-transparent border-transparent'
              } ${date && auth?.user ? 'cursor-pointer' : ''}`}
              onClick={(e) => {
                // Only trigger on the cell itself, not on events/books
                if (date && auth?.user && e.target === e.currentTarget) {
                  onAddEvent && onAddEvent(date);
                }
              }}
            >
              {date && (
                <>
                  <div className={`text-sm font-semibold mb-1 ${today ? 'text-purple-400' : 'text-gray-300'}`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {/* Events */}
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded ${getEventTypeColor(event.eventType)} text-white cursor-pointer hover:opacity-80 transition-opacity`}
                        onClick={() => setSelectedEvent(event)}
                        title={event.title}
                      >
                        <div className="font-semibold truncate">{event.title}</div>
                      </div>
                    ))}
                    
                    {/* Books */}
                    {dayBooks.map(book => (
                      <div
                        key={book.id}
                        className={`text-xs p-1 rounded ${getBookStatusColor(book.status)} text-white cursor-pointer hover:opacity-80 transition-opacity border border-white border-opacity-30`}
                        onClick={() => setSelectedBook({ ...book, clickedDate: date })}
                        title={`${book.book.title} - ${getBookStatusLabel(book, date)}`}
                      >
                        <div className="font-semibold truncate">
                          {getBookStatusLabel(book, date)}: {book.book.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Event details modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-white text-xl font-bold">{selectedEvent.title}</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3 mb-4">
              <div>
                <span className="text-gray-400 text-sm">Type:</span>
                <div className={`inline-block ml-2 px-2 py-1 rounded text-xs ${getEventTypeColor(selectedEvent.eventType)} text-white`}>
                  {getEventTypeLabel(selectedEvent.eventType)}
                </div>
              </div>
              
              <div>
                <span className="text-gray-400 text-sm">Date:</span>
                <div className="text-white">
                  {new Date(selectedEvent.eventDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              
              {selectedEvent.description && (
                <div>
                  <span className="text-gray-400 text-sm">Description:</span>
                  <div className="text-white mt-1">{selectedEvent.description}</div>
                </div>
              )}
            </div>

            {auth?.user?.id && selectedEvent?.createdBy && auth.user.id === selectedEvent.createdBy && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onEditEvent && onEditEvent(selectedEvent);
                    setSelectedEvent(null);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center justify-center gap-2"
                >
                  <FiEdit2 size={16} /> Edit
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this event?')) {
                      await onDeleteEvent(selectedEvent.id);
                      setSelectedEvent(null);
                      fetchEvents();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center justify-center gap-2"
                >
                  <FiTrash2 size={16} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Book details modal */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedBook(null)}>
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-white text-xl font-bold">{selectedBook.book.title}</h3>
              <button
                onClick={() => setSelectedBook(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {selectedBook.book.thumbnail && (
              <div className="flex justify-center mb-4">
                <img
                  src={selectedBook.book.thumbnail}
                  alt={selectedBook.book.title}
                  className="h-40 rounded shadow-lg"
                />
              </div>
            )}

            <div className="space-y-3">
              {selectedBook.book.authors && (
                <div>
                  <span className="text-gray-400 text-sm">Author:</span>
                  <div className="text-white">{selectedBook.book.authors}</div>
                </div>
              )}

              <div>
                <span className="text-gray-400 text-sm">Status:</span>
                <div className={`inline-block ml-2 px-2 py-1 rounded text-xs ${getBookStatusColor(selectedBook.status)} text-white`}>
                  {selectedBook.status?.charAt(0).toUpperCase() + selectedBook.status?.slice(1)}
                </div>
              </div>

              {selectedBook.startDate && (
                <div>
                  <span className="text-gray-400 text-sm">Start Date:</span>
                  <div className="text-white">
                    {new Date(selectedBook.startDate).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </div>
                </div>
              )}

              {selectedBook.endDate && (
                <div>
                  <span className="text-gray-400 text-sm">Due Date:</span>
                  <div className="text-white">
                    {new Date(selectedBook.endDate).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;

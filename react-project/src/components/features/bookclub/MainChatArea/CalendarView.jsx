import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiVideo } from 'react-icons/fi';
import apiClient from '@api/axios';
import { bookclubAPI } from '@api/bookclub.api';
import logger from '@utils/logger';

const CalendarView = ({ bookClubId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookClubBooks, setBookClubBooks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    fetchBookClubBooks();
    fetchMeetings();
  }, [bookClubId]);

  // Listen for meeting refresh events (triggered when meetings are created/edited/deleted)
  useEffect(() => {
    const originalRefresh = window.__meetingsRefresh;
    window.__meetingsRefresh = () => {
      originalRefresh?.();
      fetchMeetings();
    };
    return () => {
      window.__meetingsRefresh = originalRefresh;
    };
  }, [bookClubId]);

  // Listen for book changes (triggered when books are added/updated)
  useEffect(() => {
    const originalBookRefresh = window.__calendarBookRefresh;
    window.__calendarBookRefresh = () => {
      fetchBookClubBooks();
    };
    return () => {
      window.__calendarBookRefresh = originalBookRefresh;
    };
  }, [bookClubId]);

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

  const fetchMeetings = async () => {
    try {
      const data = await bookclubAPI.getMeetings(bookClubId, true);
      setMeetings(data.meetings || []);
    } catch (error) {
      logger.error('Error fetching meetings:', error);
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

  const getMeetingsForDate = (date) => {
    if (!date) return [];
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.scheduledAt);
      return (
        meetingDate.getDate() === date.getDate() &&
        meetingDate.getMonth() === date.getMonth() &&
        meetingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getMeetingPlatformColor = (platform) => {
    const colors = {
      zoom: 'bg-stone-500',
      google_meet: 'bg-green-500',
      teams: 'bg-stone-500',
      discord: 'bg-violet-500',
      custom: 'bg-stone-500'
    };
    return colors[platform] || colors.custom;
  };

  const getMeetingPlatformLabel = (platform) => {
    const labels = {
      zoom: 'Zoom',
      google_meet: 'Google Meet',
      teams: 'Teams',
      discord: 'Discord',
      custom: 'Meeting'
    };
    return labels[platform] || 'Meeting';
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
      upcoming: 'bg-stone-600',
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
        <button
          onClick={handleToday}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm"
        >
          Today
        </button>
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
          const dayBooks = getBooksForDate(date);
          const dayMeetings = getMeetingsForDate(date);
          const today = isToday(date);
          
          return (
            <div
              key={index}
              className={`min-h-[100px] p-2 rounded border ${
                date
                  ? today
                    ? 'bg-stone-950 bg-opacity-30 border-stone-500'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                  : 'bg-transparent border-transparent'
              }`}
            >
              {date && (
                <>
                  <div className={`text-sm font-semibold mb-1 ${today ? 'text-stone-500' : 'text-gray-300'}`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {/* Meetings */}
                    {dayMeetings.map(meeting => (
                      <div
                        key={`meeting-${meeting.id}`}
                        className={`text-xs p-1 rounded ${getMeetingPlatformColor(meeting.platform)} text-white cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1`}
                        onClick={(e) => { e.stopPropagation(); setSelectedMeeting(meeting); }}
                        title={`${meeting.title} - ${new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      >
                        <FiVideo size={10} className="flex-shrink-0" />
                        <span className="font-semibold truncate">{meeting.title}</span>
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

      {/* Meeting details modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedMeeting(null)}>
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-white text-xl font-bold flex items-center gap-2">
                <FiVideo className="text-stone-500" />
                {selectedMeeting.title}
              </h3>
              <button onClick={() => setSelectedMeeting(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <span className="text-gray-400 text-sm">Platform:</span>
                <div className={`inline-block ml-2 px-2 py-1 rounded text-xs ${getMeetingPlatformColor(selectedMeeting.platform)} text-white`}>
                  {getMeetingPlatformLabel(selectedMeeting.platform)}
                </div>
              </div>

              <div>
                <span className="text-gray-400 text-sm">Date & Time:</span>
                <div className="text-white">
                  {new Date(selectedMeeting.scheduledAt).toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })} at {new Date(selectedMeeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div>
                <span className="text-gray-400 text-sm">Duration:</span>
                <div className="text-white">{selectedMeeting.duration} minutes</div>
              </div>

              {selectedMeeting.description && (
                <div>
                  <span className="text-gray-400 text-sm">Description:</span>
                  <div className="text-white mt-1">{selectedMeeting.description}</div>
                </div>
              )}

              <div>
                <span className="text-gray-400 text-sm">Status:</span>
                <div className={`inline-block ml-2 px-2 py-1 rounded text-xs ${
                  selectedMeeting.status === 'LIVE' ? 'bg-green-500' :
                  selectedMeeting.status === 'CANCELLED' ? 'bg-red-500' :
                  selectedMeeting.status === 'ENDED' ? 'bg-gray-500' : 'bg-stone-500'
                } text-white`}>
                  {selectedMeeting.status}
                </div>
              </div>

              {selectedMeeting.rsvps && selectedMeeting.rsvps.length > 0 && (
                <div>
                  <span className="text-gray-400 text-sm">RSVPs:</span>
                  <div className="text-white text-sm mt-1">
                    {selectedMeeting.rsvps.filter(r => r.status === 'ATTENDING').length} going
                    {selectedMeeting.rsvps.filter(r => r.status === 'MAYBE').length > 0 && `, ${selectedMeeting.rsvps.filter(r => r.status === 'MAYBE').length} maybe`}
                  </div>
                </div>
              )}
            </div>

            {selectedMeeting.meetingUrl && selectedMeeting.status !== 'ENDED' && selectedMeeting.status !== 'CANCELLED' && (
              <a
                href={selectedMeeting.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-2 bg-stone-700 hover:bg-stone-800 text-white rounded transition-colors"
              >
                Join Meeting
              </a>
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

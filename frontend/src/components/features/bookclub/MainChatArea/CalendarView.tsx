import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiVideo, FiX } from 'react-icons/fi';
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
      zoom: 'bg-indigo-500',
      google_meet: 'bg-green-500',
      teams: 'bg-indigo-500',
      discord: 'bg-violet-500',
      custom: 'bg-indigo-500'
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
      upcoming: 'bg-indigo-600',
      completed: 'bg-slate-600'
    };
    return colors[status] || 'bg-gray-600';
  };

  const getBookStatusLabel = (book, date) => {
    if (book.startDate && new Date(book.startDate).toDateString() === date.toDateString()) {
      return 'Start';
    }
    if (book.endDate && new Date(book.endDate).toDateString() === date.toDateString()) {
      return 'Due';
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
    <div className="bg-gray-800 p-3 rounded-lg h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
          >
            <FiChevronLeft size={14} className="text-white" />
          </button>
          <h2 className="text-white font-semibold text-sm min-w-[160px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
          >
            <FiChevronRight size={14} className="text-white" />
          </button>
        </div>
        <button
          onClick={handleToday}
          className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-xs"
        >
          Today
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map(day => (
          <div key={day} className="text-center text-gray-500 text-[11px] font-semibold uppercase tracking-wider py-1.5">
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
                    ? 'bg-indigo-950 bg-opacity-30 border-indigo-500'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                  : 'bg-transparent border-transparent'
              }`}
            >
              {date && (
                <>
                  <div className={`text-sm font-semibold mb-1 ${today ? 'text-indigo-500' : 'text-gray-300'}`}>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMeeting(null)}>
          <div className="bg-gray-800 p-4 rounded-lg max-w-md w-full border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-white text-sm font-semibold flex items-center gap-2 min-w-0">
                <FiVideo size={14} className="text-indigo-500 flex-shrink-0" />
                <span className="truncate">{selectedMeeting.title}</span>
              </h3>
              <button onClick={() => setSelectedMeeting(null)} className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors flex-shrink-0">
                <FiX size={14} />
              </button>
            </div>

            <div className="space-y-2 mb-3 text-xs">
              <div>
                <span className="text-gray-400">Platform:</span>
                <span className={`inline-block ml-2 px-1.5 py-0.5 rounded text-[11px] ${getMeetingPlatformColor(selectedMeeting.platform)} text-white`}>
                  {getMeetingPlatformLabel(selectedMeeting.platform)}
                </span>
              </div>

              <div>
                <span className="text-gray-400">Date & Time:</span>
                <div className="text-gray-200">
                  {new Date(selectedMeeting.scheduledAt).toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })} at {new Date(selectedMeeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div>
                <span className="text-gray-400">Duration:</span>
                <span className="text-gray-200 ml-2">{selectedMeeting.duration} minutes</span>
              </div>

              {selectedMeeting.description && (
                <div>
                  <span className="text-gray-400">Description:</span>
                  <div className="text-gray-200 mt-0.5">{selectedMeeting.description}</div>
                </div>
              )}

              <div>
                <span className="text-gray-400">Status:</span>
                <span className={`inline-block ml-2 px-1.5 py-0.5 rounded text-[11px] ${
                  selectedMeeting.status === 'LIVE' ? 'bg-green-500' :
                  selectedMeeting.status === 'CANCELLED' ? 'bg-red-500' :
                  selectedMeeting.status === 'ENDED' ? 'bg-gray-500' : 'bg-indigo-500'
                } text-white`}>
                  {selectedMeeting.status}
                </span>
              </div>

              {selectedMeeting.rsvps && selectedMeeting.rsvps.length > 0 && (
                <div>
                  <span className="text-gray-400">RSVPs:</span>
                  <span className="text-gray-200 ml-2">
                    {selectedMeeting.rsvps.filter(r => r.status === 'ATTENDING').length} going
                    {selectedMeeting.rsvps.filter(r => r.status === 'MAYBE').length > 0 && `, ${selectedMeeting.rsvps.filter(r => r.status === 'MAYBE').length} maybe`}
                  </span>
                </div>
              )}
            </div>

            {selectedMeeting.meetingUrl && selectedMeeting.status !== 'ENDED' && selectedMeeting.status !== 'CANCELLED' && (
              <a
                href={selectedMeeting.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded text-xs transition-colors"
              >
                Join Meeting
              </a>
            )}
          </div>
        </div>
      )}

      {/* Book details modal */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBook(null)}>
          <div className="bg-gray-800 p-4 rounded-lg max-w-md w-full border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-white text-sm font-semibold truncate">{selectedBook.book.title}</h3>
              <button
                onClick={() => setSelectedBook(null)}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors flex-shrink-0"
              >
                <FiX size={14} />
              </button>
            </div>

            {selectedBook.book.thumbnail && (
              <div className="flex justify-center mb-3">
                <img
                  src={selectedBook.book.thumbnail}
                  alt={selectedBook.book.title}
                  className="h-32 rounded shadow"
                />
              </div>
            )}

            <div className="space-y-2 text-xs">
              {selectedBook.book.authors && (
                <div>
                  <span className="text-gray-400">Author:</span>
                  <span className="text-gray-200 ml-2">{selectedBook.book.authors}</span>
                </div>
              )}

              <div>
                <span className="text-gray-400">Status:</span>
                <span className={`inline-block ml-2 px-1.5 py-0.5 rounded text-[11px] ${getBookStatusColor(selectedBook.status)} text-white`}>
                  {selectedBook.status?.charAt(0).toUpperCase() + selectedBook.status?.slice(1)}
                </span>
              </div>

              {selectedBook.startDate && (
                <div>
                  <span className="text-gray-400">Start Date:</span>
                  <div className="text-gray-200 mt-0.5">
                    {new Date(selectedBook.startDate).toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </div>
                </div>
              )}

              {selectedBook.endDate && (
                <div>
                  <span className="text-gray-400">Due Date:</span>
                  <div className="text-gray-200 mt-0.5">
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

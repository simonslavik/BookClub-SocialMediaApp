import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiCalendar, FiFilter } from 'react-icons/fi';
import { bookclubAPI } from '@api/bookclub.api';
import MeetingCard from '@components/features/bookclub/MeetingCard';
import logger from '@utils/logger';

const MeetingsView = ({
  bookClubId,
  currentUserId,
  allMembers,
  userRole,
  onScheduleMeeting,
  onEditMeeting,
}) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bookclubAPI.getMeetings(bookClubId, showPast);
      setMeetings(data.meetings || []);
    } catch (err) {
      logger.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  }, [bookClubId, showPast]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // Expose refresh to parent
  useEffect(() => {
    // Re-fetch when a meeting is saved from the modal
    window.__meetingsRefresh = fetchMeetings;
    return () => { delete window.__meetingsRefresh; };
  }, [fetchMeetings]);

  const handleRSVP = async (meetingId, status) => {
    try {
      let data;
      if (status === null) {
        data = await bookclubAPI.cancelRsvp(bookClubId, meetingId);
      } else {
        data = await bookclubAPI.rsvpMeeting(bookClubId, meetingId, status);
      }
      // Update meeting in state
      setMeetings(prev => prev.map(m => m.id === meetingId ? data.meeting : m));
    } catch (err) {
      logger.error('Error updating RSVP:', err);
    }
  };

  const handleDelete = async (meetingId) => {
    try {
      await bookclubAPI.deleteMeeting(bookClubId, meetingId);
      setMeetings(prev => prev.filter(m => m.id !== meetingId));
    } catch (err) {
      logger.error('Error deleting meeting:', err);
    }
  };

  const canManage = ['OWNER', 'ADMIN', 'MODERATOR'].includes(userRole);

  // Separate live, upcoming, and past meetings
  const now = new Date();
  const liveMeetings = meetings.filter(m => m.status === 'LIVE');
  const upcomingMeetings = meetings.filter(m =>
    m.status === 'SCHEDULED' && new Date(m.scheduledAt) >= now
  );
  const pastMeetings = meetings.filter(m =>
    m.status === 'ENDED' || m.status === 'CANCELLED' || (m.status === 'SCHEDULED' && new Date(m.scheduledAt) < now)
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiCalendar size={22} className="text-indigo-500" />
            <h2 className="text-xl font-bold text-white">Meetings</h2>
            <span className="text-sm text-gray-500">
              {liveMeetings.length + upcomingMeetings.length} upcoming
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPast(!showPast)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                showPast
                  ? 'bg-indigo-700/20 text-indigo-500 border-indigo-500/30'
                  : 'text-gray-400 border-gray-600 hover:bg-gray-800'
              }`}
            >
              <FiFilter size={13} />
              {showPast ? 'Showing All' : 'Show Past'}
            </button>
            {canManage && (
              <button
                onClick={onScheduleMeeting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 text-white rounded-lg hover:bg-indigo-500 transition-colors text-sm font-medium"
              >
                <FiPlus size={15} />
                Schedule
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-800 rounded-xl border border-gray-700 p-4 animate-pulse">
                <div className="h-5 w-48 bg-gray-700 rounded mb-3" />
                <div className="h-4 w-64 bg-gray-700 rounded mb-3" />
                <div className="h-8 w-full bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-white mb-2">No meetings scheduled</h3>
            <p className="text-gray-400 text-sm mb-6">
              Schedule a meeting with a Zoom, Google Meet, or Teams link for your book club.
            </p>
            {canManage && (
              <button
                onClick={onScheduleMeeting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-700 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium"
              >
                <FiPlus size={16} />
                Schedule First Meeting
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Live Meetings */}
            {liveMeetings.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live Now
                </h3>
                <div className="space-y-3">
                  {liveMeetings.map(meeting => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      currentUserId={currentUserId}
                      allMembers={allMembers}
                      onRSVP={handleRSVP}
                      onEdit={onEditMeeting}
                      onDelete={handleDelete}
                      canManage={canManage || meeting.hostId === currentUserId}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming */}
            {upcomingMeetings.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Upcoming
                </h3>
                <div className="space-y-3">
                  {upcomingMeetings.map(meeting => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      currentUserId={currentUserId}
                      allMembers={allMembers}
                      onRSVP={handleRSVP}
                      onEdit={onEditMeeting}
                      onDelete={handleDelete}
                      canManage={canManage || meeting.hostId === currentUserId}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Past */}
            {showPast && pastMeetings.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Past Meetings
                </h3>
                <div className="space-y-3">
                  {pastMeetings.map(meeting => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      currentUserId={currentUserId}
                      allMembers={allMembers}
                      onRSVP={handleRSVP}
                      onEdit={onEditMeeting}
                      onDelete={handleDelete}
                      canManage={canManage || meeting.hostId === currentUserId}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingsView;

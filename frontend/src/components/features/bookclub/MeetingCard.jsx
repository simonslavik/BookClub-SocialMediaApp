import React, { useState } from 'react';
import {
  FiExternalLink, FiClock, FiUsers, FiEdit2, FiTrash2,
  FiCheck, FiHelpCircle, FiXCircle, FiMoreVertical
} from 'react-icons/fi';
import { getProfileImageUrl } from '@config/constants';

const PLATFORM_META = {
  zoom:        { icon: '📹', label: 'Zoom',        gradient: 'from-stone-600 to-stone-700' },
  google_meet: { icon: '🟢', label: 'Google Meet', gradient: 'from-green-600 to-green-700' },
  teams:       { icon: '🟣', label: 'Teams',       gradient: 'from-stone-700 to-stone-800' },
  discord:     { icon: '🎮', label: 'Discord',     gradient: 'from-violet-600 to-violet-700' },
  custom:      { icon: '🔗', label: 'Meeting',     gradient: 'from-gray-600 to-gray-700' },
};

const RSVP_BUTTONS = [
  { status: 'ATTENDING', label: 'Going', icon: FiCheck, selectedClass: 'bg-green-600 text-white border-green-500', defaultClass: 'text-green-400 hover:bg-green-600/20 border-gray-600' },
  { status: 'MAYBE', label: 'Maybe', icon: FiHelpCircle, selectedClass: 'bg-yellow-600 text-white border-yellow-500', defaultClass: 'text-yellow-400 hover:bg-yellow-600/20 border-gray-600' },
  { status: 'NOT_ATTENDING', label: "Can't", icon: FiXCircle, selectedClass: 'bg-red-600 text-white border-red-500', defaultClass: 'text-red-400 hover:bg-red-600/20 border-gray-600' },
];

const MeetingCard = ({ meeting, currentUserId, allMembers, onRSVP, onEdit, onDelete, canManage }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(null);

  const platform = PLATFORM_META[meeting.platform] || PLATFORM_META.custom;
  const scheduledDate = new Date(meeting.scheduledAt);
  const now = new Date();
  const isLive = meeting.status === 'LIVE';
  const isEnded = meeting.status === 'ENDED';
  const isCancelled = meeting.status === 'CANCELLED';
  const isPast = scheduledDate < now && !isLive;
  const isUpcoming = scheduledDate > now && !isLive;

  // Check if meeting starts within 15 minutes
  const minutesUntil = (scheduledDate - now) / 60000;
  const isStartingSoon = minutesUntil > 0 && minutesUntil <= 15;

  // User's RSVP
  const userRsvp = meeting.rsvps?.find(r => r.userId === currentUserId);
  const attendingCount = meeting.rsvps?.filter(r => r.status === 'ATTENDING').length || 0;
  const maybeCount = meeting.rsvps?.filter(r => r.status === 'MAYBE').length || 0;

  // Host info
  const host = allMembers?.find(m => m.id === meeting.hostId);

  const handleRsvp = async (status) => {
    setRsvpLoading(status);
    try {
      if (userRsvp?.status === status) {
        await onRSVP(meeting.id, null); // cancel
      } else {
        await onRSVP(meeting.id, status);
      }
    } finally {
      setRsvpLoading(null);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={`relative rounded-xl border overflow-hidden transition-all ${
        isLive
          ? 'border-green-500/50 bg-green-500/5 shadow-lg shadow-green-500/10'
          : isCancelled
          ? 'border-gray-700 bg-gray-800/50 opacity-60'
          : isEnded
          ? 'border-gray-700 bg-gray-800/50 opacity-75'
          : isStartingSoon
          ? 'border-yellow-500/50 bg-yellow-500/5 shadow-md shadow-yellow-500/10'
          : 'border-gray-700 bg-gray-800'
      }`}
    >
      {/* Status Bar */}
      {(isLive || isStartingSoon) && (
        <div className={`px-4 py-1.5 flex items-center gap-2 text-xs font-semibold uppercase ${
          isLive ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`} />
          {isLive ? 'Live Now' : `Starting in ${Math.ceil(minutesUntil)} min`}
        </div>
      )}

      <div className="p-4">
        {/* Top Row: Title + Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-base ${isEnded || isCancelled ? 'text-gray-400 line-through' : 'text-white'}`}>
              {meeting.title}
            </h3>
            {meeting.description && (
              <p className="text-gray-400 text-sm mt-1 line-clamp-2">{meeting.description}</p>
            )}
          </div>

          {canManage && !isEnded && !isCancelled && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400"
              >
                <FiMoreVertical size={16} />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-8 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-50 py-1 w-36">
                    <button
                      onClick={() => { setShowMenu(false); onEdit?.(meeting); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white"
                    >
                      <FiEdit2 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); onDelete?.(meeting.id); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-600 hover:text-red-300"
                    >
                      <FiTrash2 size={14} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Info Row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-sm text-gray-400">
          {/* Date + Time */}
          <span className="flex items-center gap-1.5">
            <FiClock size={14} className="flex-shrink-0" />
            {formatDate(scheduledDate)} at {formatTime(scheduledDate)}
            {meeting.duration && <span className="text-gray-500">· {meeting.duration}min</span>}
          </span>

          {/* Platform Badge */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gradient-to-r ${platform.gradient} text-white`}>
            <span>{platform.icon}</span>
            {platform.label}
          </span>

          {/* Host */}
          {host && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              Hosted by
              <img
                src={getProfileImageUrl(host.profileImage) || '/images/default.webp'}
                alt=""
                className="w-4 h-4 rounded-full object-cover"
              />
              <span className="text-gray-300">{host.username}</span>
            </span>
          )}
        </div>

        {/* Bottom Row: RSVP + Join */}
        {!isEnded && !isCancelled && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700/50">
            {/* RSVP Buttons */}
            <div className="flex items-center gap-1.5">
              {RSVP_BUTTONS.map(({ status, label, icon: Icon, selectedClass, defaultClass }) => {
                const isSelected = userRsvp?.status === status;
                return (
                  <button
                    key={status}
                    onClick={() => handleRsvp(status)}
                    disabled={rsvpLoading !== null}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      isSelected ? selectedClass : defaultClass
                    } disabled:opacity-50`}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Attendee Count + Join */}
            <div className="flex items-center gap-3">
              {/* Attendees preview */}
              <button
                onClick={() => setShowAttendees(!showAttendees)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-300 transition-colors"
              >
                <FiUsers size={13} />
                <span>{attendingCount} going{maybeCount > 0 && `, ${maybeCount} maybe`}</span>
              </button>

              {/* Join button */}
              <a
                href={meeting.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  isLive
                    ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/30'
                    : isStartingSoon
                    ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                    : 'bg-stone-700 hover:bg-stone-500 text-white'
                }`}
              >
                <FiExternalLink size={14} />
                {isLive ? 'Join Now' : 'Join'}
              </a>
            </div>
          </div>
        )}

        {/* Cancelled / Ended badge */}
        {(isEnded || isCancelled) && (
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isCancelled ? 'bg-red-500/20 text-red-400' : 'bg-gray-600/40 text-gray-400'
            }`}>
              {isCancelled ? 'Cancelled' : 'Ended'}
            </span>
          </div>
        )}
      </div>

      {/* Attendee Dropdown */}
      {showAttendees && (
        <div className="border-t border-gray-700/50 px-4 py-3 bg-gray-850">
          <div className="space-y-2">
            {['ATTENDING', 'MAYBE', 'NOT_ATTENDING'].map(status => {
              const rsvps = meeting.rsvps?.filter(r => r.status === status) || [];
              if (rsvps.length === 0) return null;
              const labelMap = { ATTENDING: '✅ Going', MAYBE: '🤔 Maybe', NOT_ATTENDING: "❌ Can't make it" };
              return (
                <div key={status}>
                  <p className="text-xs text-gray-500 font-medium mb-1">{labelMap[status]} ({rsvps.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {rsvps.map(r => {
                      const member = allMembers?.find(m => m.id === r.userId);
                      return (
                        <div key={r.userId} className="flex items-center gap-1.5 bg-gray-700/50 px-2 py-1 rounded-full">
                          <img
                            src={getProfileImageUrl(member?.profileImage) || '/images/default.webp'}
                            alt=""
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="text-xs text-gray-300">{member?.username || 'Unknown'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingCard;

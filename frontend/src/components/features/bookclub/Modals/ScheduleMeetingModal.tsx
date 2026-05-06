import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiLink, FiClock, FiCalendar, FiAlignLeft, FiExternalLink } from 'react-icons/fi';
import { SiZoom, SiGooglemeet, SiJitsi } from 'react-icons/si';
import { bookclubAPI } from '@api/bookclub.api';
import logger from '@utils/logger';

const PLATFORMS = [
  { value: 'zoom', label: 'Zoom', icon: '📹', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { value: 'google_meet', label: 'Google Meet', icon: '🟢', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'teams', label: 'Teams', icon: '🟣', color: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30' },
  { value: 'discord', label: 'Discord', icon: '🎮', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  { value: 'custom', label: 'Other', icon: '🔗', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
];

// Quick-create shortcuts: open the provider in a new tab, user creates a
// meeting there, then comes back and pastes the link.
const QUICK_CREATE = [
  {
    label: 'Google Meet',
    icon: SiGooglemeet,
    url: 'https://meet.new',
    iconClass: 'text-green-400',
    hint: 'Instant meeting',
  },
  {
    label: 'Zoom',
    icon: SiZoom,
    url: 'https://zoom.us/start/videomeeting',
    iconClass: 'text-blue-400',
    hint: 'Sign-in required',
  },
  {
    label: 'Jitsi',
    icon: SiJitsi,
    url: 'https://meet.jit.si',
    iconClass: 'text-cyan-400',
    hint: 'No account needed',
  },
];

const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
];

// Auto-detect platform from URL
function detectPlatform(url) {
  const lower = url.toLowerCase();
  if (lower.includes('zoom.us') || lower.includes('zoom.com')) return 'zoom';
  if (lower.includes('meet.google.com')) return 'google_meet';
  if (lower.includes('teams.microsoft.com') || lower.includes('teams.live.com')) return 'teams';
  if (lower.includes('discord.gg') || lower.includes('discord.com')) return 'discord';
  return 'custom';
}

const ScheduleMeetingModal = ({ isOpen, onClose, bookClubId, meeting = null, onMeetingSaved }) => {
  const isEditing = !!meeting;

  const [form, setForm] = useState({
    title: '',
    description: '',
    meetingUrl: '',
    platform: 'custom',
    scheduledAt: '',
    duration: 60,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (meeting) {
      const dt = new Date(meeting.scheduledAt);
      const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setForm({
        title: meeting.title || '',
        description: meeting.description || '',
        meetingUrl: meeting.meetingUrl || '',
        platform: meeting.platform || 'custom',
        scheduledAt: localIso,
        duration: meeting.duration || 60,
      });
    } else {
      // Default to 1 hour from now, rounded to nearest 15 min
      const now = new Date();
      now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15 + 60);
      now.setSeconds(0);
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setForm({
        title: '',
        description: '',
        meetingUrl: '',
        platform: 'custom',
        scheduledAt: localIso,
        duration: 60,
      });
    }
    setError('');
  }, [isOpen, meeting]);

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setForm(prev => ({
      ...prev,
      meetingUrl: url,
      platform: url.trim() ? detectPlatform(url) : prev.platform,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Title is required');
    if (!form.meetingUrl.trim()) return setError('Meeting URL is required');
    if (!form.scheduledAt) return setError('Date & time is required');

    // Validate URL
    try {
      new URL(form.meetingUrl);
    } catch {
      return setError('Please enter a valid URL');
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        meetingUrl: form.meetingUrl.trim(),
        platform: form.platform,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        duration: form.duration || undefined,
      };

      if (isEditing) {
        const { meeting: updated } = await bookclubAPI.updateMeeting(bookClubId, meeting.id, payload);
        onMeetingSaved?.(updated);
      } else {
        const { meeting: created } = await bookclubAPI.createMeeting(bookClubId, payload);
        onMeetingSaved?.(created);
      }
      onClose();
    } catch (err) {
      logger.error('Error saving meeting:', err);
      setError(err.response?.data?.error || 'Failed to save meeting');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const activePlatform = PLATFORMS.find(p => p.value === form.platform);

  return createPortal(
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <FiCalendar className="text-indigo-500" size={14} />
            <h2 className="text-sm font-semibold text-white">
              {isEditing ? 'Edit Meeting' : 'Schedule Meeting'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded transition-colors">
            <FiX size={14} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="bg-red-500/20 text-red-400 text-sm p-3 rounded-lg border border-red-500/30">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1.5">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Book Discussion: Chapters 5-8"
              maxLength={200}
              className="w-full bg-gray-900 text-white px-3 py-2.5 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none text-sm"
              autoFocus
            />
          </div>

          {/* Meeting URL */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1.5">
              <FiLink size={13} className="inline mr-1.5 -mt-0.5" />
              Meeting Link
            </label>
            <input
              type="url"
              value={form.meetingUrl}
              onChange={handleUrlChange}
              placeholder="https://zoom.us/j/123456789 or https://meet.google.com/abc-defg-hij"
              className="w-full bg-gray-900 text-white px-3 py-2.5 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none text-sm"
            />

            {/* Quick-create shortcuts: open provider in a new tab, paste link back */}
            {!form.meetingUrl.trim() && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1.5">Don't have a link yet? Create one:</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_CREATE.map(({ label, icon: Icon, url, iconClass, hint }) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={hint}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-indigo-500 text-gray-200 text-xs transition-colors"
                    >
                      <Icon className={iconClass} size={14} />
                      <span>{label}</span>
                      <FiExternalLink size={10} className="text-gray-500" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {form.meetingUrl.trim() && activePlatform && (
              <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${activePlatform.color}`}>
                <span>{activePlatform.icon}</span>
                <span>Detected: {activePlatform.label}</span>
              </div>
            )}
          </div>

          {/* Date & Time + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">
                <FiCalendar size={13} className="inline mr-1.5 -mt-0.5" />
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
                className="w-full bg-gray-900 text-white px-3 py-2.5 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none text-sm [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">
                <FiClock size={13} className="inline mr-1.5 -mt-0.5" />
                Duration
              </label>
              <select
                value={form.duration}
                onChange={(e) => setForm(p => ({ ...p, duration: Number(e.target.value) }))}
                className="w-full bg-gray-900 text-white px-3 py-2.5 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none text-sm appearance-none"
              >
                {DURATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1.5">
              <FiAlignLeft size={13} className="inline mr-1.5 -mt-0.5" />
              Description <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="What will be discussed..."
              maxLength={1000}
              rows={2}
              className="w-full bg-gray-900 text-white px-3 py-2.5 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none text-sm resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-1.5 bg-indigo-700 text-white rounded hover:bg-indigo-800 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ScheduleMeetingModal;

import { useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '@context/index';
import { FiX, FiCalendar, FiBook, FiStar, FiTrash2, FiTrendingUp } from 'react-icons/fi';
import apiClient from '@api/axios';
import logger from '@utils/logger';
import { useConfirm, useToast } from '@hooks/useUIFeedback';

import DetailsTab from './CurrentBookDetails/DetailsTab';
import ScheduleTab from './CurrentBookDetails/ScheduleTab';
import ReviewsTab from './CurrentBookDetails/ReviewsTab';
import ProgressTab from './CurrentBookDetails/ProgressTab';

const TABS = [
  { key: 'details', label: 'Details', icon: FiBook },
  { key: 'progress', label: 'Progress', icon: FiTrendingUp },
  { key: 'schedule', label: 'Schedule', icon: FiCalendar },
  { key: 'reviews', label: 'Reviews', icon: FiStar },
];

const CurrentBookDetailsModal = ({
  bookClubId,
  currentBookData,
  members = [],
  onClose,
  onBookUpdated,
  onBookRemoved,
}) => {
  const { auth } = useContext(AuthContext);
  const { confirm } = useConfirm();
  const { toastSuccess, toastError } = useToast();
  const [activeTab, setActiveTab] = useState('details');
  const [submitting, setSubmitting] = useState(false);

  const book = currentBookData?.book;

  // ── Schedule update ────────────────────────────────────
  const handleUpdateSchedule = async (startDate, endDate) => {
    if (!startDate || !endDate) return;

    setSubmitting(true);
    try {
      const { data } = await apiClient.patch(
        `/v1/bookclub/${currentBookData.bookClubId}/books/${currentBookData.bookId}`,
        { startDate, endDate },
      );

      if (data.success) {
        onBookUpdated(data.data);
        toastSuccess('Schedule updated successfully!');
      } else {
        toastError(data.error || 'Failed to update schedule');
      }
    } catch (err) {
      logger.error('Error updating schedule:', err);
      toastError('Failed to update schedule');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Remove book ────────────────────────────────────────
  const handleRemoveBook = async () => {
    const ok = await confirm(
      'Are you sure you want to remove this book as the current reading?',
      { title: 'Remove Book', variant: 'danger', confirmLabel: 'Remove' },
    );
    if (!ok) return;

    setSubmitting(true);
    try {
      const { data } = await apiClient.delete(
        `/v1/bookclub/${currentBookData.bookClubId}/books/${currentBookData.bookId}`,
      );

      if (data.success) {
        onBookRemoved();
        onClose();
      } else {
        toastError(data.error || 'Failed to remove book');
      }
    } catch (err) {
      logger.error('Error removing book:', err);
      toastError('Failed to remove book');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gray-800 border border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-white">Current Book</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
            <FiX size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                activeTab === key
                  ? 'text-indigo-400 border-indigo-500'
                  : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              <Icon className="inline mr-1.5" size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'details' && (
            <DetailsTab book={book} currentBookData={currentBookData} />
          )}
          {activeTab === 'progress' && (
            <ProgressTab currentBookData={currentBookData} book={book} members={members} />
          )}
          {activeTab === 'schedule' && (
            <ScheduleTab
              currentBookData={currentBookData}
              book={book}
              onUpdateSchedule={handleUpdateSchedule}
              submitting={submitting}
            />
          )}
          {activeTab === 'reviews' && (
            <ReviewsTab currentBookData={currentBookData} members={members} />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 bg-gray-900/40 px-4 py-2.5 flex justify-between items-center">
          <button
            onClick={handleRemoveBook}
            disabled={submitting}
            className="flex items-center gap-1.5 px-2.5 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded text-xs disabled:opacity-50 transition-colors"
          >
            <FiTrash2 size={12} />
            Remove Book
          </button>
          <button onClick={onClose} className="px-2.5 py-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded text-xs transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CurrentBookDetailsModal;

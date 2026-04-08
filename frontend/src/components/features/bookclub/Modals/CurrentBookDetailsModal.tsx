import { useState, useContext } from 'react';
import { AuthContext } from '@context/index';
import { FiX, FiCalendar, FiBook, FiStar, FiTrash2 } from 'react-icons/fi';
import apiClient from '@api/axios';
import logger from '@utils/logger';
import { useConfirm, useToast } from '@hooks/useUIFeedback';

import DetailsTab from './CurrentBookDetails/DetailsTab';
import ScheduleTab from './CurrentBookDetails/ScheduleTab';
import ReviewsTab from './CurrentBookDetails/ReviewsTab';

const TABS = [
  { key: 'details', label: 'Details', icon: FiBook },
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-stone-700 text-white">
          <h2 className="text-2xl font-bold">📖 Current Book</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <FiX size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 px-6 py-3 font-medium transition-colors ${
                activeTab === key
                  ? 'bg-white text-stone-700 border-b-2 border-stone-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="inline mr-2" size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <DetailsTab book={book} currentBookData={currentBookData} />
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
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center">
          <button
            onClick={handleRemoveBook}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <FiTrash2 size={16} />
            Remove Book
          </button>
          <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CurrentBookDetailsModal;

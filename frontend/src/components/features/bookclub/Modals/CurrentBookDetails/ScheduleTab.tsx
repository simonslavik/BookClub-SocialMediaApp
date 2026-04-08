import { useState, useMemo } from 'react';
import { FiCalendar, FiClock, FiEdit2 } from 'react-icons/fi';

// Derive initial schedule values from props (no useEffect needed)
const deriveSchedule = (currentBookData) => {
  let start = '';
  let end = '';
  let days = 30;

  if (currentBookData?.startDate) {
    start = new Date(currentBookData.startDate).toISOString().split('T')[0];
  }
  if (currentBookData?.endDate) {
    end = new Date(currentBookData.endDate).toISOString().split('T')[0];
  }
  if (currentBookData?.startDate && currentBookData?.endDate) {
    const diffMs = Math.abs(new Date(currentBookData.endDate) - new Date(currentBookData.startDate));
    days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  return { start, end, days };
};

const ScheduleTab = ({
  currentBookData,
  book,
  onUpdateSchedule,
  submitting,
}) => {
  const initial = useMemo(() => deriveSchedule(currentBookData), [currentBookData]);

  const [editingSchedule, setEditingSchedule] = useState(false);
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);
  const [readingDays, setReadingDays] = useState(initial.days);

  // Auto-calculate end date when start or days change (derived, not effect)
  const handleStartDateChange = (value) => {
    setStartDate(value);
    if (value && readingDays > 0) {
      const d = new Date(value);
      d.setDate(d.getDate() + readingDays);
      setEndDate(d.toISOString().split('T')[0]);
    }
  };

  const handleReadingDaysChange = (value) => {
    const days = parseInt(value) || 0;
    setReadingDays(days);
    if (startDate && days > 0) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + days);
      setEndDate(d.toISOString().split('T')[0]);
    }
  };

  const calculateDaysRemaining = () => {
    if (!currentBookData?.endDate) return 0;
    const diffDays = Math.ceil((new Date(currentBookData.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const calculatePagesPerDay = () => {
    if (!book?.pageCount || !readingDays) return 0;
    return Math.ceil(book.pageCount / readingDays);
  };

  const handleSave = () => {
    onUpdateSchedule(startDate, endDate);
    setEditingSchedule(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900">Reading Schedule</h3>
          {!editingSchedule && (
            <button
              onClick={() => setEditingSchedule(true)}
              className="flex items-center gap-2 px-4 py-2 bg-stone-700 text-white rounded-lg hover:bg-stone-800 transition-colors"
            >
              <FiEdit2 size={16} />
              Edit Schedule
            </button>
          )}
        </div>

        {editingSchedule ? (
          <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiCalendar className="inline mr-2" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 outline-none"
              />
            </div>

            {/* Reading Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiClock className="inline mr-2" />
                Reading Duration (days)
              </label>
              <div className="flex gap-4 items-center">
                <input
                  type="range"
                  min="7"
                  max="90"
                  value={readingDays}
                  onChange={(e) => handleReadingDaysChange(e.target.value)}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="7"
                  max="90"
                  value={readingDays}
                  onChange={(e) => handleReadingDaysChange(e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-500 outline-none"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Completion Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setEditingSchedule(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={submitting || !startDate || !endDate}
                className="flex-1 px-6 py-3 bg-stone-700 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-stone-50 rounded-lg p-6">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Start Date</p>
                <p className="text-xl font-semibold text-gray-900">
                  {new Date(currentBookData.startDate).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">End Date</p>
                <p className="text-xl font-semibold text-gray-900">
                  {new Date(currentBookData.endDate).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {book?.pageCount && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-200">
                <div className="text-center">
                  <p className="text-3xl font-bold text-stone-700">{calculatePagesPerDay()}</p>
                  <p className="text-sm text-gray-600 mt-1">Pages per day</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-stone-600">{calculateDaysRemaining()}</p>
                  <p className="text-sm text-gray-600 mt-1">Days remaining</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleTab;

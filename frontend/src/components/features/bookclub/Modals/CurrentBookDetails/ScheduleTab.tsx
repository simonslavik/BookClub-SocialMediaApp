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
    const diffMs = Math.abs(new Date(currentBookData.endDate).getTime() - new Date(currentBookData.startDate).getTime());
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
    const now = new Date();
    const diffDays = Math.ceil((new Date(currentBookData.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Reading Schedule</h3>
        {!editingSchedule && (
          <button
            onClick={() => setEditingSchedule(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            <FiEdit2 size={11} />
            Edit
          </button>
        )}
      </div>

      {editingSchedule ? (
        <div className="space-y-3 bg-white/[0.04] border border-white/[0.06] p-3 rounded-md">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              <FiCalendar className="inline mr-1.5" size={11} />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none [color-scheme:dark]"
            />
          </div>

          {/* Reading Duration */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              <FiClock className="inline mr-1.5" size={11} />
              Reading Duration (days)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min="7"
                max="90"
                value={readingDays}
                onChange={(e) => handleReadingDaysChange(e.target.value)}
                className="flex-1 accent-indigo-500"
              />
              <input
                type="number"
                min="7"
                max="90"
                value={readingDays}
                onChange={(e) => handleReadingDaysChange(e.target.value)}
                className="w-16 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Target Completion Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none [color-scheme:dark]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setEditingSchedule(false)}
              className="flex-1 px-3 py-1.5 text-xs text-gray-300 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={submitting || !startDate || !endDate}
              className="flex-1 px-3 py-1.5 text-xs bg-indigo-700 text-white rounded hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-md p-3">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-[11px] text-gray-500 mb-0.5">Start Date</p>
              <p className="text-sm font-medium text-gray-100">
                {currentBookData?.startDate
                  ? new Date(currentBookData.startDate).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 mb-0.5">End Date</p>
              <p className="text-sm font-medium text-gray-100">
                {currentBookData?.endDate
                  ? new Date(currentBookData.endDate).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
          </div>

          {book?.pageCount && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06]">
              <div className="text-center">
                <p className="text-xl font-semibold text-indigo-400">{calculatePagesPerDay()}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Pages per day</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-indigo-400">{calculateDaysRemaining()}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Days remaining</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleTab;

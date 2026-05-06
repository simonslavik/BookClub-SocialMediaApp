import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@context/index';
import { FiTrash2, FiBookOpen } from 'react-icons/fi';
import apiClient from '@api/axios';
import logger from '@utils/logger';
import { getProfileImageUrl } from '@config/constants';
import { useConfirm, useToast } from '@hooks/useUIFeedback';

const ProgressTab = ({ currentBookData, book, members = [] }) => {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { toastSuccess, toastError, toastWarning } = useToast();

  const [allProgress, setAllProgress] = useState([]);
  const [myProgress, setMyProgress] = useState(null);
  const [pagesRead, setPagesRead] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalPages = book?.pageCount || null;

  const fetchProgress = async () => {
    if (!currentBookData?.id) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(
        `/v1/bookclub-books/${currentBookData.id}/progress/all`,
      );
      if (data.success) {
        const records = data.data?.progress || [];
        setAllProgress(records);

        if (auth?.user) {
          const mine = records.find((p) => p.userId === auth.user.id);
          if (mine) {
            setMyProgress(mine);
            setPagesRead(mine.pagesRead || 0);
            setNotes(mine.notes || '');
          } else {
            setMyProgress(null);
          }
        }
      }
    } catch (err) {
      logger.error('Error fetching reading progress:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [currentBookData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!currentBookData?.id || !auth?.token) return;
    if (pagesRead < 0) {
      toastWarning('Pages must be 0 or greater');
      return;
    }
    if (totalPages && pagesRead > totalPages) {
      toastWarning(`Pages cannot exceed total (${totalPages})`);
      return;
    }

    setSaving(true);
    try {
      const { data } = await apiClient.post(
        `/v1/bookclub-books/${currentBookData.id}/progress`,
        { pagesRead, notes: notes || null },
      );
      if (data.success) {
        await fetchProgress();
        toastSuccess('Progress saved');
      }
    } catch (err) {
      logger.error('Error saving progress:', err);
      toastError('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const ok = await confirm('Reset your reading progress for this book?', {
      title: 'Reset Progress',
      variant: 'danger',
      confirmLabel: 'Reset',
    });
    if (!ok) return;

    try {
      const { data } = await apiClient.delete(
        `/v1/bookclub-books/${currentBookData.id}/progress`,
      );
      if (data.success) {
        setMyProgress(null);
        setPagesRead(0);
        setNotes('');
        await fetchProgress();
      }
    } catch (err) {
      logger.error('Error resetting progress:', err);
      toastError('Failed to reset progress');
    }
  };

  const myPercentage = totalPages
    ? Math.min(Math.round((pagesRead / totalPages) * 100), 100)
    : null;

  if (loading) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-400 text-xs">Loading progress…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* My Progress */}
      <div className="bg-white/[0.04] border border-white/[0.06] rounded-md p-3 mb-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
          {myProgress ? 'Your Progress' : 'Track Your Progress'}
        </h4>

        {/* Progress bar (if pages known) */}
        {totalPages != null && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
              <span>{pagesRead} / {totalPages} pages</span>
              <span className="text-indigo-400 font-medium">{myPercentage}%</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all"
                style={{ width: `${myPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-2">
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Pages read</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={totalPages || undefined}
                value={pagesRead}
                onChange={(e) => setPagesRead(parseInt(e.target.value) || 0)}
                className="w-24 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {totalPages != null && (
                <input
                  type="range"
                  min={0}
                  max={totalPages}
                  value={pagesRead}
                  onChange={(e) => setPagesRead(parseInt(e.target.value) || 0)}
                  className="flex-1 accent-indigo-500"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Where you are, thoughts so far…"
              className="w-full px-2.5 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-2.5 py-1 bg-indigo-700 hover:bg-indigo-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-xs transition-colors"
            >
              {saving ? 'Saving…' : myProgress ? 'Update' : 'Save'}
            </button>
            {myProgress && (
              <button
                onClick={handleReset}
                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                title="Reset progress"
              >
                <FiTrash2 size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* All members' progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            All Readers ({allProgress.length})
          </h4>
        </div>

        {allProgress.length === 0 ? (
          <div className="text-center py-8 bg-white/[0.02] rounded-md border border-white/[0.04]">
            <FiBookOpen className="mx-auto text-2xl text-gray-600 mb-1.5" />
            <p className="text-gray-500 text-xs">No progress logged yet. Be the first.</p>
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-md divide-y divide-white/[0.04]">
            {allProgress.map((p) => {
              const isMe = p.userId === auth?.user?.id;
              const member = members.find((m) => m.id === p.userId);
              const memberName = isMe
                ? 'You'
                : member?.username || `User ${p.userId.slice(0, 8)}`;
              const profileImg = getProfileImageUrl(member?.profileImage);
              const percentage = p.percentage; // computed by backend (or null)

              return (
                <div
                  key={p.id}
                  className={`flex items-start gap-2 px-2.5 py-2 ${isMe ? 'bg-indigo-500/[0.06]' : ''}`}
                >
                  <img
                    src={profileImg || '/images/default-avatar.png'}
                    alt={memberName}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0 cursor-pointer hover:ring-1 hover:ring-indigo-500 transition-all"
                    onClick={() => navigate(`/profile/${p.userId}`)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[13px] font-medium cursor-pointer hover:underline ${isMe ? 'text-indigo-300' : 'text-gray-200'}`}
                        onClick={() => navigate(`/profile/${p.userId}`)}
                      >
                        {memberName}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {p.lastReadDate
                          ? new Date(p.lastReadDate).toLocaleDateString()
                          : ''}
                      </span>
                    </div>

                    {/* Inline progress bar */}
                    <div className="mt-1.5">
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-0.5">
                        <span>
                          {p.pagesRead}{totalPages ? ` / ${totalPages}` : ''} pages
                        </span>
                        {percentage != null && (
                          <span className="text-indigo-400 font-medium">{percentage}%</span>
                        )}
                      </div>
                      <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 transition-all"
                          style={{ width: `${percentage ?? 0}%` }}
                        />
                      </div>
                    </div>

                    {p.notes && (
                      <p className="text-xs text-gray-400 mt-1 whitespace-pre-line leading-relaxed">{p.notes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressTab;

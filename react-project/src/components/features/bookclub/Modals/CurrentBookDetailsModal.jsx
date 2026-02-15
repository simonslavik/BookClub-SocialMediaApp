import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@context/index';
import { FiX, FiCalendar, FiClock, FiEdit2, FiTrash2, FiBook, FiBarChart2, FiStar } from 'react-icons/fi';
import apiClient from '@api/axios';
import logger from '@utils/logger';

const CurrentBookDetailsModal = ({ bookClubId, currentBookData, onClose, onBookUpdated, onBookRemoved }) => {
  const { auth } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'schedule'
  
  // Schedule editing state
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [readingDays, setReadingDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  // Progress tracking state
  const [myProgress, setMyProgress] = useState(null);
  const [pagesRead, setPagesRead] = useState(0);
  const [progressNotes, setProgressNotes] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (currentBookData?.startDate) {
      setStartDate(new Date(currentBookData.startDate).toISOString().split('T')[0]);
    }
    if (currentBookData?.endDate) {
      setEndDate(new Date(currentBookData.endDate).toISOString().split('T')[0]);
    }
    if (currentBookData?.startDate && currentBookData?.endDate) {
      const start = new Date(currentBookData.startDate);
      const end = new Date(currentBookData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setReadingDays(diffDays);
    }
  }, [currentBookData]);

  // Auto-calculate end date when start date or reading days change
  useEffect(() => {
    if (startDate && readingDays > 0 && editingSchedule) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + readingDays);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [startDate, readingDays, editingSchedule]);

  // Fetch user's reading progress
  useEffect(() => {
    const fetchProgress = async () => {
      if (!currentBookData?.id || !auth?.token) return;
      
      setLoadingProgress(true);
      try {
        const { data } = await apiClient.get(
          `/v1/bookclub-books/${currentBookData.id}/progress`
        );
        
        if (data.success && data.data) {
          setMyProgress(data.data);
          setPagesRead(data.data.pagesRead || 0);
          setProgressNotes(data.data.notes || '');
        }
      } catch (err) {
        logger.error('Error fetching progress:', err);
      } finally {
        setLoadingProgress(false);
      }
    };

    if (activeTab === 'progress') {
      fetchProgress();
    }
  }, [activeTab, currentBookData, auth]);

  const handleSaveProgress = async () => {
    if (!currentBookData?.id || !auth?.token) return;
    
    setSavingProgress(true);
    try {
      const { data } = await apiClient.post(
        `/v1/bookclub-books/${currentBookData.id}/progress`,
        {
          pagesRead: parseInt(pagesRead),
          notes: progressNotes
        }
      );

      if (data.success) {
        setMyProgress(data.data);
        alert('Progress saved successfully!');
      } else {
        alert(data.error || 'Failed to save progress');
      }
    } catch (err) {
      logger.error('Error saving progress:', err);
      alert('Failed to save progress');
    } finally {
      setSavingProgress(false);
    }
  };

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!currentBookData?.id) return;
      
      setLoadingReviews(true);
      try {
        const { data } = await apiClient.get(
          `/v1/bookclub-books/${currentBookData.id}/reviews`
        );
        
        if (data.success) {
          setReviews(data.data.reviews || []);
          setAverageRating(data.data.averageRating || 0);
          
          // Find user's review
          if (auth?.user) {
            const userReview = data.data.reviews.find(r => r.userId === auth.user.id);
            if (userReview) {
              setMyReview(userReview);
              setRating(userReview.rating);
              setReviewText(userReview.reviewText || '');
            }
          }
        }
      } catch (err) {
        logger.error('Error fetching reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    };

    if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [activeTab, currentBookData, auth]);

  const handleSaveReview = async () => {
    if (!currentBookData?.id || !auth?.token || rating === 0) {
      alert('Please select a rating');
      return;
    }
    
    setSavingReview(true);
    try {
      const { data } = await apiClient.post(
        `/v1/bookclub-books/${currentBookData.id}/review`,
        {
          rating,
          reviewText
        }
      );

      if (data.success) {
        setMyReview(data.data);
        // Refresh reviews
        const { data: reviewsData } = await apiClient.get(
          `/v1/bookclub-books/${currentBookData.id}/reviews`
        );
        if (reviewsData.success) {
          setReviews(reviewsData.data.reviews || []);
          setAverageRating(reviewsData.data.averageRating || 0);
        }
        alert('Review saved successfully!');
      } else {
        alert(data.error || 'Failed to save review');
      }
    } catch (err) {
      logger.error('Error saving review:', err);
      alert('Failed to save review');
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!currentBookData?.id || !auth?.token) return;
    if (!confirm('Are you sure you want to delete your review?')) return;
    
    try {
      const { data } = await apiClient.delete(
        `/v1/bookclub-books/${currentBookData.id}/review`
      );

      if (data.success) {
        setMyReview(null);
        setRating(0);
        setReviewText('');
        // Refresh reviews
        const { data: reviewsData } = await apiClient.get(
          `/v1/bookclub-books/${currentBookData.id}/reviews`
        );
        if (reviewsData.success) {
          setReviews(reviewsData.data.reviews || []);
          setAverageRating(reviewsData.data.averageRating || 0);
        }
        alert('Review deleted successfully');
      } else {
        alert(data.error || 'Failed to delete review');
      }
    } catch (err) {
      logger.error('Error deleting review:', err);
      alert('Failed to delete review');
    }
  };



  const calculateDaysRemaining = () => {
    if (!currentBookData?.endDate) return 0;
    const today = new Date();
    const end = new Date(currentBookData.endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const calculateProgress = () => {
    if (!currentBookData?.startDate || !currentBookData?.endDate) return 0;
    const start = new Date(currentBookData.startDate);
    const end = new Date(currentBookData.endDate);
    const today = new Date();
    const total = end - start;
    const elapsed = today - start;
    const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100));
    return Math.round(percentage);
  };

  const calculatePagesPerDay = () => {
    if (!currentBookData?.book?.pageCount || !readingDays || readingDays === 0) return 0;
    return Math.ceil(currentBookData.book.pageCount / readingDays);
  };

  const handleUpdateSchedule = async () => {
    if (!startDate || !endDate) return;

    setSubmitting(true);
    try {
      const { data } = await apiClient.patch(
        `/v1/bookclub/${currentBookData.bookClubId}/books/${currentBookData.bookId}`,
        {
          startDate,
          endDate
        }
      );

      if (data.success) {
        onBookUpdated(data.data);
        setEditingSchedule(false);
        alert('Schedule updated successfully!');
      } else {
        alert(data.error || 'Failed to update schedule');
      }
    } catch (err) {
      logger.error('Error updating schedule:', err);
      alert('Failed to update schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveBook = async () => {
    if (!confirm('Are you sure you want to remove this book as the current reading?')) return;

    setSubmitting(true);
    try {
      const { data } = await apiClient.delete(
        `/v1/bookclub/${currentBookData.bookClubId}/books/${currentBookData.bookId}`
      );

      if (data.success) {
        onBookRemoved();
        onClose();
      } else {
        alert(data.error || 'Failed to remove book');
      }
    } catch (err) {
      logger.error('Error removing book:', err);
      alert('Failed to remove book');
    } finally {
      setSubmitting(false);
    }
  };

  const book = currentBookData?.book;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <h2 className="text-2xl font-bold">📖 Current Book</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'details'
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FiBook className="inline mr-2" size={18} />
            Details
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'schedule'
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FiCalendar className="inline mr-2" size={18} />
            Schedule
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* DETAILS TAB */}
          {activeTab === 'details' && (
            <div className="max-w-3xl mx-auto">
              {/* Book Info */}
              <div className="flex gap-6 mb-6">
                <img
                  src={book?.coverUrl || '/images/default.webp'}
                  alt={book?.title}
                  className="w-48 h-72 object-cover rounded-lg shadow-lg"
                  onError={(e) => { e.target.src = '/images/default.webp'; }}
                />
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">
                    {book?.title}
                  </h3>
                  <p className="text-xl text-gray-600 mb-4">{book?.author}</p>
                  
                  <div className="space-y-2 text-gray-700">
                    {book?.pageCount && (
                      <p><span className="font-semibold">Pages:</span> {book.pageCount}</p>
                    )}
                    {book?.publishedDate && (
                      <p><span className="font-semibold">Published:</span> {book.publishedDate}</p>
                    )}
                    {book?.isbn && (
                      <p><span className="font-semibold">ISBN:</span> {book.isbn}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {book?.description && (
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">About this book</h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {book.description}
                  </p>
                </div>
              )}

              {/* Reading Timeline */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Reading Timeline</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Started</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(currentBookData.startDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Target Completion</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(currentBookData.endDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCHEDULE TAB */}
          {activeTab === 'schedule' && (
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">Reading Schedule</h3>
                  {!editingSchedule && (
                    <button
                      onClick={() => setEditingSchedule(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
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
                          onChange={(e) => setReadingDays(parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <input
                          type="number"
                          min="7"
                          max="90"
                          value={readingDays}
                          onChange={(e) => setReadingDays(parseInt(e.target.value))}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditingSchedule(false)}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateSchedule}
                        disabled={submitting || !startDate || !endDate}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                      >
                        {submitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Start Date</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {new Date(currentBookData.startDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">End Date</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {new Date(currentBookData.endDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {book?.pageCount && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-200">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-purple-600">
                            {calculatePagesPerDay()}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">Pages per day</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-blue-600">
                            {calculateDaysRemaining()}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">Days remaining</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROGRESS TAB */}
          {activeTab === 'progress' && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Reading Progress</h3>
              
              {loadingProgress ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading your progress...</p>
                </div>
              ) : (
                <>
                  {/* My Reading Progress */}
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6 mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Reading Progress</h4>
                    
                    {/* Pages Read Input */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pages Read
                      </label>
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <input
                            type="number"
                            min="0"
                            max={book?.pageCount || 1000}
                            value={pagesRead}
                            onChange={(e) => setPagesRead(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="0"
                          />
                        </div>
                        <span className="text-gray-600 text-sm pb-2">
                          of {book?.pageCount || '???'} pages
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span className="font-semibold text-green-600">
                          {book?.pageCount ? Math.min(100, Math.round((pagesRead / book.pageCount) * 100)) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-gradient-to-r from-green-500 to-teal-500 h-4 rounded-full transition-all"
                          style={{ 
                            width: `${book?.pageCount ? Math.min(100, (pagesRead / book.pageCount) * 100) : 0}%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={progressNotes}
                        onChange={(e) => setProgressNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Add notes about your reading session..."
                      />
                    </div>

                    {/* Last Updated */}
                    {myProgress?.lastReadDate && (
                      <p className="text-sm text-gray-600 mb-4">
                        Last updated: {new Date(myProgress.lastReadDate).toLocaleString()}
                      </p>
                    )}

                    {/* Save Button */}
                    <button
                      onClick={handleSaveProgress}
                      disabled={savingProgress}
                      className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                    >
                      {savingProgress ? 'Saving...' : 'Save Progress'}
                    </button>
                  </div>

                  {/* Time Progress */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Time Progress</h4>
                      <span className="text-3xl font-bold text-purple-600">{calculateProgress()}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all"
                        style={{ width: `${calculateProgress()}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      {calculateDaysRemaining()} days remaining until target completion
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border-2 border-purple-200 rounded-lg p-6 text-center">
                      <p className="text-4xl font-bold text-purple-600 mb-2">
                        {new Date(currentBookData.startDate).toLocaleDateString('en-US', { day: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-600">
                        Started {new Date(currentBookData.startDate).toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                    </div>

                    <div className="bg-white border-2 border-blue-200 rounded-lg p-6 text-center">
                      <p className="text-4xl font-bold text-blue-600 mb-2">
                        {new Date(currentBookData.endDate).toLocaleDateString('en-US', { day: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-600">
                        Due {new Date(currentBookData.endDate).toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                    </div>

                    {book?.pageCount && (
                      <>
                        <div className="bg-white border-2 border-purple-200 rounded-lg p-6 text-center">
                          <p className="text-4xl font-bold text-purple-600 mb-2">
                            {book.pageCount}
                          </p>
                          <p className="text-sm text-gray-600">Total pages</p>
                        </div>

                        <div className="bg-white border-2 border-blue-200 rounded-lg p-6 text-center">
                          <p className="text-4xl font-bold text-blue-600 mb-2">
                            {calculatePagesPerDay()}
                          </p>
                          <p className="text-sm text-gray-600">Pages per day</p>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Book Reviews</h3>
              
              {loadingReviews ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading reviews...</p>
                </div>
              ) : (
                <>
                  {/* Average Rating */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 mb-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">Average Rating</p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-5xl font-bold text-yellow-600">{averageRating.toFixed(1)}</span>
                      <FiStar className="text-yellow-500 fill-yellow-500" size={32} />
                    </div>
                    <p className="text-sm text-gray-600">Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                  </div>

                  {/* My Review Form */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      {myReview ? 'Your Review' : 'Write a Review'}
                    </h4>
                    
                    {/* Star Rating */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                            className="transition-transform hover:scale-110"
                          >
                            <FiStar
                              size={32}
                              className={
                                star <= (hoverRating || rating)
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-300'
                              }
                            />
                          </button>
                        ))}
                        {rating > 0 && (
                          <span className="ml-2 text-gray-600 self-center">
                            {rating} star{rating !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Review Text */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Review (Optional)
                      </label>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        rows={4}
                        maxLength={2000}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Share your thoughts about this book..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {reviewText.length}/2000 characters
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveReview}
                        disabled={savingReview || rating === 0}
                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                      >
                        {savingReview ? 'Saving...' : myReview ? 'Update Review' : 'Submit Review'}
                      </button>
                      {myReview && (
                        <button
                          onClick={handleDeleteReview}
                          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                        >
                          <FiTrash2 className="inline" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* All Reviews */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      All Reviews ({reviews.length})
                    </h4>
                    
                    {reviews.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <FiStar className="mx-auto text-4xl text-gray-300 mb-2" />
                        <p className="text-gray-600">No reviews yet. Be the first to review!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <div
                            key={review.id}
                            className={`bg-white border rounded-lg p-4 ${
                              review.userId === auth?.user?.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {review.userId === auth?.user?.id ? 'You' : `User ${review.userId.slice(0, 8)}`}
                                </p>
                                <div className="flex gap-1 mt-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <FiStar
                                      key={star}
                                      size={16}
                                      className={
                                        star <= review.rating
                                          ? 'text-yellow-500 fill-yellow-500'
                                          : 'text-gray-300'
                                      }
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {review.reviewText && (
                              <p className="text-gray-700 whitespace-pre-line">{review.reviewText}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center">
          <button
            onClick={handleRemoveBook}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <FiTrash2 size={16} />
            Remove Book
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CurrentBookDetailsModal;

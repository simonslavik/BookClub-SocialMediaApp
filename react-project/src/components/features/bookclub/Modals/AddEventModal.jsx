import React, { useState, useEffect } from 'react';
import { FiX, FiCalendar } from 'react-icons/fi';
import apiClient from '@api/axios';
import logger from '@utils/logger';




const AddEventModal = ({ isOpen, onClose, bookClubId, auth, eventToEdit, onEventSaved, selectedDate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventType: 'meeting'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (eventToEdit) {
      // Convert eventDate to YYYY-MM-DD format for input
      const date = new Date(eventToEdit.eventDate);
      const formattedDate = date.toISOString().split('T')[0];
      
      setFormData({
        title: eventToEdit.title || '',
        description: eventToEdit.description || '',
        eventDate: formattedDate,
        eventType: eventToEdit.eventType || 'meeting'
      });
    } else {
      // Reset form for new event, use selectedDate if provided
      let defaultDate = '';
      if (selectedDate) {
        const date = new Date(selectedDate);
        // Format as YYYY-MM-DD using local timezone to avoid date shift
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        defaultDate = `${year}-${month}-${day}`;
      }
      setFormData({
        title: '',
        description: '',
        eventDate: defaultDate,
        eventType: 'meeting'
      });
    }
    setError('');
  }, [eventToEdit, isOpen, selectedDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Event title is required');
      return;
    }
    
    if (!formData.eventDate) {
      setError('Event date is required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const path = eventToEdit
        ? `/v1/editor/events/${eventToEdit.id}`
        : `/v1/editor/bookclubs/${bookClubId}/events`;
      
      const body = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        eventDate: new Date(formData.eventDate).toISOString(),
        eventType: formData.eventType
      };

      const { data } = eventToEdit
        ? await apiClient.patch(path, body)
        : await apiClient.post(path, body);
      
      onEventSaved && onEventSaved(data.event);
      onClose();
    } catch (err) {
      logger.error('Error saving event:', err);
      setError(err.response?.data?.error || `Failed to ${eventToEdit ? 'update' : 'create'} event`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold flex items-center gap-2">
            <FiCalendar />
            {eventToEdit ? 'Edit Event' : 'Add Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-500 text-red-200 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
              Event Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Book Discussion Meeting"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {/* Event Type */}
          <div>
            <label htmlFor="eventType" className="block text-sm font-medium text-gray-300 mb-1">
              Event Type
            </label>
            <select
              id="eventType"
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="meeting">Meeting</option>
              <option value="book_deadline">Book Deadline</option>
              <option value="discussion">Discussion</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Event Date */}
          <div>
            <label htmlFor="eventDate" className="block text-sm font-medium text-gray-300 mb-1">
              Event Date *
            </label>
            <input
              id="eventDate"
              name="eventDate"
              type="date"
              value={formData.eventDate}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add any additional details about this event..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              {loading ? 'Saving...' : eventToEdit ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEventModal;

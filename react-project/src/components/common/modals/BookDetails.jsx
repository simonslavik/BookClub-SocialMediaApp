
import React from 'react';
import { FiX } from 'react-icons/fi';
import logger from '@utils/logger';

const BookDetailsModal = ({ onClose, book }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
          <h2 className="text-2xl font-bold">Book Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {/* Book Info */}
            <div className="flex gap-6 mb-6">
              <img
                src={book?.coverUrl || '/images/default.webp'}
                alt={book?.title}
                className="w-48 h-72 object-cover rounded-lg shadow-lg flex-shrink-0"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailsModal;
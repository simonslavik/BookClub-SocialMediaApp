
import { FiPlus, FiStar } from 'react-icons/fi';
import logger from '@utils/logger';

const BookClubBookView = ({ setShowAddBookModal, bookclubBooks, setCurrentBookData, setCurrentBookDetailsOpen, handleStatusChange }) => {
  return (
    <div className="space-y-6">
        <div className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 cursor-pointer"
            onClick={() => setShowAddBookModal(true)}
            >
            <FiPlus size={20} />
            Add New Book to Bookclub
        </div>
        {/* Current Book */}
        {bookclubBooks.current.length > 0 && (
        <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📖</span> Currently Reading
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookclubBooks.current.map(bookClubBook => (
                <div
                key={bookClubBook.id}
                className="bg-gray-800 rounded-lg p-4 border border-purple-500 hover:bg-gray-700 transition-colors"
                >
                <div 
                    onClick={() => {
                    setCurrentBookData(bookClubBook);
                    setCurrentBookDetailsOpen(true);
                    }}
                    className="flex gap-3 cursor-pointer mb-3"
                >
                    <img
                    src={bookClubBook.book?.coverUrl || '/images/default.webp'}
                    alt={bookClubBook.book?.title}
                    className="w-20 h-28 object-cover rounded shadow-md"
                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                    />
                    <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                        {bookClubBook.book?.title}
                    </h4>
                    <p className="text-gray-400 text-xs mb-2">
                        {bookClubBook.book?.author}
                    </p>
                    {bookClubBook.startDate && bookClubBook.endDate && (
                        <p className="text-xs text-purple-400">
                        {new Date(bookClubBook.startDate).toLocaleDateString()} - {new Date(bookClubBook.endDate).toLocaleDateString()}
                        </p>
                    )}
                    </div>
                </div>
                <select
                    value={bookClubBook.status}
                    onChange={(e) => handleStatusChange(bookClubBook.bookId, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="current">📖 Currently Reading</option>
                    <option value="upcoming">📚 Coming Up Next</option>
                    <option value="completed">✅ Completed</option>
                </select>
                </div>
            ))}
            </div>
        </div>
        )}

        {/* Upcoming Books */}
        {bookclubBooks.upcoming.length > 0 && (
        <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📚</span> Coming Up Next
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookclubBooks.upcoming.map(bookClubBook => (
                <div
                key={bookClubBook.id}
                className="bg-gray-800 rounded-lg p-4 border border-blue-500 hover:bg-gray-700 transition-colors"
                >
                <div 
                    onClick={() => {
                    setCurrentBookData(bookClubBook);
                    setCurrentBookDetailsOpen(true);
                    }}
                    className="flex gap-3 cursor-pointer mb-3"
                >
                    <img
                    src={bookClubBook.book?.coverUrl || '/images/default.webp'}
                    alt={bookClubBook.book?.title}
                    className="w-20 h-28 object-cover rounded shadow-md"
                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                    />
                    <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                        {bookClubBook.book?.title}
                    </h4>
                    <p className="text-gray-400 text-xs mb-2">
                        {bookClubBook.book?.author}
                    </p>
                    {bookClubBook.startDate && (
                        <p className="text-xs text-blue-400">
                        Starts: {new Date(bookClubBook.startDate).toLocaleDateString()}
                        </p>
                    )}
                    </div>
                </div>
                <select
                    value={bookClubBook.status}
                    onChange={(e) => handleStatusChange(bookClubBook.bookId, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="current">📖 Currently Reading</option>
                    <option value="upcoming">📚 Coming Up Next</option>
                    <option value="completed">✅ Completed</option>
                </select>
                </div>
            ))}
            </div>
        </div>
        )}

        {/* Completed Books */}
        {bookclubBooks.completed.length > 0 && (
        <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">✅</span> Completed
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookclubBooks.completed.map(bookClubBook => (
                <div
                key={bookClubBook.id}
                className="bg-gray-800 rounded-lg p-4 border border-green-500 hover:bg-gray-700 transition-colors"
                >
                <div 
                    onClick={() => {
                    setCurrentBookData(bookClubBook);
                    setCurrentBookDetailsOpen(true);
                    }}
                    className="flex gap-3 cursor-pointer mb-3"
                >
                    <img
                    src={bookClubBook.book?.coverUrl || '/images/default.webp'}
                    alt={bookClubBook.book?.title}
                    className="w-20 h-28 object-cover rounded shadow-md"
                    onError={(e) => { e.target.src = '/images/default.webp'; }}
                    />
                    <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                        {bookClubBook.book?.title}
                    </h4>
                    <p className="text-gray-400 text-xs mb-2">
                        {bookClubBook.book?.author}
                    </p>
                    {bookClubBook.endDate && (
                        <p className="text-xs text-green-400">
                        Finished: {new Date(bookClubBook.endDate).toLocaleDateString()}
                        </p>
                    )}
                    </div>
                </div>
                <select
                    value={bookClubBook.status}
                    onChange={(e) => handleStatusChange(bookClubBook.bookId, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    <option value="current">📖 Currently Reading</option>
                    <option value="upcoming">📚 Coming Up Next</option>
                    <option value="completed">✅ Completed</option>
                </select>
                </div>
            ))}
            </div>
        </div>
        )}

        {/* Empty State */}
        {bookclubBooks.current.length === 0 && bookclubBooks.upcoming.length === 0 && bookclubBooks.completed.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
            <FiStar className="mx-auto text-4xl mb-2 opacity-30" />
            <p className="text-sm">No books added yet</p>
            <p className="text-xs mt-1">Add a current book to get started!</p>
        </div>
        )}
    </div>
  )
}

export default BookClubBookView;
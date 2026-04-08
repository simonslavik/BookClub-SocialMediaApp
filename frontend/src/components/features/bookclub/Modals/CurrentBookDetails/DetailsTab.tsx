const DEFAULT_IMAGE = '/images/default.webp';

const DetailsTab = ({ book, currentBookData }) => (
  <div className="max-w-3xl mx-auto">
    {/* Book Info */}
    <div className="flex gap-6 mb-6">
      <img
        src={book?.coverUrl || DEFAULT_IMAGE}
        alt={book?.title}
        className="w-48 h-72 object-cover rounded-lg shadow-lg"
        onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
      />
      <div className="flex-1">
        <h3 className="text-3xl font-bold text-gray-900 mb-3">{book?.title}</h3>
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
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">{book.description}</p>
      </div>
    )}

    {/* Reading Timeline */}
    <div className="bg-stone-50 rounded-lg p-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Reading Timeline</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Started</p>
          <p className="text-lg font-semibold text-gray-900">
            {new Date(currentBookData.startDate).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Target Completion</p>
          <p className="text-lg font-semibold text-gray-900">
            {new Date(currentBookData.endDate).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default DetailsTab;

const DEFAULT_IMAGE = '/images/default.webp';

const DetailsTab = ({ book, currentBookData }) => (
  <div className="max-w-3xl mx-auto">
    {/* Book Info */}
    <div className="flex gap-4 mb-4">
      <img
        src={book?.coverUrl || DEFAULT_IMAGE}
        alt={book?.title}
        className="w-32 h-48 object-cover rounded shadow-lg flex-shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
      />
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-white mb-1">{book?.title}</h3>
        <p className="text-sm text-gray-400 mb-3">{book?.author}</p>

        <dl className="grid grid-cols-1 gap-1 text-xs">
          {book?.pageCount && (
            <div className="flex gap-2">
              <dt className="text-gray-500 min-w-[80px]">Pages</dt>
              <dd className="text-gray-200">{book.pageCount}</dd>
            </div>
          )}
          {book?.publishedDate && (
            <div className="flex gap-2">
              <dt className="text-gray-500 min-w-[80px]">Published</dt>
              <dd className="text-gray-200">{book.publishedDate}</dd>
            </div>
          )}
          {book?.isbn && (
            <div className="flex gap-2">
              <dt className="text-gray-500 min-w-[80px]">ISBN</dt>
              <dd className="text-gray-200 font-mono">{book.isbn}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>

    {/* Description */}
    {book?.description && (
      <div className="mb-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">About this book</h4>
        <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">{book.description}</p>
      </div>
    )}

    {/* Reading Timeline */}
    <div className="bg-white/[0.04] border border-white/[0.06] rounded-md p-3">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Reading Timeline</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] text-gray-500 mb-0.5">Started</p>
          <p className="text-sm font-medium text-gray-100">
            {currentBookData?.startDate
              ? new Date(currentBookData.startDate).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-gray-500 mb-0.5">Target Completion</p>
          <p className="text-sm font-medium text-gray-100">
            {currentBookData?.endDate
              ? new Date(currentBookData.endDate).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })
              : '—'}
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default DetailsTab;

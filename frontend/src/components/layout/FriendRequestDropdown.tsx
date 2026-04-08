import { FiUsers } from 'react-icons/fi';
import { getProfileImageUrl } from '@config/constants';

const DEFAULT_AVATAR = '/images/default.webp';

/**
 * Desktop friend-request dropdown that appears on click.
 * Shows pending requests with accept/decline actions.
 */
const FriendRequestDropdown = ({ requests, isOpen, onFriendAction }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-4 mt-2 w-60 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-lg">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Friend Requests</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{requests.length} pending</p>
      </div>

      {requests.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <FiUsers className="mx-auto h-6 w-6 text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No new friend requests</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {requests.map((request) => (
            <div key={request.friendshipId} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <div className="flex items-start space-x-3">
                <img
                  src={getProfileImageUrl(request.from?.profileImage) || DEFAULT_AVATAR}
                  alt={request.from?.name || 'User'}
                  className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    <span className="font-semibold">{request.from?.name || 'Unknown User'}</span>
                    <span className="text-gray-600 dark:text-gray-400"> sent you a friend request</span>
                  </p>
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onFriendAction(request.friendshipId, 'accept'); }}
                      className="flex-1 px-3 py-1.5 bg-stone-600 text-white rounded-md hover:bg-stone-700 transition text-xs font-medium"
                    >
                      Accept
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onFriendAction(request.friendshipId, 'reject'); }}
                      className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition text-xs font-medium"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendRequestDropdown;

import { useNavigate } from 'react-router-dom';
import { getProfileImageUrl } from '@config/constants';

const DEFAULT_IMAGE = '/images/default.webp';

/** A single friend avatar card. */
const FriendCard = ({ friend }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/profile/${friend.id}`)}
      className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-xl border border-warmgray-200 dark:border-gray-700 hover:shadow-md hover:border-stone-300 dark:hover:border-gray-600 transition-all cursor-pointer group w-24 flex-shrink-0"
    >
      <img
        src={getProfileImageUrl(friend.profileImage) || DEFAULT_IMAGE}
        alt={friend.name || friend.username}
        className="w-12 h-12 rounded-full object-cover ring-2 ring-warmgray-200 dark:ring-gray-600 group-hover:ring-stone-400 transition-all"
        onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
      />
      <span className="text-xs font-medium text-stone-700 dark:text-warmgray-200 text-center truncate w-full group-hover:text-stone-500 dark:group-hover:text-white transition-colors">
        {friend.name || friend.username}
      </span>
    </button>
  );
};

/** A single suggested-user card with "Add" / "Pending" action. */
const SuggestedUserCard = ({ user, onSendRequest }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-xl border border-warmgray-200 dark:border-gray-700 hover:shadow-md hover:border-stone-300 dark:hover:border-gray-600 transition-all group w-24 flex-shrink-0">
      <button
        onClick={() => navigate(`/profile/${user.id}`)}
        className="flex flex-col items-center gap-1 cursor-pointer"
      >
        <img
          src={getProfileImageUrl(user.profileImage) || DEFAULT_IMAGE}
          alt={user.name}
          className="w-12 h-12 rounded-full object-cover ring-2 ring-warmgray-200 dark:ring-gray-600 group-hover:ring-emerald-400 transition-all"
          onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
        />
        <span className="text-xs font-medium text-stone-700 dark:text-warmgray-200 text-center truncate w-full">
          {user.name}
        </span>
      </button>

      {user.friendshipStatus === 'pending' ? (
        <span className="text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full font-medium">
          Pending
        </span>
      ) : (
        <button
          onClick={() => onSendRequest(user.id)}
          className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800/60 transition-colors cursor-pointer font-medium"
        >
          + Add
        </button>
      )}
    </div>
  );
};

/**
 * Friends & Suggestions panel — shows current friends,
 * suggested people, and an empty-state CTA.
 */
const FriendsPanel = ({ friends = [], suggestedUsers = [], onSendFriendRequest }) => {
  const navigate = useNavigate();

  return (
    <div className="mt-10 md:mt-16">
      <h3 className="text-lg font-bold text-stone-800 dark:text-warmgray-100 mb-4 text-center">
        👥 Your Friends
      </h3>

      {/* Friends list */}
      {friends.length > 0 && (
        <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-3 justify-center flex-wrap">
            {friends.map((f) => {
              const friend = f.friend;
              if (!friend) return null;
              return <FriendCard key={friend.id} friend={friend} />;
            })}
          </div>
        </div>
      )}

      {/* Suggested users */}
      {suggestedUsers.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-stone-600 dark:text-gray-400">
              People You Might Know
            </h4>
            <button
              onClick={() => navigate('/people')}
              className="text-xs text-stone-500 hover:text-stone-700 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              Find More →
            </button>
          </div>
          <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <div className="flex gap-3 justify-center flex-wrap">
              {suggestedUsers.slice(0, 8).map((user) => (
                <SuggestedUserCard
                  key={user.id}
                  user={user}
                  onSendRequest={onSendFriendRequest}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {friends.length === 0 && suggestedUsers.length === 0 && (
        <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-xl border border-warmgray-200 dark:border-gray-700 max-w-md mx-auto">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            You haven&apos;t added any friends yet.
          </p>
          <button
            onClick={() => navigate('/people')}
            className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 transition-colors cursor-pointer font-medium"
          >
            Find People
          </button>
        </div>
      )}
    </div>
  );
};

export default FriendsPanel;

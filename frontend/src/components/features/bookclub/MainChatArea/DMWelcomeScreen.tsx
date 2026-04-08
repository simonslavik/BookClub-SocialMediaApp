import { useNavigate } from 'react-router-dom';
import { FiSearch, FiCompass, FiPlusCircle, FiUsers, FiMessageCircle } from 'react-icons/fi';
import { getProfileImageUrl } from '@config/constants';

const DEFAULT_IMAGE = '/images/default.webp';

const DMWelcomeScreen = ({ auth, friends = [], conversations = [], onSelectConversation }) => {
  const navigate = useNavigate();
  const userName = auth?.user?.name?.split(' ')[0] || 'there';

  const flatFriends = friends
    .filter((f) => f.friend)
    .map((f) => ({
      id: f.friend.id,
      name: f.friend.name,
      username: f.friend.username,
      profileImage: f.friend.profileImage,
    }));

  const conversationUserIds = new Set(
    conversations.filter((c) => c.friend).map((c) => c.friend.id),
  );
  const friendsWithoutConvo = flatFriends.filter((f) => !conversationUserIds.has(f.id));

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-900 p-4">
      <div className="max-w-lg w-full text-center">
        {/* Welcome icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-stone-600 to-stone-800 flex items-center justify-center mb-6 shadow-lg">
          <FiMessageCircle className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {userName}!</h2>
        <p className="text-gray-400 text-sm mb-8">Your messaging home base. Start a conversation or explore book clubs.</p>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <button
            onClick={() => navigate('/discover')}
            className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-stone-600 rounded-xl transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-900/40 flex items-center justify-center group-hover:bg-emerald-900/60 transition-colors">
              <FiCompass className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Discover Clubs</span>
            <span className="text-xs text-gray-500">Find book clubs to join</span>
          </button>

          <button
            onClick={() => navigate('/create-bookclub')}
            className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-stone-600 rounded-xl transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center group-hover:bg-blue-900/60 transition-colors">
              <FiPlusCircle className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Create a Club</span>
            <span className="text-xs text-gray-500">Start your own community</span>
          </button>

          <button
            onClick={() => {
              const searchInput = document.querySelector('input[placeholder="Find or start a conversation"]');
              if (searchInput) { searchInput.focus(); searchInput.click(); }
            }}
            className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-stone-600 rounded-xl transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-purple-900/40 flex items-center justify-center group-hover:bg-purple-900/60 transition-colors">
              <FiSearch className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Find Friends</span>
            <span className="text-xs text-gray-500">Search for people to chat</span>
          </button>
        </div>

        {/* Friends list */}
        {flatFriends.length > 0 ? (
          <div className="text-left">
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3 px-1">
              {friendsWithoutConvo.length > 0 ? 'Start a conversation' : 'Your friends'}
            </h3>
            <div className="space-y-1">
              {(friendsWithoutConvo.length > 0 ? friendsWithoutConvo : flatFriends).slice(0, 5).map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => onSelectConversation ? onSelectConversation(friend.id) : navigate(`/dm/${friend.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors group cursor-pointer"
                >
                  <img
                    src={getProfileImageUrl(friend.profileImage) || DEFAULT_IMAGE}
                    alt={friend.name || friend.username}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    loading="lazy"
                    onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white font-medium truncate">{friend.name || friend.username}</span>
                  <FiMessageCircle className="w-4 h-4 text-gray-600 group-hover:text-stone-400 ml-auto flex-shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
            <FiUsers className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400 mb-1 font-medium">No friends yet</p>
            <p className="text-xs text-gray-500 mb-4">Join a book club to meet fellow readers, or search for people you know.</p>
            <button
              onClick={() => navigate('/discover')}
              className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white text-sm rounded-lg transition-colors font-medium cursor-pointer"
            >
              Browse Book Clubs
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DMWelcomeScreen;

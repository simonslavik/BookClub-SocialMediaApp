import { FiUser, FiCircle } from 'react-icons/fi';
import logger from '@utils/logger';

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
];

export default function UserPresence({ users, currentUsername }) {
  const getUserColor = (userId) => {
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return USER_COLORS[hash % USER_COLORS.length];
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {users.slice(0, 5).map((user) => (
          <div
            key={user.id}
            className="w-8 h-8 rounded-full border-2 border-gray-800 flex items-center justify-center text-white text-sm font-semibold transition-transform hover:scale-110 hover:z-10"
            style={{ backgroundColor: getUserColor(user.id) }}
            title={user.username}
          >
            {user.username.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
      {users.length > 5 && (
        <span className="text-gray-400 text-sm">+{users.length - 5} more</span>
      )}
      <div className="flex items-center gap-1.5 text-green-400 text-sm ml-2">
        <FiCircle className="fill-current animate-pulse" size={8} />
        <span>{users.length} online</span>
      </div>
    </div>
  );
}

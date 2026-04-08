import { FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { getProfileImageUrl } from '@config/constants';

const DEFAULT_IMAGE = '/images/default.webp';

/**
 * Avatar row shown at the bottom of a BookClubCard.
 * Friends are sorted first; remaining members collapsed to "+N".
 *
 * @param {{ members: Array, memberCount: number, friendIds: Set, onHoverMember: (m|null)=>void }} props
 */
const MemberAvatars = ({ members, memberCount, friendIds, onHoverMember }) => {
  const navigate = useNavigate();
  const count = memberCount || members?.length || 0;

  if (!members || members.length === 0) {
    return (
      <div className="flex items-center gap-2 text-stone-400 dark:text-gray-500">
        <FiUsers size={14} />
        <span className="text-[11px] font-outfit font-medium">
          {count} member{count !== 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  const sorted = [...members].sort(
    (a, b) => (friendIds.has(a.id) ? 0 : 1) - (friendIds.has(b.id) ? 0 : 1),
  );
  const shown = sorted.slice(0, 4);
  const remaining = members.length - shown.length;

  return (
    <div className="flex items-center justify-between">
      <div className="flex -space-x-2">
        {shown.map((m) => (
          <img
            key={m.id}
            src={getProfileImageUrl(m.profileImage) || DEFAULT_IMAGE}
            alt={m.username}
            className={`w-7 h-7 rounded-full border-2 object-cover cursor-pointer hover:ring-2 hover:ring-stone-400 transition-all hover:z-10 relative ${
              friendIds.has(m.id) ? 'border-green-400' : 'border-white dark:border-gray-800'
            }`}
            loading="lazy"
            onClick={(e) => { e.stopPropagation(); navigate(`/profile/${m.id}`); }}
            onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onHoverMember({
                id: m.id,
                name: m.name || m.username,
                image: getProfileImageUrl(m.profileImage) || DEFAULT_IMAGE,
                isFriend: friendIds.has(m.id),
                x: rect.left + rect.width / 2,
                y: rect.top,
              });
            }}
            onMouseLeave={() => onHoverMember(null)}
          />
        ))}
        {remaining > 0 && (
          <div className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 bg-stone-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-stone-600 dark:text-gray-300">
            +{remaining}
          </div>
        )}
      </div>

      <span className="text-[11px] text-stone-400 dark:text-gray-500 font-medium font-outfit">
        {count} {count === 1 ? 'member' : 'members'}
      </span>
    </div>
  );
};

export default MemberAvatars;

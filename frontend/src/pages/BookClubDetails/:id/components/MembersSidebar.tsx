import { useNavigate } from 'react-router-dom';
import { getProfileImageUrl } from '@config/constants';

const DEFAULT_IMG = '/images/default.webp';

export default function MembersSidebar({ members, connectedUsers }) {
    const navigate = useNavigate();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl ring-1 ring-black/5 dark:ring-white/5 p-6">
            <p className="text-[11px] uppercase tracking-widest text-stone-400 dark:text-gray-500 font-bold font-outfit mb-4">
                Members &middot; {members.length}
            </p>
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {members.slice(0, 12).map((member) => {
                    const online = connectedUsers.some(u => u.userId === member.id);
                    return (
                        <div
                            key={member.id}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                            onClick={() => navigate(`/profile/${member.id}`)}
                        >
                            <div className="relative flex-shrink-0">
                                <img
                                    src={getProfileImageUrl(member.profileImage) || DEFAULT_IMG}
                                    alt={member.username}
                                    className="w-9 h-9 rounded-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMG; }}
                                />
                                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 ${online ? 'bg-green-500' : 'bg-stone-300 dark:bg-gray-600'}`} />
                            </div>
                            <span className="text-sm font-medium text-stone-800 dark:text-gray-100 truncate font-outfit">{member.username}</span>
                        </div>
                    );
                })}
            </div>
            {members.length > 12 && (
                <p className="text-center text-xs text-stone-400 dark:text-gray-500 mt-3 font-outfit">
                    +{members.length - 12} more
                </p>
            )}
        </div>
    );
}

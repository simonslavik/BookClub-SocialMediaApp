import React from 'react';
import { FiBook, FiUsers, FiMessageCircle, FiCalendar, FiSearch, FiInbox, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const presets = {
  'no-clubs': {
    icon: FiBook,
    title: 'No Book Clubs Yet',
    description: "You haven't joined any book clubs. Discover one or create your own!",
    actionLabel: 'Discover Book Clubs',
    actionPath: '/discover',
    secondaryLabel: 'Create One',
    secondaryPath: '/create-bookclub',
  },
  'no-members': {
    icon: FiUsers,
    title: 'No Members',
    description: 'This club is just getting started — invite friends to join!',
  },
  'no-messages': {
    icon: FiMessageCircle,
    title: 'No Messages Yet',
    description: 'Break the ice! Send the first message in this room.',
  },
  'no-meetings': {
    icon: FiCalendar,
    title: 'No Meetings Scheduled',
    description: 'Plan your next book discussion or social gathering.',
    actionLabel: 'Schedule Meeting',
  },
  'no-results': {
    icon: FiSearch,
    title: 'No Results Found',
    description: 'Try adjusting your search or filters.',
  },
  'no-suggestions': {
    icon: FiInbox,
    title: 'No Book Suggestions',
    description: 'Be the first to suggest a book for the club to read next!',
    actionLabel: 'Suggest a Book',
  },
  'no-books': {
    icon: FiBook,
    title: 'No Books Yet',
    description: "This club hasn't added any books. Start building the library!",
  },
};

/**
 * Reusable empty state component.
 *
 * @param {string}   preset         - Key from presets above for quick use
 * @param {string}   title          - Custom title (overrides preset)
 * @param {string}   description    - Custom description (overrides preset)
 * @param {React.ComponentType} icon - Custom icon component (overrides preset)
 * @param {string}   actionLabel    - Primary CTA text
 * @param {string}   actionPath     - Navigate to path on primary CTA
 * @param {Function} onAction       - Custom primary action handler (overrides navigation)
 * @param {string}   secondaryLabel - Secondary CTA text
 * @param {string}   secondaryPath  - Navigate to path on secondary CTA
 * @param {Function} onSecondary    - Custom secondary action handler
 * @param {'light'|'dark'} variant  - Color scheme
 * @param {string}   className      - Additional classes
 */
const EmptyState = ({
  preset,
  title,
  description,
  icon,
  actionLabel,
  actionPath,
  onAction,
  secondaryLabel,
  secondaryPath,
  onSecondary,
  variant = 'light',
  className = '',
}) => {
  const navigate = useNavigate();
  const p = preset ? presets[preset] || {} : {};

  const resolvedTitle = title || p.title || 'Nothing Here';
  const resolvedDesc = description || p.description || '';
  const Icon = icon || p.icon || FiInbox;
  const resolvedAction = actionLabel || p.actionLabel;
  const resolvedActionPath = actionPath || p.actionPath;
  const resolvedSecondary = secondaryLabel || p.secondaryLabel;
  const resolvedSecondaryPath = secondaryPath || p.secondaryPath;

  const isDark = variant === 'dark';

  const handlePrimary = () => {
    if (onAction) return onAction();
    if (resolvedActionPath) navigate(resolvedActionPath);
  };

  const handleSecondary = () => {
    if (onSecondary) return onSecondary();
    if (resolvedSecondaryPath) navigate(resolvedSecondaryPath);
  };

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${
          isDark ? 'bg-white/10' : 'bg-warmgray-100'
        }`}
      >
        <Icon
          className={`w-7 h-7 ${isDark ? 'text-warmgray-400' : 'text-warmgray-500'}`}
        />
      </div>

      <h3
        className={`text-lg font-semibold mb-2 font-display ${
          isDark ? 'text-gray-200' : 'text-gray-900'
        }`}
      >
        {resolvedTitle}
      </h3>

      {resolvedDesc && (
        <p
          className={`text-sm max-w-xs mb-6 font-outfit ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          {resolvedDesc}
        </p>
      )}

      {(resolvedAction || resolvedSecondary) && (
        <div className="flex items-center gap-3">
          {resolvedAction && (
            <button
              onClick={handlePrimary}
              className="px-5 py-2.5 bg-stone-700 text-white rounded-xl text-sm font-semibold hover:bg-stone-800 transition-colors font-outfit"
            >
              {resolvedAction}
            </button>
          )}
          {resolvedSecondary && (
            <button
              onClick={handleSecondary}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors font-outfit ${
                isDark
                  ? 'bg-white/10 text-gray-300 hover:bg-white/15'
                  : 'bg-warmgray-100 text-stone-700 hover:bg-warmgray-200'
              }`}
            >
              {resolvedSecondary}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;

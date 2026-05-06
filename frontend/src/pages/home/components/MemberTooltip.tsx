import { createPortal } from 'react-dom';

const DEFAULT_IMAGE = '/images/default.webp';

/**
 * Floating tooltip that appears when hovering over a member avatar.
 * Rendered via React portal to escape any overflow/z-index stacking.
 */
const MemberTooltip = ({ member }) => {
  if (!member) return null;

  return createPortal(
    <div
      className="fixed flex items-center gap-2 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap pointer-events-none"
      style={{
        zIndex: 99999,
        left: member.x,
        top: member.y - 10,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <img
        src={member.image}
        alt={member.name}
        className="w-6 h-6 rounded-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
      />
      <span className="font-medium">{member.name}</span>
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45 -mt-1" />
    </div>,
    document.body
  );
};

export default MemberTooltip;

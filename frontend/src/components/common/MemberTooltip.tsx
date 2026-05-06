import { createPortal } from 'react-dom';

const DEFAULT_IMAGE = '/images/default.webp';

/**
 * Floating tooltip shown on member avatar hover.
 * Rendered via portal to escape overflow/z-index stacking.
 *
 * @param {{ member: { name: string, image: string, isFriend?: boolean, x: number, y: number } | null }} props
 */
const MemberTooltip = ({ member }) => {
  if (!member) return null;

  return createPortal(
    <div
      className="fixed flex items-center gap-2 bg-stone-900 text-white text-xs rounded-lg px-3 py-2 shadow-2xl whitespace-nowrap pointer-events-none ring-1 ring-white/10"
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
        className="w-6 h-6 rounded-full object-cover ring-1 ring-white/20"
        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
      />
      <span className="font-medium">{member.name}</span>
      {member.isFriend && (
        <span className="text-green-400 text-[10px]">&#9733; Friend</span>
      )}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-900 rotate-45 -mt-1" />
    </div>,
    document.body
  );
};

export default MemberTooltip;

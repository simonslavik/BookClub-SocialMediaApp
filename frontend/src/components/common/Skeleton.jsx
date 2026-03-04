import React from 'react';

/**
 * Base skeleton pulse element.
 * Accepts className for custom sizing/shape.
 */
const Skeleton = ({ className = '', rounded = 'rounded' }) => (
  <div className={`animate-pulse bg-warmgray-200 ${rounded} ${className}`} />
);

/**
 * Skeleton for a bookclub card (used in Home carousel and Discover grid).
 */
export const BookClubCardSkeleton = () => (
  <div className="w-[300px] h-[440px] rounded-2xl overflow-hidden bg-white shadow-md flex flex-col">
    {/* Cover image */}
    <Skeleton className="h-44 w-full" rounded="rounded-none" />
    {/* Body */}
    <div className="p-4 flex flex-col flex-1">
      <Skeleton className="h-5 w-3/4 mb-3" rounded="rounded" />
      {/* "Currently Reading" block */}
      <div className="p-2.5 bg-warmgray-50 rounded-lg border border-warmgray-200 mt-1">
        <Skeleton className="h-2.5 w-20 mb-2" rounded="rounded" />
        <div className="flex gap-2">
          <Skeleton className="w-10 h-14" rounded="rounded" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-full" rounded="rounded" />
            <Skeleton className="h-3 w-2/3" rounded="rounded" />
          </div>
        </div>
      </div>
      {/* Members row */}
      <div className="mt-auto pt-3 flex items-center justify-between">
        <div className="flex -space-x-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-7 h-7" rounded="rounded-full" />
          ))}
        </div>
        <Skeleton className="h-3 w-16" rounded="rounded" />
      </div>
    </div>
  </div>
);

/**
 * Skeleton for the Discover grid cards.
 */
export const DiscoverCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full h-[420px] flex flex-col">
    <Skeleton className="h-48 w-full" rounded="rounded-none" />
    <div className="p-5 flex flex-col flex-1">
      <Skeleton className="h-5 w-3/4 mb-2" rounded="rounded" />
      <Skeleton className="h-3 w-full mb-1" rounded="rounded" />
      <Skeleton className="h-3 w-2/3 mb-3" rounded="rounded" />
      <div className="mt-auto flex items-center gap-2">
        <Skeleton className="w-5 h-5" rounded="rounded-full" />
        <Skeleton className="h-3 w-20" rounded="rounded" />
      </div>
    </div>
  </div>
);

/**
 * Skeleton for the bookclub chat area (main page).
 */
export const ChatSkeleton = () => (
  <div className="flex flex-col h-full p-4 space-y-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className={`flex items-start gap-3 ${i % 3 === 0 ? 'flex-row-reverse' : ''}`}>
        <Skeleton className="w-9 h-9 flex-shrink-0" rounded="rounded-full" />
        <div className={`space-y-1.5 ${i % 3 === 0 ? 'items-end' : ''}`}>
          <Skeleton className="h-3 w-20" rounded="rounded" />
          <Skeleton
            className={`h-16 ${i % 2 === 0 ? 'w-56' : 'w-40'}`}
            rounded="rounded-xl"
          />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Skeleton for the sidebar bookclub list.
 */
export const SidebarSkeleton = () => (
  <div className="flex flex-col items-center gap-2 py-3 px-2">
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} className="w-12 h-12" rounded="rounded-2xl" />
    ))}
  </div>
);

/**
 * Generic list skeleton (for meetings, suggestions, etc.).
 */
export const ListSkeleton = ({ rows = 4 }) => (
  <div className="space-y-3 p-4">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
        <Skeleton className="w-10 h-10" rounded="rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-2/3" rounded="rounded" />
          <Skeleton className="h-3 w-1/2" rounded="rounded" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Profile page skeleton.
 */
export const ProfileSkeleton = () => (
  <div className="max-w-4xl mx-auto p-8 space-y-6">
    <div className="flex items-center gap-6">
      <Skeleton className="w-24 h-24" rounded="rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" rounded="rounded" />
        <Skeleton className="h-4 w-32" rounded="rounded" />
      </div>
    </div>
    <Skeleton className="h-px w-full" rounded="rounded" />
    <div className="grid grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-24" rounded="rounded-xl" />
      ))}
    </div>
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-16" rounded="rounded-lg" />
      ))}
    </div>
  </div>
);

export default Skeleton;

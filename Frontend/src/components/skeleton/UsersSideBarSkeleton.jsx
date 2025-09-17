import React from 'react'

const UsersSideBarSkeleton = ({index}) => {
  return (
    <div
    className={`
      w-full px-4 py-4 flex items-center gap-4 text-left
      border-b border-base-200
      ${index % 2 === 0 ? "bg-base-100" : "bg-base-50"}
    `}
  >
    {/* Avatar Skeleton */}
    <div className="flex-shrink-0">
      <div className="w-12 h-12 rounded-full bg-base-300 animate-pulse"></div>
    </div>

    {/* User Info Skeleton */}
    <div className="flex-1 min-w-0 space-y-2">
      <div className="h-4 bg-base-300 rounded animate-pulse w-3/4"></div>
      <div className="h-3 bg-base-300 rounded animate-pulse w-1/2"></div>
    </div>

    {/* Status Indicator Skeleton */}
    <div className="flex-shrink-0">
      <div className="w-3 h-3 rounded-full bg-base-300 animate-pulse"></div>
    </div>
  </div>
  )
}

export default UsersSideBarSkeleton

'use client';

/**
 * Composant Skeleton pour les cartes d'annonces
 * Utilisé pendant le chargement pour une meilleure UX
 */

export function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-[4/3] bg-gray-200 relative">
        <div className="absolute top-3 left-3">
          <div className="h-6 w-16 bg-gray-300 rounded-full"></div>
        </div>
        <div className="absolute top-3 right-3">
          <div className="h-6 w-14 bg-gray-300 rounded-full"></div>
        </div>
        <div className="absolute bottom-3 left-3">
          <div className="h-8 w-32 bg-gray-300 rounded-lg"></div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-5 space-y-3">
        {/* Type badge */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
        </div>
        
        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 w-full bg-gray-200 rounded"></div>
          <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
        </div>
        
        {/* Location */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
      
      {/* Bottom bar */}
      <div className="h-1 bg-gray-200"></div>
    </div>
  );
}

export function ListingGridSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 bg-gray-200 rounded-2xl"></div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-8 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      </td>
      <td className="p-4">
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
      </td>
      <td className="p-4">
        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
      </td>
      <td className="p-4">
        <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
      </td>
      <td className="p-4">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </td>
      <td className="p-4">
        <div className="h-8 w-20 bg-gray-200 rounded"></div>
      </td>
    </tr>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="h-24 w-24 bg-gray-200 rounded-full"></div>
        <div className="space-y-2">
          <div className="h-6 w-40 bg-gray-200 rounded"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
      
      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
    </div>
  );
}

export default {
  ListingCardSkeleton,
  ListingGridSkeleton,
  StatCardSkeleton,
  TableRowSkeleton,
  ProfileSkeleton,
};

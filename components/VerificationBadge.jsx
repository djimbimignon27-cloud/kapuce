'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, Shield, XCircle, Clock } from 'lucide-react';

export function VerificationBadge({ user, size = 'md' }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  if (user.emailVerified && user.phoneVerified && user.identityVerified) {
    return (
      <Badge className={`bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg ${sizeClasses[size]}`}>
        <CheckCircle className="w-3 h-3 mr-1" />
        Vérifié
      </Badge>
    );
  }

  if (user.emailVerified || user.phoneVerified) {
    return (
      <Badge className={`bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-md ${sizeClasses[size]}`}>
        <Clock className="w-3 h-3 mr-1" />
        En cours
      </Badge>
    );
  }

  return (
    <Badge className={`bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0 ${sizeClasses[size]}`}>
      <XCircle className="w-3 h-3 mr-1" />
      Non vérifié
    </Badge>
  );
}

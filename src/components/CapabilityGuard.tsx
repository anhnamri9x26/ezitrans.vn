import React from 'react';
import { useCapability } from '@/hooks/useCapability';
import AccessDenied from './AccessDenied';

interface CapabilityGuardProps {
  capability: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function CapabilityGuard({
  capability,
  children,
  fallback = <AccessDenied />,
}: CapabilityGuardProps) {
  const { hasPermission, isLoading } = useCapability(capability);

  if (isLoading) {
    return (
      <div className="w-full min-h-[300px] flex flex-col justify-center items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-600/25 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-[11px] text-slate-400 font-semibold tracking-wider">Đang kiểm tra quyền hạn...</span>
      </div>
    );
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

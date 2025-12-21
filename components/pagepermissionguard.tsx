'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkUserPermissions } from '@/lib/checkuserpermissions';

interface PermissionGuardProps {
  roles: string[];
  children: React.ReactNode;
}

export default function PagePermissionGuard({ roles, children }: PermissionGuardProps) {
  const [status, setStatus] = useState<'loading' | 'forbidden' | 'allowed'>('loading');
  const router = useRouter();

  useEffect(() => {
    async function verify() {
      const isAllowed = await checkUserPermissions(roles);
      if (isAllowed) {
        setStatus('allowed');
      } else {
        setStatus('forbidden');
      }
    }
    verify();
  }, [roles]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-gray-500">Checking permissions...</div>
      </div>
    );
  }

  if (status === 'forbidden') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm text-center">
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p>You are not allowed to access this page.</p>
        </div>
        <button 
        //   onClick={() => router.push('/dashboard')}
          onClick={() => router.back()}
          className="text-blue-600 hover:underline text-base font-medium"
        >
          &larr; Return to Previous Page
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
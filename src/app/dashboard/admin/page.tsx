'use client';

import { useRole } from '@/context/RoleContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import UserManagement from '@/components/UserManagement';

export default function AdminPage() {
  const { role, isLoading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && role !== 'admin') {
      router.push('/dashboard');
    }
  }, [role, isLoading, router]);

  if (isLoading || role !== 'admin') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Panel de Administración</h1>
        <p className="text-sm text-gray-500">Supervisa accesos y gestiona los roles del personal.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100/50 shadow-sm">
        <UserManagement />
      </div>
    </div>
  );
}

'use client';

import DashboardShell from '@/components/DashboardShell';
import { RoleProvider } from '@/context/RoleContext';

export default function TestSidebarPage() {
  const mockProfile = {
    name: 'Dr. Test Assistant',
    email: 'test@example.com',
    role: 'admin'
  };

  return (
    <RoleProvider initialRole="admin">
      <DashboardShell profile={mockProfile} role="admin">
        <div className="p-8">
          <h1 className="text-2xl font-bold">Test Sidebar View</h1>
          <p className="text-gray-600 mt-2">Adjust window size and verify sidebar active item animation.</p>
        </div>
      </DashboardShell>
    </RoleProvider>
  );
}

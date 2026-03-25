import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import { RoleProvider } from '@/context/RoleContext';

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  try {
    await requireSuperAdmin(user.id);
  } catch (e) {
    redirect('/dashboard');
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  return (
    <RoleProvider initialRole="superadmin">
      <DashboardShell profile={profile} role="superadmin">
        {children}
      </DashboardShell>
    </RoleProvider>
  );
}

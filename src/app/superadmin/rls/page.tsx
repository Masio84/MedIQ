import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import { RoleProvider } from '@/context/RoleContext';
import RLSManager from '@/components/superadmin/rls/RLSManager';

export default async function RLSPoliciesPage() {
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <RoleProvider initialRole="superadmin">
      <DashboardShell profile={profile} role="superadmin">
        <div className="flex flex-col h-[calc(100vh-80px)]">
          <header className="p-4 sm:p-6 pb-0">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              RLS Policy Manager
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Gestión visual e interactiva de políticas de seguridad en la base de datos.
            </p>
          </header>

          <div className="flex-1 min-h-0">
            <RLSManager />
          </div>
        </div>
      </DashboardShell>
    </RoleProvider>
  );
}

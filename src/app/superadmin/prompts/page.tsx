import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import { RoleProvider } from '@/context/RoleContext';
import PromptManager from '@/components/superadmin/prompts/PromptManager';

export default async function SuperAdminPromptsPage() {
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
        <div className="p-4 sm:p-6 lg:p-8">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              Configuración de Prompts para Doctor AI
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Gestiona, personaliza y prueba los prompts del sistema y específicos para doctores.
            </p>
          </header>

          <PromptManager />
        </div>
      </DashboardShell>
    </RoleProvider>
  );
}

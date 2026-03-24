import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import AuditLogViewer from '@/components/audit/AuditLogViewer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DashboardShell from '@/components/DashboardShell';
import { RoleProvider } from '@/context/RoleContext';

export default async function SuperAdminLogsPage() {
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
        <div className="p-6 md:p-8 space-y-6 max-w-full lg:max-w-7xl mx-auto h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-gray-100 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <Link href="/superadmin" className="p-2 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                 <ArrowLeft size={16} className="text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Bitácora de Auditoría</h1>
                <p className="text-xs text-gray-400 font-medium">Logs globales de seguridad y movimientos (NOM-024)</p>
              </div>
            </div>
          </div>

          {/* Visor expandido */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
             <AuditLogViewer />
          </div>
        </div>
      </DashboardShell>
    </RoleProvider>
  );
}

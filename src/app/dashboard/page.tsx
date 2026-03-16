import { createClient } from '@/lib/supabase/server';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import AssistantDashboard from '@/components/dashboards/AssistantDashboard';
import DoctorDashboard from '@/components/dashboards/DoctorDashboard';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>No autenticado</div>;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role || 'assistant';

  let doctorsCount = 0;
  let assistantsCount = 0;
  let consultationsCount = 0;
  let usersCount = 0;

  if (role === 'admin') {
     const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
     const [d, a, c, u] = await Promise.all([
       supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'doctor'),
       supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'assistant'),
       supabaseAdmin.from('consultations').select('*', { count: 'exact', head: true }),
       supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true })
     ]);
     doctorsCount = d.count || 0;
     assistantsCount = a.count || 0;
     consultationsCount = c.count || 0;
     usersCount = u.count || 0;
  }

  return (
    <div>
      {role === 'admin' && (
        <AdminDashboard stats={{ doctorsCount: doctorsCount || 0, assistantsCount: assistantsCount || 0, consultationsCount: consultationsCount || 0, usersCount: usersCount || 0 }} />
      )}

      
      {role === 'doctor' && (
        <DoctorDashboard />
      )}

      {role === 'assistant' && (
        <AssistantDashboard />
      )}
    </div>
  );
}


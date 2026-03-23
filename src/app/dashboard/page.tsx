import { createClient } from '@/lib/supabase/server';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import AssistantDashboard from '@/components/dashboards/AssistantDashboard';
import { getProfile } from '@/lib/get-profile';
import DoctorDashboard from '@/components/dashboards/DoctorDashboard';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>No autenticado</div>;
  }

  const { data: profile } = await getProfile(user.id);

  const role = profile?.role;

  if (!role) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 text-sm">No se encontró un perfil asociado a tu cuenta. Contacta al administrador.</p>
      </div>
    );
  }

  let doctorsCount = 0;
  let assistantsCount = 0;
  let consultationsCount = 0;
  let usersCount = 0;

  let plan = null;

  if (role === 'admin') {
     const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
     const { getClinicPlan } = await import('@/lib/permissions');
     const clinicId = profile?.clinic_id;

     plan = await getClinicPlan(clinicId);

     const [d, a, c, u] = await Promise.all([
       supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'doctor').eq('clinic_id', clinicId),
       supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'assistant').eq('clinic_id', clinicId),
       supabaseAdmin.from('consultations').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId),
       supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId)
     ]);
     doctorsCount = d.count || 0;
     assistantsCount = a.count || 0;
     consultationsCount = c.count || 0;
     usersCount = u.count || 0;
  }

  return (
    <div>
      {role === 'admin' && (
        <AdminDashboard 
          profile={profile}
          plan={plan}
          stats={{ doctorsCount, assistantsCount, consultationsCount, usersCount }} 
        />
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


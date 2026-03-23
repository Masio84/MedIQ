import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import SuperAdminDashboard from '@/components/superadmin/SuperAdminDashboard';

export default async function SuperAdminPage() {
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

  // 1. Métricas Globales (Carga inicial del lado del servidor)
  const defaultMetrics = {
    totalClinics: 0,
    activeClinics: 0,
    suspendedClinics: 0,
    doctorCount: 0,
    assistantCount: 0,
    adminCount: 0,
    monthlyConsultations: 0,
    mrr: 0
  };

  try {
    const { count: totalClinics } = await supabase
      .from('clinics')
      .select('*', { count: 'exact', head: true });

    const { data: subsData } = await supabase
      .from('clinic_subscriptions')
      .select('status, plan_slug');

    const activeClinics = (subsData ?? []).filter(s => s.status === 'active').length;
    const suspendedClinics = (subsData ?? []).filter(s => s.status === 'suspended').length;

    const { data: profiles } = await supabase.from('profiles').select('role');
    const doctorCount = (profiles ?? []).filter(p => p.role === 'doctor').length;
    const assistantCount = (profiles ?? []).filter(p => p.role === 'assistant').length;
    const adminCount = (profiles ?? []).filter(p => p.role === 'admin').length;

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { count: monthlyConsultations } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth);

    // Estimación de MRR (suma de price_monthly)
    const { data: plans } = await supabase.from('plans').select('slug, price_monthly');
    let mrr = 0;
    if (subsData && plans) {
      subsData.forEach(sub => {
        if (sub.status === 'active') {
          const plan = plans.find(p => p.slug === sub.plan_slug);
          mrr += Number(plan?.price_monthly || 0);
        }
      });
    }

    const metrics = {
      totalClinics: totalClinics || 0,
      activeClinics,
      suspendedClinics,
      doctorCount,
      assistantCount,
      adminCount,
      monthlyConsultations: monthlyConsultations || 0,
      mrr
    };

    return (
      <div className="min-h-screen bg-gray-50/10">
        <SuperAdminDashboard serverMetrics={metrics} />
      </div>
    );
  } catch (error) {
    console.error('Superadmin page error:', error);
    return (
      <div className="min-h-screen bg-gray-50/10">
        <SuperAdminDashboard serverMetrics={defaultMetrics} />
      </div>
    );
  }
}

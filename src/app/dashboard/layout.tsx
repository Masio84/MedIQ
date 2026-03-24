import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RoleProvider } from '@/context/RoleContext';
import DashboardShell from '@/components/DashboardShell';
import { getProfile } from '@/lib/get-profile';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get User Profile for Role
  const { data: profile } = await getProfile(user.id);

  if (profile && profile.is_active === false) {
     redirect('/login?reason=account_disabled');
  }

  if (profile && profile.setup_completed === false) {
     redirect('/setup');
  }

  const role = profile?.role || 'assistant';
  const clinicId = profile?.clinic_id || null;
  const doctorId = profile?.doctor_id || null;

  return (
    <RoleProvider 
      initialRole={role as 'admin' | 'doctor' | 'assistant'}
      initialClinicId={clinicId}
      initialDoctorId={doctorId}
    >
      <DashboardShell profile={profile} role={role}>
        {children}
      </DashboardShell>
    </RoleProvider>
  );
}

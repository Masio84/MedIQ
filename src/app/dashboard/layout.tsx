import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LayoutDashboard, Users, FileText, CreditCard, LogOut } from 'lucide-react';
import { RoleProvider } from '@/context/RoleContext';
import SidebarLinks from '@/components/SidebarLinks';

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
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const role = profile?.role || 'assistant';
  const clinicId = profile?.clinic_id || null;
  const doctorId = profile?.doctor_id || null;

  return (
    <RoleProvider 
      initialRole={role as 'admin' | 'doctor' | 'assistant'}
      initialClinicId={clinicId}
      initialDoctorId={doctorId}
    >
      <div className="flex h-screen bg-gray-100 text-gray-900">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full">
          <div className="p-6 border-b border-gray-100">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image 
                src="/logo.png" 
                alt="AssistMed AI" 
                width={140} 
                height={40} 
                className="object-contain"
                priority
              />
            </Link>
          </div>
          <div className="p-5 border-b border-gray-100 bg-gray-50/20 flex flex-col items-center text-center space-y-3 relative group">

            {profile?.avatar_url ? (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md ring-2 ring-gray-100/50 transition-transform duration-300 group-hover:scale-105">
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-black text-xl shadow-inner border border-gray-100">
                {profile?.name ? profile.name[0].toUpperCase() : '?'}
              </div>
            )}

            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent tracking-tight">
                {profile?.name || user.email}
              </p>
              
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-full inline-block">
                {role === 'admin' ? 'Administrador' : role === 'doctor' ? 'Doctor' : 'Asistente'}
              </span>

              {profile?.medical_license && (
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                  Cédula: <span className="text-gray-600 font-semibold">{profile.medical_license}</span>
                </p>
              )}
            </div>
          </div>

          <SidebarLinks />

          {/* Legal Link or Footer in Sidebar */}
          <div className="p-4 border-t border-gray-50 text-center mt-auto">
            <Link href="/legal" className="text-xs text-gray-400 hover:text-gray-900 transition-colors">
              Aviso Legal
            </Link>
          </div>

          {/* Logout Button Section at Bottom */}
          <div className="p-3 border-t border-gray-100 bg-gray-50/50">
            <Link href="/auth/signout" className="flex items-center justify-center gap-2 py-2 px-3 w-full hover:bg-red-50/80 rounded-lg text-gray-500 hover:text-red-600 transition-all font-semibold text-xs border border-transparent hover:border-red-100">
              <LogOut size={14} />
              Cerrar Sesión
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
            <h2 className="text-sm font-medium text-gray-400">Sistema Beta AssistMed AI</h2>
            {profile?.avatar_url && (
              <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              </div>
            )}
          </header>

          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </RoleProvider>
  );
}


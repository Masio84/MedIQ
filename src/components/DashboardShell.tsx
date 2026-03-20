'use client';

import { useState, useEffect } from 'react';
import { Menu, X, LogOut, Calendar, Clock, DollarSign } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import SidebarLinks from '@/components/SidebarLinks';

export default function DashboardShell({
  children,
  profile,
  role,
}: {
  children: React.ReactNode;
  profile: any;
  role: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ earnedToday: 0, appointmentsToday: 0 });
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {

    const fetchStats = async () => {
      setLoadingStats(true);
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const todayStr = today.toISOString().split('T')[0];

      try {
        const { data: billings } = await supabase
          .from('billing')
          .select('normal_fee, discount, extra_charge')
          .eq('paid', true)
          .gte('created_at', startOfToday);

        const earned = billings?.reduce(
          (acc: number, b: any) => acc + (Number(b.normal_fee) + Number(b.extra_charge) - Number(b.discount)),
          0
        ) || 0;

        const filterDoctorId = role === 'doctor' ? profile?.id : profile?.doctor_id;
        
        let appointmentsQuery = supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('date', todayStr);

        if (filterDoctorId) {
          appointmentsQuery = appointmentsQuery.eq('doctor_id', filterDoctorId);
        }

        const { count } = await appointmentsQuery;

        setStats({ earnedToday: earned, appointmentsToday: count || 0 });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [role, profile?.id]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'Buenos días';
    if (hour >= 12 && hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getFormattedDate = () => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const today = new Date();
    return `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]}`;
  };

  const getFormattedTime = () => {
    const today = new Date();
    const hour24 = today.getHours();
    const min = String(today.getMinutes()).padStart(2, '0');
    const ampm = hour24 >= 12 ? 'P.M.' : 'A.M.';
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${min} ${ampm}`;
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900 overflow-hidden relative">
      {/* Sidebar - Desktop & Mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col h-full transform 
        md:relative md:translate-x-0 transition-transform duration-300 ease-in-out shadow-lg md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between md:justify-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image 
              src="/logo_v1.png" 
              alt="MedIQ" 
              width={140} 
              height={40} 
              className="object-contain"
              priority
            />
          </Link>
          <button 
            className="p-1 rounded-lg text-gray-400 hover:bg-gray-50 md:hidden"
            onClick={toggleSidebar}
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <SidebarLinks />

        {/* Footer/Aviso Legal */}
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


      {/* Backdrop for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/25 backdrop-blur-sm z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-50/80 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              className="p-2 -ml-2 rounded-lg text-gray-400 hover:bg-gray-50 md:hidden"
              onClick={toggleSidebar}
            >
              <Menu size={22} />
            </button>
            {role === 'doctor' || role === 'assistant' ? (
              <div className="flex items-center gap-2">
                {profile?.avatar_url ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100">
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-xs border border-gray-100">
                    {profile?.name ? profile.name[0].toUpperCase() : '?'}
                  </div>
                )}
                <h2 className="text-sm font-semibold text-gray-800">
                  {getGreeting()}, {
                    role === 'doctor' 
                    ? (profile?.name && (profile.name.toLowerCase().trim().startsWith('dr.') || profile.name.toLowerCase().trim().startsWith('dr ') || profile.name.toLowerCase().trim().startsWith('dra.') || profile.name.toLowerCase().trim().startsWith('dra ')) ? profile.name : `Dr. ${profile?.name || 'Médico'}`)
                    : (profile?.name || 'Asistente')
                  }
                </h2>
              </div>
            ) : (
              <h2 className="text-xs font-medium text-gray-400">Sistema Beta MedIQ</h2>
            )}
          </div>

          <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2">
                <div className="bg-gray-50/80 px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-2 shadow-sm h-11">
                  <Calendar size={16} className="text-blue-500" />
                  <div className="flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Consultas</span>
                    <span className="text-sm font-black text-gray-800 leading-none">{stats.appointmentsToday}</span>
                  </div>
                </div>

                <div className="bg-gray-50/80 px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-2 shadow-sm h-11">
                  <Clock size={16} className="text-emerald-500" />
                  <div className="flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Hoy</span>
                    <span className="text-sm font-black text-gray-800 leading-none">
                      {getFormattedDate()} {getFormattedTime()}
                    </span>
                  </div>
                </div>

                {role !== 'admin' && (
                  <div className="bg-gray-50/80 px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-2 shadow-sm h-11">
                    <DollarSign size={16} className="text-amber-500" />
                    <div className="flex flex-col justify-center">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Recaudado</span>
                      <span className="text-sm font-black text-gray-900 leading-none">${stats.earnedToday.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

            {profile?.avatar_url && role !== 'doctor' && role !== 'assistant' && (
              <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100">
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}


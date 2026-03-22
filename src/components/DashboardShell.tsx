'use client';

import { useState, useEffect } from 'react';
import { Menu, X, LogOut, Calendar, Clock, DollarSign } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import SidebarLinks from '@/components/SidebarLinks';
import SidebarChat from '@/components/SidebarChat';

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
  const [weatherTemp, setWeatherTemp] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Coordenadas para Aguascalientes, México (basado en prefijos) o CDMX
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=21.8853&longitude=-102.2916&current_weather=true');
        const data = await res.json();
        if (data?.current_weather?.temperature) {
          setWeatherTemp(Math.round(data.current_weather.temperature));
        } else {
          setWeatherTemp(24); // Fallback discreto
        }
      } catch (error) {
        setWeatherTemp(24);
      }
    };
    fetchWeather();
  }, []);
  const [onlineDoctors, setOnlineDoctors] = useState(0);
  const [onlineAssistants, setOnlineAssistants] = useState(0);
  const [doctorNames, setDoctorNames] = useState<string[]>([]);
  const [assistantNames, setAssistantNames] = useState<string[]>([]);
  const [doctorAppts, setDoctorAppts] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {

    const fetchStats = async () => {
      setLoadingStats(true);
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const localToday = new Date();
      const todayStr = `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, '0')}-${String(localToday.getDate()).padStart(2, '0')}`;

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
        
        let consultationsData: any[] = [];
        try {
          const res = await fetch('/api/consultations/list');
          const result = await res.json();
          if (result?.success && Array.isArray(result.data)) {
             consultationsData = result.data.filter((c: any) => c.created_at >= startOfToday);
          }
        } catch (e) {
          console.error('Error fetching consultations for header:', e);
        }
        
        const totalAppointments = consultationsData?.length || 0;

        let appointees = null;
        if (role === 'admin') {
          const { data } = await supabase
            .from('appointments')
            .select('doctor_id')
            .eq('date', todayStr);
          appointees = data;
        }

        // Group appointments breakdown
        const counts: { [key: string]: number } = {};
        if (appointees) {
          appointees.forEach((a: any) => {
            if (a.doctor_id) counts[a.doctor_id] = (counts[a.doctor_id] || 0) + 1;
          });
        }

        const doctorIds = Object.keys(counts);
        const breakdown: { name: string; count: number }[] = [];

        if (doctorIds.length > 0) {
          const { data: docs } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', doctorIds);

          if (docs) {
            docs.forEach((d: any) => {
              breakdown.push({ name: d.name, count: counts[d.id] });
            });
          }
        }

        setDoctorAppts(breakdown);
        setStats({ earnedToday: earned, appointmentsToday: totalAppointments });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [role, profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;

    let channel: any;

    const setupPresence = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      channel = supabase.channel('online-users', {
        config: { presence: { key: profile.id } }
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          let dCount = 0;
          let aCount = 0;
          const dNames: string[] = [];
          const aNames: string[] = [];
          
          Object.values(state).forEach((presenceEvents: any) => {
            const p = presenceEvents?.[0];
            if (p?.role === 'doctor') {
              dCount++;
              if (p.name) dNames.push(p.name);
            }
            if (p?.role === 'assistant') {
              aCount++;
              if (p.name) aNames.push(p.name);
            }
          });

          setOnlineDoctors(dCount);
          setOnlineAssistants(aCount);
          setDoctorNames(dNames);
          setAssistantNames(aNames);
        })
        .subscribe(async (status: any) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              id: profile.id,
              role: role,
              name: profile.name
            });
          }
        });
    };

    setupPresence();

    return () => {
      if (channel) {
        // Safe channel removal
        const remove = async () => {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          supabase.removeChannel(channel);
        };
        remove();
      }
    };
  }, [profile?.id, role, profile?.name]);

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

        {/* Dynamic Chat de Comunicación */}
        <SidebarChat profile={profile} role={role} />

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
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium text-gray-800 leading-tight">
                      {getGreeting()}, {
                        role === 'doctor' 
                        ? (profile?.name && (profile.name.toLowerCase().trim().startsWith('dr.') || profile.name.toLowerCase().trim().startsWith('dr ') || profile.name.toLowerCase().trim().startsWith('dra.') || profile.name.toLowerCase().trim().startsWith('dra ')) ? profile.name : `Dr. ${profile?.name || 'Médico'}`)
                        : (profile?.name || (role === 'admin' ? 'Administrador' : 'Asistente'))
                      }
                    </h2>
                    {role === 'doctor' && (
                      <span className="text-[10px] font-medium px-2 py-0.5" style={{ backgroundColor: '#E8F0FB', color: '#1A4A8A', borderRadius: '6px' }}>Doctor</span>
                    )}
                    {role === 'assistant' && (
                      <span className="text-[10px] font-medium px-2 py-0.5" style={{ backgroundColor: '#E6F5F0', color: '#0F6E56', borderRadius: '6px' }}>Asistente</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium flex items-center gap-1 mt-0.5 ${
                    role === 'doctor' ? 'text-blue-600' : role === 'assistant' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    <span>🌤️ {weatherTemp || '--'}°C despejado</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-400 font-medium">
                      {role === 'doctor' ? '¡Excelente día para consultas!' : role === 'assistant' ? '¡Organización al día!' : '¡Gestión de hoy en orden!'}
                    </span>
                  </span>
                </div>
              </div>
          </div>

          <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2">
                <div className="group relative bg-gray-50/80 px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-2 shadow-sm h-11 hover:bg-gray-100/50 cursor-pointer transition-colors">
                  <Calendar size={16} className="text-blue-500" />
                  <div className="flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Consultas</span>
                    <span className="text-sm font-black text-gray-800 leading-none">{stats.appointmentsToday}</span>
                  </div>

                  {/* Tooltip appointments breakdown for Admins only */}
                  {role === 'admin' && (
                    <div className="absolute top-12 left-0 bg-gray-900/90 backdrop-blur-sm p-1.5 rounded-lg shadow-md text-white z-50 min-w-[150px] hidden group-hover:block border border-gray-800/20 animate-in fade-in-0 zoom-in-95 duration-100">
                      <p className="text-[9px] font-bold text-gray-400 border-b border-gray-800/30 pb-0.5 mb-1">Citas por Doctor:</p>
                      <div className="space-y-0.5">
                        {doctorAppts.length === 0 ? (
                          <p className="text-[11px] text-gray-500">Sin citas hoy</p>
                        ) : (
                          doctorAppts.map((da, i) => (
                            <p key={i} className="text-[11px] font-medium tracking-tight text-gray-100 flex items-center justify-between gap-2">
                              <span>{da.name}</span>
                              <span className="font-bold text-blue-400">{da.count}</span>
                            </p>
                          ))
                        )}
                      </div>
                    </div>
                  )}
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

                {role === 'admin' && (
                  <>
                    <div className="group relative bg-gray-50/80 px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-2 shadow-sm h-11 hover:bg-gray-100/50 cursor-pointer transition-colors">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <div className="flex flex-col justify-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Doctores en línea</span>
                        <span className="text-sm font-black text-gray-800 leading-none">{onlineDoctors}</span>
                      </div>
                      
                      {/* Tooltip list names on hover */}
                      <div className="absolute top-12 left-0 bg-gray-900/90 backdrop-blur-sm p-1.5 rounded-lg shadow-md text-white z-50 min-w-[120px] hidden group-hover:block border border-gray-800/20 animate-in fade-in-0 zoom-in-95 duration-100">
                        <p className="text-[9px] font-bold text-gray-400 border-b border-gray-800/30 pb-0.5 mb-1">Doctores Conectados:</p>
                        <div className="space-y-0.5">
                          {doctorNames.length === 0 ? (
                            <p className="text-[11px] text-gray-500">Sin usuarios</p>
                          ) : (
                            doctorNames.map((name, i) => (
                              <p key={i} className="text-[11px] font-medium tracking-tight text-gray-100 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                                {name}
                              </p>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="group relative bg-gray-50/80 px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-2 shadow-sm h-11 hover:bg-gray-100/50 cursor-pointer transition-colors">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <div className="flex flex-col justify-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Asistentes en línea</span>
                        <span className="text-sm font-black text-gray-800 leading-none">{onlineAssistants}</span>
                      </div>

                      {/* Tooltip list names on hover */}
                      <div className="absolute top-12 left-0 bg-gray-900/90 backdrop-blur-sm p-1.5 rounded-lg shadow-md text-white z-50 min-w-[120px] hidden group-hover:block border border-gray-800/20 animate-in fade-in-0 zoom-in-95 duration-100">
                        <p className="text-[9px] font-bold text-gray-400 border-b border-gray-800/30 pb-0.5 mb-1">Asistentes Conectados:</p>
                        <div className="space-y-0.5">
                          {assistantNames.length === 0 ? (
                            <p className="text-[11px] text-gray-500">Sin usuarios</p>
                          ) : (
                            assistantNames.map((name, i) => (
                              <p key={i} className="text-[11px] font-medium tracking-tight text-gray-100 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-blue-400" />
                                {name}
                              </p>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </>
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


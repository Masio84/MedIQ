'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  const supabase = useMemo(() => createClient(), []);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMini, setIsMini] = useState(false);

  const [stats, setStats] = useState({ earnedToday: 0, appointmentsToday: 0 });
  const [weatherTemp, setWeatherTemp] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [onlineDoctors, setOnlineDoctors] = useState(0);
  const [onlineAssistants, setOnlineAssistants] = useState(0);
  const [onlineAdmins, setOnlineAdmins] = useState(0);
  const [doctorNames, setDoctorNames] = useState<string[]>([]);
  const [assistantNames, setAssistantNames] = useState<string[]>([]);
  const [adminNames, setAdminNames] = useState<string[]>([]);
  const [doctorAppts, setDoctorAppts] = useState<{ name: string; count: number }[]>([]);
  const [hasLinkedAssistant, setHasLinkedAssistant] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=21.8853&longitude=-102.2916&current_weather=true');
        const data = await res.json();
        if (data?.current_weather?.temperature) {
          setWeatherTemp(Math.round(data.current_weather.temperature));
        } else {
          setWeatherTemp(24);
        }
      } catch (error) {
        setWeatherTemp(24);
      }
    };
    fetchWeather();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // Mini sidebar for tablets (between 768 and 1280)
      if (width >= 768 && width < 1280) {
        setIsMini(true);
      } else {
        setIsMini(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

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

        let consultationsData: any[] = [];
        try {
          const res = await fetch('/api/consultations/list');
          if (res.ok) {
            const result = await res.json();
            if (result?.success && Array.isArray(result.data)) {
               consultationsData = result.data.filter((c: any) => c.created_at >= startOfToday);
            }
          } else {
            console.warn('API consultations returned non-ok status:', res.status);
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
    const checkAssistantLink = async () => {
      if (!profile?.id) return;
      
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      if (role === 'doctor') {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', profile.id)
          .eq('role', 'assistant');
        setHasLinkedAssistant(!!count && count > 0);
      } else if (role === 'assistant' || role === 'superadmin') {
        setHasLinkedAssistant(true);
      } else {
        setHasLinkedAssistant(false);
      }
    };
    
    checkAssistantLink();
  }, [profile?.id, role]);

  useEffect(() => {
    if (!profile?.id) return;

    let channel: any;
    const setupPresence = async () => {
      channel = supabase.channel('online-users', {
        config: { presence: { key: profile.id } }
      });
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          let dCount = 0;
          let aCount = 0;
          let admCount = 0;
          const dNames: string[] = [];
          const aNames: string[] = [];
          const admNames: string[] = [];
          
          Object.values(state).forEach((presenceEvents: any) => {
            const p = presenceEvents?.[0];
            if (p?.role === 'doctor') {
              dCount++;
              if (p.name) dNames.push(p.name);
            } else if (p?.role === 'assistant') {
              aCount++;
              if (p.name) aNames.push(p.name);
            } else if (p?.role === 'admin' || p?.role === 'superadmin') {
              admCount++;
              if (p.name) admNames.push(p.name);
            }
          });

          setOnlineDoctors(dCount);
          setOnlineAssistants(aCount);
          setOnlineAdmins(admCount);
          setDoctorNames(dNames);
          setAssistantNames(aNames);
          setAdminNames(admNames);
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
        supabase.removeChannel(channel);
      }
    };
  }, [profile?.id, role, profile?.name, supabase]);

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
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ease-in-out shadow-sm ${
        isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
      } ${
        isMini ? 'md:w-[72px]' : 'md:w-64'
      }`}>
        <div className={`transition-all duration-500 border-b border-gray-50 bg-white flex items-center justify-center ${
          isMini ? 'p-2 h-16' : 'p-6 h-32'
        }`}>
          <Link href="/dashboard" className="flex items-center justify-center w-full group">
            <div className={`relative transition-all duration-500 ease-in-out flex-shrink-0 ${
              isMini ? 'w-12 h-12' : 'w-44 h-24'
            }`}>
              <Image 
                src="/logo.png" 
                alt="MedIQ Logo" 
                fill 
                sizes={isMini ? "48px" : "176px"} 
                className="object-contain transition-transform duration-500 group-hover:scale-105" 
                priority 
              />
            </div>
          </Link>
          {!isMini && (
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-gray-50 rounded-lg text-gray-500 absolute right-4">
              <X size={20} />
            </button>
          )}
        </div>

        <SidebarLinks isMini={isMini} />

        <div className={`p-4 border-t border-gray-50 space-y-2 ${isMini ? 'flex flex-col items-center' : ''}`}>
          <Link 
            href="/auth/signout" 
            title={isMini ? "Cerrar Sesión" : undefined}
            className={`w-full flex items-center text-sm font-medium text-red-600 hover:bg-red-50 p-3 rounded-xl transition-all group ${
              isMini ? 'justify-center p-2' : 'gap-3'
            }`}
          >
            <div className={`flex items-center justify-center p-2 rounded-lg bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors`}>
              <LogOut size={18} />
            </div>
            {!isMini && <span>Cerrar Sesión</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 -ml-2 rounded-lg text-gray-400 hover:bg-gray-50"
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
                      <span className="text-[10px] font-medium px-2 py-0.5" style={{ backgroundColor: '#E8F0FB', color: '#1A4A8A', borderRadius: '6px' }}>Médico</span>
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

          <div className="flex-1 flex justify-end">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 max-w-[calc(100vw-180px)] md:max-w-none">
                <div className="group relative bg-gray-50/80 px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-2 shadow-sm h-11 hover:bg-gray-100/50 cursor-pointer transition-colors">
                  <Calendar size={16} className="text-blue-500" />
                  <div className="flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Consultas</span>
                    <span className="text-sm font-black text-gray-800 leading-none">{stats.appointmentsToday}</span>
                  </div>

                  {(role === 'admin' || role === 'superadmin') && (
                    <div className="absolute top-12 left-0 bg-gray-900/90 backdrop-blur-sm p-1.5 rounded-lg shadow-md text-white z-50 min-w-[150px] hidden group-hover:block border border-gray-800/20 animate-in fade-in-0 zoom-in-95 duration-100">
                      <p className="text-[9px] font-bold text-gray-400 border-b border-gray-800/30 pb-0.5 mb-1">Citas por Médico:</p>
                      <div className="space-y-0.5">
                        {!Array.isArray(doctorAppts) || doctorAppts.length === 0 ? (
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

                {(role === 'admin' || role === 'superadmin') && (
                  <>
                    <div className="group relative bg-gray-50/80 px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-2 shadow-sm h-11 hover:bg-gray-100/50 cursor-pointer transition-colors">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <div className="flex flex-col justify-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Médicos en línea</span>
                        <span className="text-sm font-black text-gray-800 leading-none">{onlineDoctors}</span>
                      </div>
                      
                      <div className="absolute top-12 left-0 bg-gray-900/90 backdrop-blur-sm p-1.5 rounded-lg shadow-md text-white z-50 min-w-[120px] hidden group-hover:block border border-gray-800/20 animate-in fade-in-0 zoom-in-95 duration-100">
                        <p className="text-[9px] font-bold text-gray-400 border-b border-gray-800/30 pb-0.5 mb-1">Médicos Conectados:</p>
                        <div className="space-y-0.5">
                          {!Array.isArray(doctorNames) || doctorNames.length === 0 ? (
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

                      <div className="absolute top-12 left-0 bg-gray-900/90 backdrop-blur-sm p-1.5 rounded-lg shadow-md text-white z-50 min-w-[120px] hidden group-hover:block border border-gray-800/20 animate-in fade-in-0 zoom-in-95 duration-100">
                        <p className="text-[9px] font-bold text-gray-400 border-b border-gray-800/30 pb-0.5 mb-1">Asistentes Conectados:</p>
                        <div className="space-y-0.5">
                          {!Array.isArray(assistantNames) || assistantNames.length === 0 ? (
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

                    <div className="group relative bg-gray-50/80 px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-2 shadow-sm h-11 hover:bg-gray-100/50 cursor-pointer transition-colors">
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      <div className="flex flex-col justify-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Administradores en línea</span>
                        <span className="text-sm font-black text-gray-800 leading-none">{onlineAdmins}</span>
                      </div>

                      <div className="absolute top-12 left-0 bg-gray-900/90 backdrop-blur-sm p-1.5 rounded-lg shadow-md text-white z-50 min-w-[120px] hidden group-hover:block border border-gray-800/20 animate-in fade-in-0 zoom-in-95 duration-100">
                        <p className="text-[9px] font-bold text-gray-400 border-b border-gray-800/30 pb-0.5 mb-1">Administradores Conectados:</p>
                        <div className="space-y-0.5">
                          {!Array.isArray(adminNames) || adminNames.length === 0 ? (
                            <p className="text-[11px] text-gray-500">Sin usuarios</p>
                          ) : (
                            adminNames.map((name, i) => (
                              <p key={i} className="text-[11px] font-medium tracking-tight text-gray-100 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-purple-400" />
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
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
        
        {/* Chat Flotante: Solo visible si hay asistente vinculado o es rol asistente */}
        {hasLinkedAssistant && (
           <SidebarChat profile={profile} role={role} />
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, UserPlus, Users, Calendar, DollarSign, Loader2, ChevronLeft, ChevronRight, Clock, FileText, X } from 'lucide-react';
import PatientForm from '@/components/PatientForm';
import { useRole } from '@/context/RoleContext';
import { toast } from 'sonner';

export default function DoctorDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [todayPatients, setTodayPatients] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [activePatients, setActivePatients] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [filter, setFilter] = useState<'today' | 'weekly' | 'range'>('today');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Detalle de Cita Modal States
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const { role } = useRole();

  // Weekly Calendar States
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekAppointments, setWeekAppointments] = useState<any[]>([]);
  const [calendarView, setCalendarView] = useState<'mes' | 'semana'>('semana');
  const [selectedDateString, setSelectedDateString] = useState<string | null>(null);
  
  // Plan & Assistant Status
  const [plan, setPlan] = useState<string | null>(null);
  const [linkedAssistant, setLinkedAssistant] = useState<any>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const supabase = useMemo(() => createClient(), []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const weekDays = useMemo(() => {
    const anchor = currentDate;
    const dow = anchor.getDay();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() - dow + i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { dayStr: ds, dayNum: d.getDate(), month: d.getMonth() };
    });
  }, [currentDate]);

  const changeWeek = (val: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + val * 7);
    setCurrentDate(d);
  };

  const changeMonth = (val: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + val);
    setCurrentDate(d);
    setSelectedDateString(null);
  };

  const handleDayClick = (day: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDateString(dayStr);
    setCurrentDate(new Date(dayStr + 'T00:00:00')); // Actualizar el ancla semanal
  };

  // Search autocomplete
  useEffect(() => {
    const searchPatients = async () => {
      if (searchTerm.trim() === '') {
        setSearchResults([]);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setSearching(true);
      const { data } = await supabase
        .from('patients')
        .select('id, name')
        .eq('doctor_id', user.id)
        .or(`name.ilike.%${searchTerm}%`);
      setSearchResults(Array.isArray(data) ? data : []);
      setSearching(false);
    };

    const timeoutId = setTimeout(searchPatients, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, supabase]);

  // Fetch data
  const fetchData = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];

    // Fetch monthly range for sidebar calendar & grid consistency
    const startCount = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
    const endCount = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch Profile/Plan and Assistant
    const [profileRes, assistantRes] = await Promise.all([
      supabase.from('profiles').select('plan_assigned').eq('id', user.id).single(),
      supabase.from('profiles').select('id, name, email').eq('doctor_id', user.id).eq('role', 'assistant').single()
    ]);

    if (profileRes.data) setPlan(profileRes.data.plan_assigned);
    if (assistantRes.data) setLinkedAssistant(assistantRes.data);

    // 2. Fetch Billing according to filter (Only paid ones)
    let query = supabase.from('billing')
      .select('normal_fee, discount, extra_charge, created_at')
      .eq('doctor_id', user.id)
      .eq('paid', true);
    
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);

    if (filter === 'today') {
      query = query.gte('created_at', startOfToday.toISOString());
    } else if (filter === 'weekly') {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      query = query.gte('created_at', lastWeek.toISOString());
    } else if (filter === 'range' && dateRange.start && dateRange.end) {
      query = query.gte('created_at', dateRange.start).lte('created_at', dateRange.end);
    }

    const [todayResult, pCountResult, bCountResult, billingsResult, apptsResult] = await Promise.all([
      supabase.from('consultations')
        .select('id, patient_id, created_at, status, patients!consultations_patient_id_fkey(name)')
        .eq('doctor_id', user.id)
        .gte('created_at', today),
      supabase.from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', user.id),
      supabase.from('billing')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', user.id)
        .eq('paid', false),
      query,
      fetch(`/api/appointments/list?date_from=${startCount}&date_to=${endCount}`).then(res => res.json())
    ]);

    if (todayResult.data) setTodayPatients(todayResult.data);
    if (pCountResult.count !== null) setActivePatients(pCountResult.count);
    if (bCountResult.count !== null) setPendingPayments(bCountResult.count);
    if (apptsResult.success && apptsResult.data) setWeekAppointments(apptsResult.data);
    
    if (billingsResult.data) {
      const total = billingsResult.data.reduce(
        (acc: number, b: any) => acc + (Number(b.normal_fee) + Number(b.extra_charge) - Number(b.discount)),
        0
      );
      setTotalEarned(total);
      setConsultations(billingsResult.data);
    }
  }, [filter, dateRange, supabase, currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Top Search Bar (Removed top Nuevo Paciente button to move to bottom) */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Buscar paciente por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-[0.5px] border-black/8 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white text-black text-sm"
          />
          {searching && (
            <div className="absolute right-3 top-2.5">
              <Loader2 size={18} className="animate-spin text-gray-400" />
            </div>
          )}
          
          {/* Suggestions Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border-[0.5px] border-black/8 rounded-xl shadow-lg">
              {Array.isArray(searchResults) && searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    window.location.href = `/dashboard/consultations?patient_id=${p.id}`;
                    setSearchTerm('');
                    setSearchResults([]);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-900 border-b-[0.5px] border-black/8 last:border-0"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3 Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Consultas Hoy */}
        <div className="bg-white border-[0.5px] border-black/8 rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Consultas hoy</span>
          <span className="text-3xl font-medium" style={{ color: '#1A4A8A' }}>{todayPatients.length}</span>
        </div>
        {/* Pacientes Activos */}
        <div className="bg-white border-[0.5px] border-black/8 rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Pacientes activos</span>
          <span className="text-3xl font-medium text-gray-900">{activePatients}</span>
        </div>
        {/* Pendientes de Pago */}
        <div className="bg-white border-[0.5px] border-black/8 rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <span className="text-xs font- medium text-gray-500 uppercase tracking-wider mb-2">Pendientes de pago</span>
          <span className="text-3xl font-medium" style={{ color: '#854F0B' }}>{pendingPayments}</span>
        </div>
      </div>

      {/* Side-by-Side full Agenda View Layout similar to AgendaPage */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        
        {/* ─── LEFT SIDEBAR ─── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border-[0.5px] border-black/8 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-900">{monthNames[month]} {year}</span>
              <div className="flex gap-0.5">
                <button onClick={() => changeMonth(-1)} className="p-1 rounded-lg hover:bg-gray-50 text-gray-500"><ChevronLeft size={15} /></button>
                <button onClick={() => changeMonth(1)} className="p-1 rounded-lg hover:bg-gray-50 text-gray-500"><ChevronRight size={15} /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center mb-1">
              {['D','L','M','M','J','V','S'].map((d, i) => (
                <div key={i} className="text-[10px] font-bold text-gray-400">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDayIndex }).map((_, i) => <div key={`b-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasCitas = weekAppointments.some(a => a.date === dayStr);
                const isToday = dayStr === todayStr;
                const isSelected = dayStr === selectedDateString;
                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className="h-7 w-full flex flex-col items-center justify-center rounded-lg text-xs font-bold relative transition-all"
                    style={isToday ? { backgroundColor: '#1A4A8A', color: '#fff' } : isSelected ? { border: '1.5px solid #1A4A8A', color: '#1A4A8A' } : { color: '#374151' }}
                  >
                    {day}
                    {hasCitas && !isToday && (
                      <div className="w-1 h-1 rounded-full absolute bottom-0.5" style={{ backgroundColor: '#0F6E56' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
            {(['mes', 'semana'] as const).map(view => (
              <button
                key={view}
                onClick={() => setCalendarView(view)}
                className="flex-1 py-2 text-xs font-bold transition-colors"
                style={calendarView === view ? { backgroundColor: '#1A4A8A', color: '#fff' } : { color: '#6b7280' }}
              >
                {view === 'mes' ? 'Día' : 'Semana'}
              </button>
            ))}
          </div>

          {/* Citas del Día */}
          <div className="bg-white rounded-xl border-[0.5px] border-black/8 shadow-sm p-4 flex flex-col max-h-[300px] space-y-2">
            <h3 className="text-xs font-bold text-gray-900 mb-2 border-b border-black/8 pb-2 flex items-center justify-between">
              Citas del día {new Date((selectedDateString || todayStr) + 'T00:00:00').getDate()}
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[9px]">
                {weekAppointments.filter(a => a.date === (selectedDateString || todayStr) && a.status !== 'cancelled').length}
              </span>
            </h3>
            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {weekAppointments
                .filter(a => a.date === (selectedDateString || todayStr) && a.status !== 'cancelled')
                .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
                .map(appt => {
                   let style = { bg: '#E8F0FB', border: '#1A4A8A', text: '#1A4A8A' };
                   const status = appt.status || appt.appointment_type;
                   if (status === 'attended') style = { bg: '#E1F5EE', border: '#0F6E56', text: '#0F6E56' };
                   if (status === 'follow_up') style = { bg: '#FAEEDA', border: '#854F0B', text: '#854F0B' };
                   
                   return (
                     <div key={appt.id} onClick={() => { setSelectedAppt(appt); setIsDetailModalOpen(true); }} className="flex gap-2 p-2 rounded-lg border-[0.5px] border-black/8 hover:bg-gray-50 cursor-pointer items-center">
                       <div className="text-[10px] font-black text-gray-500 w-10 shrink-0 text-center">{(appt.start_time || appt.time || '').substring(0, 5)}</div>
                       <div className="w-1 h-full rounded-full shrink-0" style={{ backgroundColor: style.border }} />
                       <div className="min-w-0 flex-1">
                         <div className="text-xs font-bold text-gray-900 truncate">{appt.patients?.name || appt.patient_name || 'Paciente'}</div>
                         <div className="text-[9px] text-gray-500 truncate">{appt.notes || 'Consulta'}</div>
                       </div>
                     </div>
                   );
              })}
              {weekAppointments.filter(a => a.date === (selectedDateString || todayStr) && a.status !== 'cancelled').length === 0 && (
                 <p className="text-xs text-gray-400 text-center py-4">Sin citas agendadas</p>
              )}
            </div>
          </div>

          {/* Botones de acción rápida en tarjeta */}
          <div className="bg-white rounded-xl border-[0.5px] border-black/8 shadow-sm p-4 space-y-2">
            <p className="text-xs font-bold text-gray-700 mb-2">Acciones Rápidas</p>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.href = '/dashboard/consultations'}
                className="w-full py-2.5 bg-gray-900 border-[0.5px] border-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors shadow-sm">
                Nueva consulta
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full py-2.5 bg-white border-[0.5px] border-black/8 text-gray-900 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm">
                Nuevo paciente
              </button>
            </div>
          </div>

          {/* Gestión de Asistente (Solo para Plan Consultorio) */}
          {(plan === 'consultorio' || plan === 'enterprise') && (
            <div className="bg-white rounded-xl border-[0.5px] border-black/8 shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} className="text-blue-600" />
                <p className="text-xs font-bold text-gray-700">Mi Asistente</p>
              </div>
              
              {linkedAssistant ? (
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100/50">
                  <p className="text-[11px] font-bold text-blue-900">{linkedAssistant.name || 'Asistente Vinculado'}</p>
                  <p className="text-[10px] text-blue-600/70 truncate">{linkedAssistant.email || 'Sin correo'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-500 leading-tight">Tu plan permite un asistente. Invíta a alguien para empezar a colaborar.</p>
                  <button 
                    onClick={() => setInviting(true)}
                    className="w-full py-2 border border-dashed border-blue-300 text-blue-600 rounded-lg text-[10px] font-black hover:bg-blue-50 transition-all flex items-center justify-center gap-1">
                    <UserPlus size={12} />
                    Invitar Asistente
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── RIGHT PANEL ─── */}
        {calendarView === 'semana' ? (
          <div className="bg-white border-[0.5px] border-black/8 rounded-xl p-6 shadow-sm overflow-hidden h-full max-h-[600px]">
            <div className="flex items-center justify-between mb-4 border-b pb-3 border-black/8">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Calendar size={18} className="text-gray-400" />
                Agenda Semanal
              </h3>
              <div className="flex items-center gap-3">
                <button onClick={() => changeWeek(-1)} className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-500 border-[0.5px] border-black/8"><ChevronLeft size={16} /></button>
                <span className="text-xs font-bold text-gray-700">
                  {weekDays[0] && new Date(weekDays[0].dayStr + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  {' – '}
                  {weekDays[6] && new Date(weekDays[6].dayStr + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <button onClick={() => changeWeek(1)} className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-500 border-[0.5px] border-black/8"><ChevronRight size={16} /></button>
              </div>
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-4 mb-3 pb-2 border-b border-black/5">
              {[
                { bg: '#E8F0FB', border: '#1A4A8A', label: 'Cita agendada' },
                { bg: '#E1F5EE', border: '#0F6E56', label: 'Atendida' },
                { bg: '#FAEEDA', border: '#854F0B', label: 'Seguimiento' },
                { bg: '#f3f4f6', border: '#9ca3af', label: 'Disponible' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.bg, border: `1.5px solid ${item.border}` }} />
                  <span className="text-[10px] text-gray-500 font-medium">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="overflow-auto max-h-[500px]">
              {(() => {
                const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                const slots: string[] = [];
                for (let h = 9; h <= 18; h++) {
                  slots.push(`${String(h).padStart(2, '0')}:00`);
                  if (h < 18) slots.push(`${String(h).padStart(2, '0')}:30`);
                }

                const getApptStyle = (status: string) => {
                  if (status === 'attended') return { bg: '#E1F5EE', border: '#0F6E56', text: '#0F6E56' };
                  if (status === 'follow_up') return { bg: '#FAEEDA', border: '#854F0B', text: '#854F0B' };
                  return { bg: '#E8F0FB', border: '#1A4A8A', text: '#1A4A8A' };
                };

                return (
                  <table className="w-full text-xs border-collapse" style={{ minWidth: '600px' }}>
                    <thead>
                      <tr>
                        <th className="w-14 py-2 border-b border-r border-black/8 bg-gray-50/50 text-gray-400 font-medium text-[10px] text-center">Hora</th>
                        {weekDays.map(({ dayStr, dayNum }) => {
                          const isToday = dayStr === todayStr;
                          const dateObj = new Date(dayStr + 'T00:00:00');
                          const label = dayLabels[dateObj.getDay()];
                          return (
                            <th
                              key={dayStr}
                              className="py-2 border-b border-l border-black/8 text-[11px] font-bold text-center"
                              style={isToday ? { color: '#1A4A8A', backgroundColor: '#EEF4FF' } : { color: '#374151', backgroundColor: '#f9fafb' }}
                            >
                              <div>{label}</div>
                              <div className="text-sm font-black">{dayNum}</div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {slots.map(slot => (
                        <tr key={slot} className="border-b border-gray-100 last:border-0 h-11">
                          <td className="py-1 px-2 text-[10px] font-bold text-gray-400 text-center border-r border-black/8 w-14 whitespace-nowrap align-middle">
                            {slot}
                          </td>
                          {weekDays.map(({ dayStr }) => {
                            const appt = weekAppointments.find(
                              a => a.date === dayStr && (a.start_time?.substring(0, 5) === slot || a.time?.substring(0, 5) === slot)
                            );
                            const style = appt ? getApptStyle(appt.status || appt.type) : null;
                            return (
                              <td
                                key={dayStr}
                                className="border-l border-gray-100 align-top p-1"
                              >
                                {appt ? (
                                  <div
                                    className="rounded-md px-2 py-1 h-full flex flex-col justify-center text-[10px] font-medium cursor-default shadow-sm border-l-2"
                                    style={{ backgroundColor: style!.bg, borderColor: style!.border, color: style!.text }}
                                  >
                                    <div className="flex items-center justify-between gap-1 overflow-hidden">
                                      <div className="truncate font-bold flex-1">{appt.patients?.name || appt.patient_name || 'Paciente'}</div>
                                      <select 
                                        value={appt.status} 
                                        onChange={async (e) => {
                                           const res = await fetch('/api/appointments/update', {
                                              method: 'PATCH',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ id: appt.id, status: e.target.value })
                                           });
                                           if (res.ok) fetchData();
                                        }}
                                        onClick={e => e.stopPropagation()}
                                        className="text-[8px] bg-white/80 border-[0.5px] border-black/10 rounded px-1 py-0.5 cursor-pointer font-bold outline-none"
                                      >
                                         <option value="scheduled">Agendada</option>
                                         <option value="confirmed">Confirmada</option>
                                         <option value="attended">Atendida</option>
                                         <option value="no_show">No se presentó</option>
                                         <option value="cancelled">Cancelada</option>
                                      </select>
                                    </div>
                                    <div className="font-normal opacity-70 truncate italic">{appt.notes || 'Consulta'}</div>
                                  </div>
                                ) : (
                                  <div className="h-full rounded hover:bg-gray-50/50 cursor-pointer transition-colors" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        ) : (
          /* ─── DAY SLOTS VIEW (mes) ─── */
          <div className="bg-white rounded-xl border-[0.5px] border-black/8 shadow-sm p-6 flex flex-col h-full max-h-[600px] overflow-hidden">
            <div className="pb-4 border-b border-black/8 h-max">
              <h3 className="text-md font-bold text-gray-900 flex items-center gap-1.5">
                <Calendar size={18} className="text-blue-500" />
                Horarios del día {selectedDateString && new Date(selectedDateString + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </h3>
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-4 mt-3 pb-2 border-b border-black/5">
              {[
                { bg: '#E8F0FB', border: '#1A4A8A', label: 'Cita agendada' },
                { bg: '#E1F5EE', border: '#0F6E56', label: 'Atendida' },
                { bg: '#FAEEDA', border: '#854F0B', label: 'Seguimiento' },
                { bg: '#f3f4f6', border: '#9ca3af', label: 'Disponible' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.bg, border: `1.5px solid ${item.border}` }} />
                  <span className="text-[10px] text-gray-500 font-medium">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="flex-1 mt-4 overflow-y-auto space-y-2 pr-1">
              {!selectedDateString ? (
                <div className="flex h-full items-center justify-center text-gray-400 text-xs text-center p-4">
                  💡 Selecciona un día del calendario para ver horarios.
                </div>
              ) : (
                <div className="space-y-1">
                  {(() => {
                    const slots: string[] = [];
                    for (let h = 7; h <= 21; h++) {
                      slots.push(`${String(h).padStart(2, '0')}:00`);
                      if (h < 21) slots.push(`${String(h).padStart(2, '0')}:30`);
                    }
                    const dayAppointments = weekAppointments.filter(app => app.date === selectedDateString);
                    return slots.map(slot => {
                      const appointment = dayAppointments.find((app) => (app.start_time?.substring(0, 5) === slot || app.time?.substring(0, 5) === slot));
                      return (
                        <div
                          key={slot}
                          className={`p-2 rounded-xl flex items-center justify-between border-[0.5px] transition-all ${
                            appointment
                              ? 'bg-amber-50/70 border-amber-100 shadow-sm'
                              : 'bg-white border-gray-100 hover:bg-gray-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg flex items-center gap-1 ${appointment ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                              <Clock size={11} />
                              {slot}
                            </span>
                            {appointment ? (
                              <div className="flex-1 flex items-center justify-between gap-1 overflow-hidden">
                                <h4 className="font-bold text-gray-900 text-xs truncate flex-1">
                                  {appointment.patients?.name || appointment.patient_name || 'Paciente'}
                                </h4>
                                <select 
                                  value={appointment.status} 
                                  onChange={async (e) => {
                                     const res = await fetch('/api/appointments/update', {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ id: appointment.id, status: e.target.value })
                                     });
                                     if (res.ok) fetchData();
                                  }}
                                  onClick={e => e.stopPropagation()}
                                  className="text-[9px] bg-white border-[0.5px] border-black/10 rounded-md px-1 py-0.5 cursor-pointer font-bold outline-none"
                                >
                                   <option value="scheduled">Agendada</option>
                                   <option value="confirmed">Confirmada</option>
                                   <option value="attended">Atendida</option>
                                   <option value="no_show">No se presentó</option>
                                   <option value="cancelled">Cancelada</option>
                                </select>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300 font-medium">Disponible</span>
                            )}
                          </div>
                          {appointment && appointment.notes && (
                            <span className="text-[10px] text-gray-400 italic max-w-[120px] truncate">"{appointment.notes}"</span>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Removed bottom action buttons */}

      {/* MODAL: DETAIL READONLY */}
      {isDetailModalOpen && selectedAppt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 relative">
              <button onClick={() => setIsDetailModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"><X size={20}/></button>
              <div className="flex items-center gap-3 mb-4 border-b border-black/8 pb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-xl">
                  {(selectedAppt.patients?.name || selectedAppt.patient_name || 'P')[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{selectedAppt.patients?.name || selectedAppt.patient_name}</h3>
                  <p className="text-xs text-blue-600 font-bold capitalize">{(selectedAppt.appointment_type || 'consultation').replace('_', ' ')}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                 <div className="flex gap-2 text-sm">
                   <Calendar size={16} className="text-gray-400 shrink-0"/>
                   <span className="font-medium text-gray-700">{selectedAppt.date}</span>
                 </div>
                 <div className="flex gap-2 text-sm">
                   <Clock size={16} className="text-gray-400 shrink-0"/>
                   <span className="font-medium text-gray-700">{(selectedAppt.start_time || selectedAppt.time || '').substring(0,5)} ({selectedAppt.duration_minutes || 30} min)</span>
                 </div>
                 {selectedAppt.reason && (
                   <div className="flex gap-2 text-sm">
                     <FileText size={16} className="text-gray-400 shrink-0 mt-0.5"/>
                     <span className="text-gray-600 leading-tight">{selectedAppt.reason}</span>
                   </div>
                 )}
              </div>

              <div className="flex flex-col gap-2">
                  {role !== 'assistant' && role !== 'admin' && (
                  <button onClick={async () => {
                     let pId = selectedAppt.patient_id;
                     if (!pId) {
                        const { data: newP } = await supabase.from('patients').insert({
                           name: selectedAppt.patient_name || selectedAppt.patients?.name || 'Paciente Nuevo',
                           phone: selectedAppt.patient_phone || selectedAppt.patients?.phone || '',
                           email: selectedAppt.patient_email || selectedAppt.patients?.email || '',
                           doctor_id: selectedAppt.doctor_id,
                           clinic_id: selectedAppt.clinic_id
                        }).select('id').single();
                        
                        if (newP) {
                           pId = newP.id;
                           await supabase.from('appointments').update({ patient_id: pId }).eq('id', selectedAppt.id);
                        }
                     }
                     if (pId) {
                        setIsDetailModalOpen(false);
                        window.location.href = `/dashboard/consultations?patient_id=${pId}&symptoms=${encodeURIComponent(selectedAppt.reason || '')}&weight=${selectedAppt.weight || ''}&blood_pressure=${selectedAppt.blood_pressure || ''}&temperature=${selectedAppt.temperature || ''}`;
                     } else {
                        toast.error('Error', { description: 'No se pudo crear el registro del paciente para la consulta.' });
                     }
                  }} className="w-full py-2.5 bg-[#1A4A8A] text-white font-bold text-xs rounded-xl">Ir a Consulta Médica</button>
                  )}
              </div>
           </div>
        </div>
      )}

      {/* Nuevo Paciente Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 text-lg font-bold"
            >
              &times;
            </button>
            <PatientForm onSuccess={() => {
              setIsModalOpen(false);
              fetchData();
            }} />
          </div>
        </div>
      )}

      {/* Invitar Asistente Modal */}
      {inviting && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 relative space-y-4">
            <button onClick={() => setInviting(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"><X size={20}/></button>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <UserPlus size={24} />
            </div>
            <h3 className="text-center font-black text-gray-900">Invitar Asistente</h3>
            <p className="text-center text-xs text-gray-500 px-2">Crea una cuenta para tu asistente. Podrá ver tu agenda y gestionar cobros.</p>
            
            <div className="space-y-4 pt-2">
              <input 
                type="email" 
                placeholder="correo@asistente.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={() => {
                  toast.success('¡Enlace enviado!', { description: `Se ha enviado una invitación a ${inviteEmail}` });
                  setInviting(false);
                  setInviteEmail('');
                }}
                disabled={!inviteEmail}
                className="w-full py-3 bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 disabled:opacity-50"
              >
                Enviar Invitación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, UserPlus, Users, Calendar, DollarSign, Loader2, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import PatientForm from '@/components/PatientForm';

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
  
  // Weekly Calendar States
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekAppointments, setWeekAppointments] = useState<any[]>([]);
  const [calendarView, setCalendarView] = useState<'mes' | 'semana'>('semana');
  const [selectedDateString, setSelectedDateString] = useState<string | null>(null);

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
      setSearching(true);
      const { data } = await supabase
        .from('patients')
        .select('id, name')
        .or(`name.ilike.%${searchTerm}%`);
      if (data) setSearchResults(data);
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

    // 2. Fetch Billing according to filter (Only paid ones)
    let query = supabase.from('billing').select('normal_fee, discount, extra_charge, created_at').eq('paid', true);
    
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
      supabase.from('consultations').select('id, patient_id, created_at, status, patients(name)').gte('created_at', today),
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('billing').select('*', { count: 'exact', head: true }).eq('paid', false),
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
              {searchResults.map((p) => (
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

          <div className="bg-white rounded-xl border-[0.5px] border-black/8 shadow-sm p-4 space-y-2">
            <p className="text-xs font-bold text-gray-700 mb-2">Leyenda</p>
            {[
              { bg: '#E8F0FB', border: '#1A4A8A', label: 'Cita agendada' },
              { bg: '#E1F5EE', border: '#0F6E56', label: 'Atendida' },
              { bg: '#FAEEDA', border: '#854F0B', label: 'Seguimiento' },
              { bg: '#f3f4f6', border: '#9ca3af', label: 'Disponible' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.bg, border: `1.5px solid ${item.border}` }} />
                <span className="text-xs text-gray-600">{item.label}</span>
              </div>
            ))}
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
                Horarios díd {selectedDateString && new Date(selectedDateString + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </h3>
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
    </div>
  );
}

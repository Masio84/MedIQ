'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Clock, User, FileText, ChevronLeft, ChevronRight, Search, X, Users, AlertCircle, Ban } from 'lucide-react';
import { useRole } from '@/context/RoleContext';

export default function AgendaPage() {
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [waitingList, setWaitingList] = useState<any[]>([]);
  const [selectedDateString, setSelectedDateString] = useState<string | null>(null);
  const { role } = useRole();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('todos');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [calendarView, setCalendarView] = useState<'dia' | 'semana' | 'mes'>('dia');
  
  // Modals state
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  // Appt Form
  const [apptForm, setApptForm] = useState({
    id: '', patient_id: '', patient_name: '', date: '', start_time: '', 
    duration_minutes: 30, appointment_type: 'consultation', reason: '', notes: '', status: 'scheduled',
    weight: '',
    blood_pressure: '',
    temperature: ''
  });
  const [quickPatientSearch, setQuickPatientSearch] = useState('');
  const [quickPatientDropdown, setQuickPatientDropdown] = useState(false);
  
  // Block Form
  const [blockForm, setBlockForm] = useState({
    date: '', start_time: '', end_time: '', reason: '', is_full_day: false, recurring: 'none'
  });

  const [modalError, setModalError] = useState<string | null>(null);
  const supabase = createClient();
  const todayStr = new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Expandir rango para cubrir días remanentes de semanas que tocan otros meses
    const startCount = new Date(currentDate.getFullYear(), currentDate.getMonth(), -7).toISOString().split('T')[0];
    const endCount = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 7).toISOString().split('T')[0];

    try {
      const [apptsRes, blocksRes, waitRes] = await Promise.all([
        fetch(`/api/appointments/list?date_from=${startCount}&date_to=${endCount}`),
        fetch(`/api/appointments/blocked-slots?date_from=${startCount}&date_to=${endCount}`),
        fetch(`/api/appointments/waiting-list`)
      ]);

      const apptsData = await apptsRes.json();
      const blocksData = await blocksRes.json();
      const waitData = await waitRes.json();

      if (apptsData.success) setAllAppointments(apptsData.data);
      if (blocksData.success) setBlockedSlots(blocksData.data);
      if (waitData.success) setWaitingList(waitData.data);
    } catch (err) {
      console.error('Error fetching agenda data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchData();
    fetchPatients();
    if (!selectedDateString) setSelectedDateString(todayStr);
  }, [fetchData]);

  const fetchPatients = async () => {
    const { data } = await supabase.from('patients').select('id, name');
    if (data) setPatients(data);
  };

  const handleSaveAppointment = async () => {
    try {
      setModalError(null);
      if (!apptForm.date || !apptForm.start_time || (!apptForm.patient_id && !apptForm.patient_name)) {
        throw new Error('Faltan campos obligatorios');
      }

      const endpoint = modalMode === 'create' ? '/api/appointments/create' : '/api/appointments/update';
      const method = modalMode === 'create' ? 'POST' : 'PATCH';
      
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apptForm)
      });
      const data = await res.json();
      
      if (!data.success) throw new Error(data.error);
      
      setIsApptModalOpen(false);
      fetchData();
    } catch (e: any) {
      setModalError(e.message);
    }
  };

  const handleCancelAppointment = async (id: string, reason?: string) => {
    if (!confirm('¿Estás seguro de cancelar esta cita?')) return;
    try {
      const res = await fetch('/api/appointments/cancel', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reason })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setIsDetailModalOpen(false);
      setIsApptModalOpen(false);
      fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveBlock = async () => {
    try {
      setModalError(null);
      const res = await fetch('/api/appointments/block-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockForm)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setIsBlockModalOpen(false);
      fetchData();
    } catch (e: any) {
      setModalError(e.message);
    }
  };

  const openNewAppt = (date: string, time: string) => {
    setModalMode('create');
    setApptForm({
      id: '', patient_id: '', patient_name: '', date, start_time: time,
      duration_minutes: 30, appointment_type: 'consultation', reason: '', notes: '', status: 'scheduled',
      weight: '', blood_pressure: '', temperature: ''
    });
    setQuickPatientSearch('');
    setIsApptModalOpen(true);
  };

  const openEditAppt = (appt: any) => {
    setModalMode('edit');
    setApptForm({
      id: appt.id, 
      patient_id: appt.patient_id || '', 
      patient_name: appt.patients?.name || appt.patient_name || '', 
      date: appt.date, 
      start_time: appt.start_time.substring(0, 5),
      duration_minutes: appt.duration_minutes, 
      appointment_type: appt.appointment_type, 
      reason: appt.reason || '', 
      notes: appt.notes || '', 
      status: appt.status,
      weight: appt.weight || '',
      blood_pressure: appt.blood_pressure || '',
      temperature: appt.temperature || ''
    });
    setQuickPatientSearch(appt.patients?.name || appt.patient_name || '');
    setIsDetailModalOpen(false);
    setIsApptModalOpen(true);
  };

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const weekDays = (() => {
    const anchor = selectedDateString ? new Date(selectedDateString + 'T00:00:00') : new Date();
    const dow = anchor.getDay();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() - dow + i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { dayStr: ds, dayNum: d.getDate(), month: d.getMonth() };
    });
  })();

  const changeMonth = (val: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + val);
    setCurrentDate(d);
    setSelectedDateString(null);
  };

  const getStatusColor = (status: string, type: string) => {
    if (status === 'attended') return { bg: '#E1F5EE', border: '#0F6E56', text: '#0F6E56' };
    if (status === 'cancelled' || status === 'no_show') return { bg: '#FEE2E2', border: '#EF4444', text: '#B91C1C' };
    if (type === 'follow_up') return { bg: '#FAEEDA', border: '#854F0B', text: '#854F0B' };
    if (type === 'emergency') return { bg: '#FEE2E2', border: '#EF4444', text: '#B91C1C' };
    return { bg: '#E8F0FB', border: '#1A4A8A', text: '#1A4A8A' };
  };

  const filteredObj = allAppointments.filter(app => 
    searchTerm === '' || (app.patients?.name && app.patients.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Agenda Médica</h1>
          <p className="text-sm text-gray-500">Gestiona tus citas y horarios de atención.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
               <Search size={18} />
             </div>
             <input
               type="text"
               placeholder="Buscar paciente..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2 border-[0.5px] border-black/8 bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 text-sm shadow-sm"
             />
          </div>
          <button 
            onClick={() => {
              setBlockForm({ date: selectedDateString || todayStr, start_time: '09:00', end_time: '10:00', reason: '', is_full_day: false, recurring: 'none' });
              setIsBlockModalOpen(true);
            }}
            className="px-4 py-2 bg-white border-[0.5px] border-black/8 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-50 shadow-sm"
          >
            Bloquear Horario
          </button>
          <button 
            onClick={() => openNewAppt(selectedDateString || todayStr, '09:00')}
            className="px-4 py-2 bg-[#1A4A8A] text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-[#1A4A8A]/90 shadow-sm"
          >
            + Nueva Cita
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ─── LEFT SIDEBAR (Fixed Width) ─── */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-4">
          
          {/* Mini Calendar */}
          <div className="bg-white rounded-xl border-[0.5px] border-black/8 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3 border-b border-black/8 pb-2">
              <span className="text-sm font-bold text-gray-900">{monthNames[month]} {year}</span>
              <div className="flex gap-0.5">
                <button onClick={() => changeMonth(-1)} className="p-1 rounded-lg hover:bg-gray-50 text-gray-500"><ChevronLeft size={15} /></button>
                <button onClick={() => changeMonth(1)} className="p-1 rounded-lg hover:bg-gray-50 text-gray-500"><ChevronRight size={15} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center mb-1">
              {['D','L','M','M','J','V','S'].map((d, i) => <div key={i} className="text-[10px] font-bold text-gray-400">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDayIndex }).map((_, i) => <div key={`b-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                 const day = i + 1;
                 const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                 const hasAppts = allAppointments.some(a => a.date === dayStr && a.status !== 'cancelled');
                 const isToday = dayStr === todayStr;
                 const isSelected = dayStr === selectedDateString;
                 return (
                   <button
                     key={day}
                     onClick={() => setSelectedDateString(dayStr)}
                     className="h-8 w-full flex flex-col items-center justify-center rounded-lg text-xs font-bold relative transition-all"
                     style={isToday ? { backgroundColor: '#1A4A8A', color: '#fff' } : isSelected ? { border: '1.5px solid #1A4A8A', color: '#1A4A8A' } : { color: '#374151' }}
                   >
                     {day}
                     {hasAppts && !isToday && <div className="w-1 h-1 rounded-full absolute bottom-1" style={{ backgroundColor: '#0F6E56' }} />}
                   </button>
                 );
              })}
            </div>
          </div>

          {/* Selected Day Agenda Compact List */}
          {selectedDateString && (
            <div className="bg-white rounded-xl border-[0.5px] border-black/8 shadow-sm p-4 flex flex-col max-h-[300px]">
              <h3 className="text-xs font-bold text-gray-900 mb-3 border-b border-black/8 pb-2 flex items-center justify-between">
                Citas del día {new Date(selectedDateString + 'T00:00:00').getDate()}
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[9px]">
                  {allAppointments.filter(a => a.date === selectedDateString && a.status !== 'cancelled').length}
                </span>
              </h3>
              <div className="overflow-y-auto space-y-2 pr-1 flex-1">
                {allAppointments
                  .filter(a => a.date === selectedDateString && a.status !== 'cancelled')
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map(appt => {
                     const style = getStatusColor(appt.status, appt.appointment_type);
                     return (
                       <div key={appt.id} onClick={() => { setSelectedAppt(appt); setIsDetailModalOpen(true); }} className="flex gap-2 p-2 rounded-lg border-[0.5px] border-black/8 hover:bg-gray-50 cursor-pointer items-center">
                         <div className="text-[10px] font-black text-gray-500 w-10 shrink-0 text-center">{appt.start_time.substring(0, 5)}</div>
                         <div className="w-1 h-full rounded-full shrink-0" style={{ backgroundColor: style.border }} />
                         <div className="min-w-0">
                           <div className="text-xs font-bold text-gray-900 truncate">{appt.patients?.name || appt.patient_name}</div>
                           <div className="text-[9px] text-gray-500 truncate">{appt.reason || 'Sin motivo'}</div>
                         </div>
                       </div>
                     );
                })}
                {allAppointments.filter(a => a.date === selectedDateString && a.status !== 'cancelled').length === 0 && (
                   <p className="text-xs text-gray-400 text-center py-4">Sin citas agendadas</p>
                )}
              </div>
            </div>
          )}

          {/* Waiting List */}
          <div className="bg-white rounded-xl border-[0.5px] border-black/8 shadow-sm p-4">
             <h3 className="text-xs font-bold text-gray-900 mb-3 border-b border-black/8 pb-2 flex items-center justify-between">
                Lista de Espera
                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[9px]">{waitingList.length}</span>
             </h3>
             <div className="space-y-2 max-h-[200px] overflow-y-auto">
               {waitingList.map(item => (
                 <div key={item.id} className="p-2 border-[0.5px] border-black/8 rounded-lg bg-orange-50/30 flex justify-between items-center">
                   <div>
                     <p className="text-xs font-bold text-gray-800">{item.patients?.name || item.patient_name}</p>
                     <p className="text-[9px] text-gray-500">{item.reason || 'Urgente'}</p>
                   </div>
                   <button onClick={() => openEditAppt(item)} className="text-[9px] bg-white border-[0.5px] border-black/8 px-2 py-1 rounded hover:bg-gray-50 font-bold">
                     Asignar
                   </button>
                 </div>
               ))}
               {waitingList.length === 0 && (
                 <p className="text-xs text-gray-400 text-center py-2">Vacía</p>
               )}
             </div>
          </div>

          <div className="flex rounded-xl border-[0.5px] border-black/8 overflow-hidden bg-white shadow-sm">
            {(['dia', 'semana', 'mes'] as const).map(view => (
              <button
                key={view}
                onClick={() => setCalendarView(view)}
                className="flex-1 py-2 text-xs font-bold transition-colors capitalize"
                style={calendarView === view ? { backgroundColor: '#1A4A8A', color: '#fff' } : { color: '#6b7280' }}
              >
                {view}
              </button>
            ))}
          </div>

        </div>


        {/* ─── RIGHT MAIN PANEL ─── */}
        <div className="flex-1 min-w-0 bg-white rounded-xl border-[0.5px] border-black/8 shadow-sm p-4 h-[calc(100vh-140px)] flex flex-col">
           
           {/* DAY VIEW */}
           {calendarView === 'dia' && (
             <div className="flex flex-col h-full">
                <div className="flex items-center justify-between border-b border-black/8 pb-4 mb-4">
                   <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                     <Calendar className="text-blue-600" size={20}/>
                     {selectedDateString && new Date(selectedDateString + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                   </h2>
                </div>
                <div className="overflow-y-auto flex-1 pr-2">
                  {(() => {
                    const slots: string[] = [];
                    for (let h = 8; h <= 20; h++) {
                      slots.push(`${String(h).padStart(2, '0')}:00`);
                      slots.push(`${String(h).padStart(2, '0')}:30`);
                    }
                    const dayFiltered = filteredObj.filter(a => a.date === selectedDateString);
                    const dayBlocks = blockedSlots.filter(b => b.date === selectedDateString);

                    return slots.map(slot => {
                      const appt = dayFiltered.find(a => a.start_time.startsWith(slot) && a.status !== 'cancelled');
                      const blocked = dayBlocks.find(b => b.start_time <= slot && b.end_time > slot);

                      if (blocked) {
                         return (
                           <div key={slot} className="flex min-h-[60px] border-b border-gray-100 group">
                             <div className="w-16 shrink-0 py-2 border-r border-gray-100 text-right pr-4 text-[11px] font-bold text-gray-400">{slot}</div>
                             <div className="flex-1 p-1">
                               <div className="h-full w-full rounded-lg bg-gray-100 flex items-center justify-center opacity-70 stripe-bg border-[0.5px] border-gray-300">
                                  <Ban size={14} className="text-gray-500 mr-2" />
                                  <span className="text-xs font-bold text-gray-600">{blocked.reason || 'Bloqueado'}</span>
                               </div>
                             </div>
                           </div>
                         );
                      }

                      if (appt) {
                         const style = getStatusColor(appt.status, appt.appointment_type);
                         return (
                           <div key={slot} className="flex min-h-[60px] border-b border-gray-100">
                             <div className="w-16 shrink-0 py-2 border-r border-gray-100 text-right pr-4 text-[11px] font-bold text-gray-400">{slot}</div>
                             <div className="flex-1 p-1">
                               <div 
                                onClick={() => { setSelectedAppt(appt); setIsDetailModalOpen(true); }}
                                className="h-full w-full rounded-lg border-l-4 p-2 cursor-pointer shadow-sm flex flex-col justify-center"
                                style={{ backgroundColor: style.bg, borderLeftColor: style.border }}
                               >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-black" style={{ color: style.text }}>{appt.patients?.name || appt.patient_name}</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/50">{appt.duration_minutes} min</span>
                                  </div>
                                  <div className="text-[10px] text-gray-600 mt-1 line-clamp-1">{appt.reason || 'Consulta General'}</div>
                               </div>
                             </div>
                           </div>
                         );
                      }

                      // Empty Slot
                      return (
                         <div key={slot} className="flex min-h-[40px] border-b border-gray-100 group">
                            <div className="w-16 shrink-0 py-2 border-r border-gray-100 text-right pr-4 text-[11px] font-bold text-gray-400">{slot}</div>
                            <div className="flex-1 p-0.5">
                               <div 
                                onClick={() => openNewAppt(selectedDateString!, slot)}
                                className="h-full w-full min-h-[38px] rounded-lg border border-transparent group-hover:bg-blue-50/50 group-hover:border-blue-100 cursor-pointer flex items-center justify-center flex-col transition-all"
                               >
                                  <span className="text-blue-500 opacity-0 group-hover:opacity-100 font-bold text-lg leading-none">+</span>
                               </div>
                            </div>
                         </div>
                      );
                    });
                  })()}
                </div>
             </div>
           )}

           {/* WEEK VIEW */}
           {calendarView === 'semana' && (
             <div className="flex flex-col h-full"> 
               <div className="flex-1 overflow-x-auto border-[0.5px] border-black/8 rounded-xl overflow-y-auto">
                 <table className="w-full text-xs border-collapse table-fixed" style={{ minWidth: '850px' }}>
                    <thead>
                       <tr className="bg-gray-50/80 border-b border-black/8">
                         <th className="w-16 py-3 text-gray-400 font-bold text-[10px] text-right pr-4 sticky top-0 bg-gray-50/80 z-10">Hora</th>
                         {weekDays.map(({ dayStr, dayNum }) => {
                           const isToday = dayStr === todayStr;
                           const dateObj = new Date(dayStr + 'T00:00:00');
                           const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                           return (
                             <th key={dayStr} className="py-2 text-[11px] font-bold text-center border-l border-black/5 sticky top-0 bg-gray-50/80 z-10" style={isToday ? { color: '#1A4A8A', backgroundColor: '#EEF4FF' } : { color: '#374151' }}>
                               <div>{dayLabels[dateObj.getDay()]}</div>
                               <div className="text-sm font-black">{dayNum}</div>
                             </th>
                           );
                         })}
                       </tr>
                    </thead>
                    <tbody>
                       {(() => {
                         const slots: string[] = [];
                         for (let h = 8; h <= 20; h++) {
                           slots.push(`${String(h).padStart(2, '0')}:00`);
                           slots.push(`${String(h).padStart(2, '0')}:30`);
                         }
                         return slots.map(slot => (
                           <tr key={slot} className="border-b border-gray-100/60 group">
                             <td className="py-2 border-r border-gray-100/60 text-right pr-4 text-[10px] font-bold text-gray-400 w-16 shrink-0 bg-gray-50/30">{slot}</td>
                             {weekDays.map(({ dayStr }) => {
                               const dayFiltered = filteredObj.filter(a => a.date === dayStr);
                               const dayBlocks = blockedSlots.filter(b => b.date === dayStr);
                               const appt = dayFiltered.find(a => a.start_time.startsWith(slot) && a.status !== 'cancelled');
                               const blocked = dayBlocks.find(b => b.start_time <= slot && b.end_time > slot);

                               if (blocked) {
                                  return (
                                    <td key={dayStr} className="border-l border-gray-50 p-0.5 align-top">
                                      <div className="h-full min-h-[40px] rounded-lg bg-gray-100 flex items-center justify-center opacity-70 stripe-bg border-[0.5px] border-gray-300">
                                         <Ban size={12} className="text-gray-500 mr-1" />
                                         <span className="text-[9px] font-bold text-gray-600 truncate">{blocked.reason || 'Bloqueado'}</span>
                                      </div>
                                    </td>
                                  );
                               }
                               if (appt) {
                                  const style = getStatusColor(appt.status, appt.appointment_type);
                                  return (
                                    <td key={dayStr} className="border-l border-gray-50 p-0.5 align-top">
                                      <div 
                                       onClick={() => { setSelectedAppt(appt); setIsDetailModalOpen(true); }}
                                       className="rounded-lg border-l-4 p-1 cursor-pointer shadow-sm flex flex-col justify-center h-full min-h-[40px] hover:opacity-90 transition-opacity"
                                       style={{ backgroundColor: style.bg, borderLeftColor: style.border }}
                                      >
                                         <div className="text-[10px] font-black truncate" style={{ color: style.text }}>{appt.patients?.name || appt.patient_name}</div>
                                         <div className="text-[8px] text-gray-600 line-clamp-1">{appt.reason || 'Consulta'}</div>
                                      </div>
                                    </td>
                                  );
                               }
                               return (
                                 <td key={dayStr} className="border-l border-gray-50 p-0.5 align-top">
                                   <div 
                                    onClick={() => openNewAppt(dayStr, slot)}
                                    className="h-full min-h-[40px] rounded-lg border border-transparent group-hover:bg-blue-50/40 cursor-pointer flex items-center justify-center transition-all"
                                   >
                                      <span className="text-blue-500 opacity-0 group-hover:opacity-100 font-bold text-base leading-none">+</span>
                                   </div>
                                 </td>
                               );
                             })}
                           </tr>
                         ));
                       })()}
                    </tbody>
                 </table>
               </div>
             </div>
           )}

           {/* MONTH VIEW */}
           {calendarView === 'mes' && (
             <div className="flex flex-col h-full">
               <div className="flex-1 overflow-y-auto border-[0.5px] border-black/8 rounded-xl">
                 <table className="w-full text-xs border-collapse h-full table-fixed">
                    <thead>
                       <tr className="bg-gray-50 border-b border-black/8 sticky top-0 z-10">
                         {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d, i) => (
                           <th key={d} className={`py-2 text-[11px] font-bold text-gray-600 text-center border-black/5 ${i > 0 ? 'border-l' : ''}`}>{d}</th>
                         ))}
                       </tr>
                    </thead>
                    <tbody>
                       {(() => {
                         const totalCells = Math.ceil((daysInMonth + firstDayIndex) / 7) * 7;
                         const rows: any[] = [];
                         let cells: any[] = [];

                         for (let i = 0; i < totalCells; i++) {
                           const dayNum = i - firstDayIndex + 1;
                           const isValidDay = dayNum > 0 && dayNum <= daysInMonth;
                           const dayStr = isValidDay ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}` : '';
                           const isToday = dayStr === todayStr;
                           const hasAppts = isValidDay && allAppointments.some(a => a.date === dayStr && a.status !== 'cancelled');
                           
                           cells.push(
                             <td key={i} className={`border border-black/5 align-top p-1 h-32 ${isValidDay ? 'bg-white' : 'bg-gray-50/40'}`}>
                               {isValidDay && (
                                 <div className="flex flex-col h-full">
                                   <div className="flex justify-between items-center mb-1">
                                     <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>{dayNum}</span>
                                     {hasAppts && <div className="w-1.5 h-1.5 rounded-full bg-[#0F6E56]" />}
                                   </div>
                                   <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5">
                                     {allAppointments
                                       .filter(a => a.date === dayStr && a.status !== 'cancelled')
                                       .sort((a, b) => a.start_time.localeCompare(b.start_time))
                                       .slice(0, 3)
                                       .map(appt => {
                                          const style = getStatusColor(appt.status, appt.appointment_type);
                                          return (
                                            <div key={appt.id} onClick={() => { setSelectedAppt(appt); setIsDetailModalOpen(true); }} className="rounded px-1 py-0.5 text-[9px] font-bold cursor-pointer border-l-2 truncate shadow-sm hover:opacity-80 transition-opacity" style={{ backgroundColor: style.bg, borderLeftColor: style.border, color: style.text }}>
                                               {appt.start_time.substring(0, 5)} {appt.patients?.name || appt.patient_name}
                                            </div>
                                          );
                                     })}
                                     {allAppointments.filter(a => a.date === dayStr && a.status !== 'cancelled').length > 3 && (
                                       <button onClick={() => { setSelectedDateString(dayStr!); setCalendarView('dia'); }} className="text-[8px] text-blue-600 font-bold hover:underline">Ver más...</button>
                                     )}
                                   </div>
                                 </div>
                               )}
                             </td>
                           );

                           if ((i + 1) % 7 === 0) {
                             rows.push(<tr key={`row-${i}`}>{cells}</tr>);
                             cells = [];
                           }
                         }
                         return rows;
                       })()}
                    </tbody>
                 </table>
               </div>
             </div>
           )}

        </div>

      </div>

      {/* MODAL: APPOINTMENT FORM */}
      {isApptModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 relative">
            <button onClick={() => setIsApptModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"><X size={20}/></button>
            <h2 className="text-lg font-bold text-gray-900 border-b border-black/8 pb-3 mb-4">
              {modalMode === 'create' ? 'Nueva Cita' : 'Editar Cita'}
            </h2>
            
            <div className="space-y-4">
              {/* Paciente */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-700 mb-1">Paciente *</label>
                <input 
                  type="text" 
                  placeholder="Buscar paciente registrado o ingresar nombre nuevo..."
                  value={quickPatientSearch}
                  onChange={(e) => {
                     setQuickPatientSearch(e.target.value);
                     setApptForm({ ...apptForm, patient_name: e.target.value, patient_id: '' });
                     setQuickPatientDropdown(true);
                  }}
                  onFocus={() => setQuickPatientDropdown(true)}
                  className="w-full bg-white px-3 py-2 text-sm border-[0.5px] border-black/8 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {quickPatientDropdown && quickPatientSearch.length > 0 && (
                  <div className="absolute top-16 left-0 w-full bg-white border-[0.5px] border-black/8 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto p-1">
                    {patients.filter(p => p.name.toLowerCase().includes(quickPatientSearch.toLowerCase())).map(p => (
                       <div key={p.id} onClick={() => {
                          setApptForm({ ...apptForm, patient_id: p.id, patient_name: p.name });
                          setQuickPatientSearch(p.name);
                          setQuickPatientDropdown(false);
                       }} className="px-3 py-2 text-xs hover:bg-gray-50 cursor-pointer rounded-lg text-gray-900 font-bold">
                          {p.name}
                       </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-gray-400 mt-1">Si no existe, se registrará como nombre temporal.</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fecha *</label>
                  <input type="date" value={apptForm.date} onChange={e => setApptForm({...apptForm, date: e.target.value})} className="w-full bg-white px-3 py-2 text-sm border-[0.5px] border-black/8 rounded-lg focus:outline-none"/>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Hora inicio *</label>
                  <input type="time" value={apptForm.start_time} onChange={e => setApptForm({...apptForm, start_time: e.target.value})} className="w-full bg-white px-3 py-2 text-sm border-[0.5px] border-black/8 rounded-lg focus:outline-none"/>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Duración *</label>
                  <select value={apptForm.duration_minutes} onChange={e => setApptForm({...apptForm, duration_minutes: Number(e.target.value)})} className="w-full bg-white px-3 py-2 text-sm border-[0.5px] border-black/8 rounded-lg focus:outline-none">
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1.5 horas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Cita</label>
                  <select value={apptForm.appointment_type} onChange={e => setApptForm({...apptForm, appointment_type: e.target.value})} className="w-full bg-white px-3 py-2 text-sm border-[0.5px] border-black/8 rounded-lg focus:outline-none">
                     <option value="consultation">Consulta General</option>
                     <option value="follow_up">Seguimiento</option>
                     <option value="procedure">Procedimiento</option>
                     <option value="emergency">Urgencia</option>
                  </select>
                </div>
                {modalMode === 'edit' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                    <select value={apptForm.status} onChange={e => setApptForm({...apptForm, status: e.target.value})} className="w-full bg-white px-3 py-2 text-sm border-[0.5px] border-black/8 rounded-lg focus:outline-none font-bold">
                       <option value="scheduled">Agendada</option>
                       <option value="confirmed">Confirmada</option>
                       <option value="attended">Atendida</option>
                       <option value="no_show">No se presentó</option>
                       <option value="waiting_list">Lista de espera</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-black/5 pt-3">
                 <div>
                    <label className="block text-[10px] font-black text-gray-500 mb-1">Peso (kg)</label>
                    <input type="number" step="0.1" placeholder="Ej: 75" value={apptForm.weight || ''} onChange={e => setApptForm({...apptForm, weight: e.target.value})} className="w-full bg-white px-2 py-1.5 text-xs border-[0.5px] border-gray-300 rounded-lg focus:outline-none font-bold text-gray-900"/>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-500 mb-1">Presión Arterial</label>
                    <input type="text" placeholder="120/80" value={apptForm.blood_pressure || ''} onChange={e => setApptForm({...apptForm, blood_pressure: e.target.value})} className="w-full bg-white px-2 py-1.5 text-xs border-[0.5px] border-gray-300 rounded-lg focus:outline-none font-bold text-gray-900"/>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-500 mb-1">Temp (°C)</label>
                    <input type="number" step="0.1" placeholder="36.5" value={apptForm.temperature || ''} onChange={e => setApptForm({...apptForm, temperature: e.target.value})} className="w-full bg-white px-2 py-1.5 text-xs border-[0.5px] border-gray-300 rounded-lg focus:outline-none font-bold text-gray-900"/>
                 </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Motivo / Notas médicas previas</label>
                <textarea value={apptForm.reason} onChange={e => setApptForm({...apptForm, reason: e.target.value})} rows={2} className="w-full bg-white px-3 py-2 text-sm border-[0.5px] border-black/8 rounded-lg focus:outline-none resize-none" placeholder="Motivo de la consulta..."></textarea>
              </div>

              {modalError && <div className="text-red-500 text-xs font-bold flex items-center gap-1"><AlertCircle size={14}/> {modalError}</div>}

              <div className="flex items-center justify-between pt-4 border-t border-black/8 mt-4">
                 {modalMode === 'edit' ? (
                   <button onClick={() => handleCancelAppointment(apptForm.id)} className="text-red-600 font-bold text-xs hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">Cancelar Cita</button>
                 ) : <div></div>}
                 <div className="flex gap-2">
                   <button onClick={() => setIsApptModalOpen(false)} className="px-4 py-2 bg-white border-[0.5px] border-black/8 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50">Cerrar</button>
                   <button onClick={handleSaveAppointment} className="px-5 py-2 bg-gray-900 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-gray-800">Guardar</button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <p className="text-xs text-blue-600 font-bold capitalize">{selectedAppt.appointment_type.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                 <div className="flex gap-2 text-sm">
                   <Calendar size={16} className="text-gray-400 shrink-0"/>
                   <span className="font-medium text-gray-700">{selectedAppt.date}</span>
                 </div>
                 <div className="flex gap-2 text-sm">
                   <Clock size={16} className="text-gray-400 shrink-0"/>
                   <span className="font-medium text-gray-700">{selectedAppt.start_time.substring(0,5)} ({selectedAppt.duration_minutes} min)</span>
                 </div>
                 {selectedAppt.reason && (
                   <div className="flex gap-2 text-sm">
                     <FileText size={16} className="text-gray-400 shrink-0 mt-0.5"/>
                     <span className="text-gray-600 leading-tight">{selectedAppt.reason}</span>
                   </div>
                 )}
              </div>

              <div className="flex flex-col gap-2">
                  {role !== 'assistant' && (
                  <button onClick={async () => {
                     let pId = selectedAppt.patient_id;
                     if (!pId) {
                        // Crear paciente para poder registrar la consulta
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
                        setIsDetailModalOpen(false);                         window.location.href = `/dashboard/consultations?patient_id=${pId}&symptoms=${encodeURIComponent(selectedAppt.reason || '')}&weight=${selectedAppt.weight || ''}&blood_pressure=${selectedAppt.blood_pressure || ''}&temperature=${selectedAppt.temperature || ''}`;
                     } else {
                        alert('No se pudo crear el registro del paciente para la consulta.');
                     }
                  }} className="w-full py-2.5 bg-[#1A4A8A] text-white font-bold text-xs rounded-xl">Ir a Consulta Médica</button>
                  )}
                 <button onClick={() => openEditAppt(selectedAppt)} className="w-full py-2.5 bg-white border-[0.5px] border-black/8 text-gray-900 font-bold text-xs rounded-xl hover:bg-gray-50">Editar Fecha/Detalles</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL: BLOCK SLOT */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 relative">
            <button onClick={() => setIsBlockModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"><X size={20}/></button>
            <h2 className="text-lg font-bold text-gray-900 border-b border-black/8 pb-3 mb-4">Bloquear Horario</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Fecha</label>
                <input type="date" value={blockForm.date} onChange={e => setBlockForm({...blockForm, date: e.target.value})} className="w-full bg-white px-3 py-2 text-sm border-[0.5px] border-black/8 rounded-lg outline-none"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Inicia</label>
                  <input type="time" value={blockForm.start_time} onChange={e => setBlockForm({...blockForm, start_time: e.target.value})} className="w-full bg-white px-3 py-2 text-sm border-[0.5px] border-black/8 rounded-lg outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Termina</label>
                  <input type="time" value={blockForm.end_time} onChange={e => setBlockForm({...blockForm, end_time: e.target.value})} className="w-full bg-white px-3 py-2 text-sm border-[0.5px] border-black/8 rounded-lg outline-none"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Motivo (ej. Comida, Quirófano)</label>
                <input type="text" value={blockForm.reason} onChange={e => setBlockForm({...blockForm, reason: e.target.value})} className="w-full bg-white px-3 py-2 text-sm border-[0.5px] border-black/8 rounded-lg outline-none"/>
              </div>
              {modalError && <p className="text-red-500 text-xs font-bold">{modalError}</p>}
              <button onClick={handleSaveBlock} className="w-full py-2.5 bg-gray-900 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">
                Guardar Bloqueo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

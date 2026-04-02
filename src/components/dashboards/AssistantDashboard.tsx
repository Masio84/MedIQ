'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Calendar, DollarSign, Loader2, CheckCircle, PlusCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import PatientForm from '@/components/PatientForm';
import AppointmentReminders from '@/components/AppointmentReminders';

export default function AssistantDashboard() {
  const [loading, setLoading] = useState(true);
  const [billings, setBillings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [appointmentsToday, setAppointmentsToday] = useState(0);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [currentProfile, setCurrentProfile] = useState<any>(null);

  // Simple appointment state for direct actions
  const [newAppointment, setNewAppointment] = useState({ 
    patient_id: '', 
    doctor_id: '', 
    date: '', 
    start_time: '', 
    notes: '' 
  });

  // Direct Calendar Modal states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthAppointments, setMonthAppointments] = useState<any[]>([]);

  // Modal states from previous
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<any>(null);
  const [followUpInfo, setFollowUpInfo] = useState<{ date: string; notes: string } | null>(null);
  
  const [agendaData, setAgendaData] = useState({ date: '', start_time: '', notes: '' });
  const [modalError, setModalError] = useState<string | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const supabase = createClient();

  useEffect(() => {
    fetchPendingBillings();
    fetchSupportData();
  }, []);

  // Load unread notifications on mount
  useEffect(() => {
    if (!currentUserId) return;
    const loadNotifications = async () => {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('to_user_id', currentUserId)
        .eq('read', false);

      if (currentProfile?.clinic_id) {
        query = query.eq('clinic_id', currentProfile.clinic_id);
      }

      const { data } = await query.order('created_at', { ascending: false });
      setNotifications(Array.isArray(data || []) ? data || [] : []);
      setNotifCount(data?.length || 0);
    };
    loadNotifications();
  }, [currentUserId, currentProfile?.clinic_id]);

  // Realtime listener for new notifications
  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel('notifications-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `to_user_id=eq.${currentUserId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setNotifCount(prev => prev + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  useEffect(() => {
    if (isAppointmentModalOpen) fetchMonthAppointments();
  }, [isAppointmentModalOpen, currentDate]);

  const fetchMonthAppointments = async () => {
    const startCount = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
    const endCount = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: prof } = await supabase.from('profiles').select('doctor_id').eq('id', user.id).single();
    if (!prof?.doctor_id) return;

    const { data } = await supabase
      .from('appointments')
      .select('date, time, doctor_id')
      .eq('doctor_id', prof.doctor_id)
      .gte('date', startCount)
      .lte('date', endCount);

    if (data) setMonthAppointments(data);
  };

  const fetchSupportData = async () => {
    // 1. Obtener perfil del usuario para el doctor vinculado
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (prof) {
        setCurrentProfile(prof);
        if (prof.doctor_id) {
          setNewAppointment(prev => ({ ...prev, doctor_id: prof.doctor_id }));
        }

        // 2. Cargar doctores y pacientes
        const { data: d } = await supabase.from('profiles')
          .select('id, name')
          .eq('role', 'doctor')
          .eq('is_active', true)
          .eq('id', prof.doctor_id);
        
        const { data: p } = await supabase.from('patients')
          .select('id, name')
          .eq('doctor_id', prof.doctor_id);

        if (d) setDoctors(Array.isArray(d) ? d : []);
        if (p) setPatients(p);

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const { count } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', prof.doctor_id)
          .eq('date', todayStr)
          .eq('status', 'scheduled');
        
        if (count !== null) setAppointmentsToday(count);
      }
    }
  };

  const fetchPendingBillings = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: prof } = await supabase.from('profiles').select('doctor_id').eq('id', user.id).single();
    if (!prof?.doctor_id) { setLoading(false); return; }
    
    const { data: allBillings } = await supabase
      .from('billing')
      .select('id, normal_fee, discount, extra_charge, created_at, paid, patient_id, patients!billing_patient_id_fkey(name, id), consultations(id, notes, doctor_id)')
      .eq('doctor_id', prof.doctor_id)
      .order('created_at', { ascending: false });

    if (allBillings) {
      setBillings(allBillings.filter(b => !b.paid));

      const startOfToday = new Date();
      startOfToday.setHours(0,0,0,0);

      const todayBillings = allBillings.filter(b => {
        const d = new Date(b.created_at);
        return b.paid && d >= startOfToday;
      });

      const sum = todayBillings.reduce((acc, b) => acc + (Number(b.normal_fee) + Number(b.extra_charge) - Number(b.discount)), 0);
      setTodayEarnings(sum);
    }

    setLoading(false);
  };

  const handleMarkAsPaid = async (billing: any) => {
    setSelectedBilling(billing);
    
    // Extract follow-up instructions from Doctor notes
    const consultation = billing.consultations?.id ? billing.consultations : billing.consultations?.[0];
    const notes = consultation?.notes || '';
    const match = notes.match(/\[SEGUIMIENTO\]: Fecha sugerida: ([^\.]+)\. Notas de médico: ([^\n]+)/);

    if (match) {
      setFollowUpInfo({
        date: match[1]?.trim() !== 'N/A' ? match[1] : '',
        notes: match[2]?.trim() !== 'N/A' ? match[2] : '',
      });
      setAgendaData({
        date: match[1]?.trim() !== 'N/A' ? match[1] : '',
        start_time: '09:00', // Default hour
        notes: `Seguimiento: ${match[2]?.trim() !== 'N/A' ? match[2] : ''}`
      });
    } else {
      setFollowUpInfo(null);
      setAgendaData({ date: '', start_time: '', notes: 'Generando sugerencia del sistema...' });

      // Cargar sugerencia vía IA
      if (consultation) {
         fetch('/api/ai/summarize-for-assistant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               diagnosis: consultation.diagnosis,
               symptoms: consultation.symptoms,
               notes: consultation.notes
            })
         }).then(res => res.json()).then(aiData => {
            if (aiData.success) {
               setAgendaData(prev => ({ ...prev, notes: aiData.summary }));
            } else {
               setAgendaData(prev => ({ ...prev, notes: 'Cita de control' }));
            }
         }).catch(() => {
            setAgendaData(prev => ({ ...prev, notes: 'Cita de control' }));
         });
      } else {
         setAgendaData({ date: '', start_time: '', notes: 'Cita de control' });
      }
    }

    setIsPayModalOpen(true);
  };

  const confirmPayment = async () => {
    if (!selectedBilling) return;

    setModalError(null);

    // 1. Mark as Paid in DB
    const { data: updatedData, error } = await supabase
      .from('billing')
      .update({ paid: true }) 
      .eq('id', selectedBilling.id)
      .select();

    if (error) {
      setModalError('Error al registrar pago: ' + error.message);
      return;
    }

    if (!updatedData || updatedData.length === 0) {
      setModalError('Error: No se pudo actualizar el pago en Base de Datos (0 filas modificadas). Probablemente le falta una política de UPDATE habilitada en su Supabase.');
      return;
    }

    // 2. If should Schedule appointment
    if (agendaData.date && agendaData.start_time) {
      const patientId = selectedBilling?.consultations?.patient_id || selectedBilling?.consultations?.[0]?.patient_id;
      const doctorId = selectedBilling?.consultations?.doctor_id || selectedBilling?.consultations?.[0]?.doctor_id;

      const { error: appointError } = await supabase
        .from('appointments')
        .insert([
          {
            patient_id: patientId,
            doctor_id: doctorId,
            date: agendaData.date,
            start_time: agendaData.start_time,
            end_time: (() => {
               const [hours, minutes] = agendaData.start_time.split(':').map(Number);
               const endDate = new Date(0, 0, 0, hours, minutes + 30);
               return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;
            })(),
            duration_minutes: 30,
            appointment_type: 'follow_up',
            reason: agendaData.notes,
            status: 'scheduled'
          }
        ]);
        
      if (appointError) {
        setModalError('Pago registrado, pero no se pudo agendar la cita: ' + appointError.message + '. ¿Ejecutó el SQL de la Cita en Supabase?');
        return;
      }
    }

    // 3. Increment Earnings Dynamically
    const totalAdded = Number(selectedBilling.normal_fee) + Number(selectedBilling.extra_charge) - Number(selectedBilling.discount);
    setTodayEarnings((prev) => prev + totalAdded);

    // 4. Clear from local state view instantly
    setBillings((prev) => prev.filter((b) => b.id !== selectedBilling.id));
    setIsPayModalOpen(false);
  };

  const confirmNewAppointment = async () => {
    if (!newAppointment.patient_id || !newAppointment.doctor_id || !newAppointment.date || !newAppointment.start_time) {
      setModalError('Rellena todos los campos obligatorios.');
      return;
    }
    setModalError(null);

    const { error } = await supabase
      .from('appointments')
      .insert([{
        patient_id: newAppointment.patient_id,
        doctor_id: newAppointment.doctor_id,
        date: newAppointment.date,
        start_time: newAppointment.start_time,
        end_time: (() => {
           const [hours, minutes] = newAppointment.start_time.split(':').map(Number);
           const endDate = new Date(0, 0, 0, hours, minutes + 30);
           return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;
        })(),
        duration_minutes: 30,
        appointment_type: 'consultation',
        status: 'scheduled',
        notes: newAppointment.notes
      }]);
      
    if (error) {
      setModalError('Error: ' + error.message);
    } else {
      setIsAppointmentModalOpen(false);
      setNewAppointment(prev => ({ 
        patient_id: '', 
        doctor_id: prev.doctor_id, // Preservar el doctor vinculado por defecto
        date: '', 
        start_time: '', 
        notes: '' 
      }));
      setPatientSearch('');
    }
  };

  const handleActOnNotification = async (notif: any) => {
    if (notif.suggested_date) {
      await supabase.from('appointments').insert([{
        patient_id: notif.patient_id,
        doctor_id: notif.from_user_id,
        date: notif.suggested_date,
        start_time: notif.suggested_time || '09:00',
        end_time: (() => {
           const timeStr = notif.suggested_time || '09:00';
           const [hours, minutes] = timeStr.split(':').map(Number);
           const endDate = new Date(0, 0, 0, hours, minutes + 30);
           return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;
        })(),
        duration_minutes: 30,
        appointment_type: 'follow_up',
        status: 'scheduled',
        notes: notif.message || 'Seguimiento sugerido por médico',
      }]);
    }
    await supabase.from('notifications').update({ read: true, acted: true }).eq('id', notif.id);
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true, acted: true } : n));
    setNotifCount(prev => Math.max(0, prev - 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const changeMonth = (val: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + val);
    setCurrentDate(d);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-6 items-start">
      {/* ─── LEFT COLUMN ─── */}
      <div className="space-y-6">
      {/* 3 Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Cobros Pendientes */}
        <div className="bg-white border-[0.5px] border-black/8 rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Cobros pendientes</span>
          <span className="text-3xl font-medium" style={{ color: '#854F0B' }}>{billings.length}</span>
        </div>
        {/* Recaudado Hoy */}
        <div className="bg-white border-[0.5px] border-black/8 rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Recaudado hoy</span>
          <span className="text-3xl font-medium" style={{ color: '#0F6E56' }}>${todayEarnings.toFixed(2)}</span>
        </div>
        {/* Citas Hoy */}
        <div className="bg-white border-[0.5px] border-black/8 rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Citas pendientes hoy</span>
          <span className="text-3xl font-medium text-gray-900">{appointmentsToday}</span>
        </div>
      </div>

      {/* Recordatorios de Citas de WhatsApp */}
      <AppointmentReminders />

      <div className="flex justify-between items-center mt-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="text-gray-400" size={20} />
          Cobros Pendientes
        </h2>
        <a href="/dashboard/agenda" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-medium text-xs hover:bg-blue-100 transition-colors">
          <Calendar size={14} />
          Ver Agenda
        </a>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : billings.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border-[0.5px] border-black/8 text-center text-gray-400 text-sm shadow-sm">
          No hay cuentas pendientes por cobrar.
        </div>
      ) : (
        <div className="bg-white rounded-xl border-[0.5px] border-black/8 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <table className="w-full text-left border-collapse border-[0.5px] border-black/8">
                <thead>
                  <tr className="bg-gray-50/50 border-[0.5px] border-black/8 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3 border-[0.5px] border-black/8">Paciente</th>
                    <th className="px-6 py-3 border-[0.5px] border-black/8">Monto a cobrar</th>
                    <th className="px-6 py-3 text-center border-[0.5px] border-black/8">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y-[0.5px] divide-black/8">
                  {Array.isArray(billings) && billings.map((b) => {
                    const total = Number(b.normal_fee) + Number(b.extra_charge) - Number(b.discount);
                    const patientName = b.patients?.name ? b.patients.name : 'Paciente Sin Nombre'; // Requerimiento: jalar el nombre real, no N/A
                    return (
                      <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 border-[0.5px] border-black/8">
                          {patientName}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 text-sm border-[0.5px] border-black/8">
                          ${total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center border-[0.5px] border-black/8">
                          <button 
                            onClick={() => handleMarkAsPaid(b)}
                            className="px-3 py-1.5 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 mx-auto"
                            style={{ backgroundColor: '#E6F5F0', color: '#0F6E56' }}
                          >
                            ✓ Validar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción rápida al fondo */}
      <div className="flex flex-col sm:flex-row gap-4 mt-2">
        <button 
          onClick={() => setIsPatientModalOpen(true)}
          className="flex-1 py-3 bg-white border-[0.5px] border-black/8 text-gray-900 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
          Nuevo paciente
        </button>
        <button 
          onClick={() => setIsAppointmentModalOpen(true)}
          className="flex-1 py-3 bg-gray-900 border-[0.5px] border-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
          Agendar cita
        </button>
      </div>

      </div>

      {/* ─── RIGHT COLUMN: Notificaciones ─── */}
      <div className="bg-white rounded-2xl border border-gray-100/60 shadow-sm p-5 space-y-4 sticky top-6">
        <div className="flex items-center justify-between border-b border-gray-50 pb-3">
          <h3 className="text-sm font-bold text-gray-900">Notificaciones</h3>
          {notifCount > 0 && (
            <span
              className="ripple-badge inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-black"
              style={{ backgroundColor: '#993C1D' }}
            >
              {notifCount}
            </span>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Sin notificaciones pendientes</p>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {Array.isArray(notifications) && notifications.map((notif, idx) => {
              const borderColor = notif.type === 'seguimiento_sugerido' ? '#993C1D' : '#1A4A8A';
              const acted = notif.acted;
              const patientName = notif.message?.match(/para (.+)$/)?.[1] || 'Paciente';
              return (
                <div
                  key={notif.id}
                  className="notif-slide-in rounded-xl p-3 bg-gray-50/60 border border-gray-100 space-y-2"
                  style={{ borderLeft: `3px solid ${borderColor}`, animationDelay: `${idx * 60}ms` }}
                >
                  <p className="text-xs font-bold text-gray-900 leading-snug">{notif.message}</p>
                  {notif.suggested_date && (
                    <p className="text-[10px] text-gray-500">
                      📅 {notif.suggested_date}{notif.suggested_time ? ` · ${notif.suggested_time.substring(0, 5)}` : ''}
                    </p>
                  )}
                  <div className="flex gap-1.5 pt-1">
                    {acted ? (
                      <span
                        className="flex-1 text-center py-1 rounded-lg text-[10px] font-bold text-white"
                        style={{ backgroundColor: '#0F6E56' }}
                      >
                        Agendado ✓
                      </span>
                    ) : (
                      <button
                        onClick={() => handleActOnNotification(notif)}
                        className="flex-1 py-1 rounded-lg text-[10px] font-bold text-white transition-opacity hover:opacity-80"
                        style={{ backgroundColor: '#1A4A8A' }}
                      >
                        Agendar ahora
                      </button>
                    )}
                    {notif.patient_id && (
                      <a
                        href={`/dashboard/agenda?patient_id=${notif.patient_id}&doctor_id=${notif.from_user_id || ''}&date=${notif.suggested_date || ''}&time=${notif.suggested_time?.substring(0,5) || ''}&reason=${encodeURIComponent('Cita de seguimiento')}&patient_name=${encodeURIComponent(patientName)}`}
                        className="flex-1 py-1 rounded-lg text-[10px] font-bold text-center text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        Revisar agenda
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Modal Confirmar Pago y Agendar */}
      {isPayModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Confirmar Pago</h3>
            
            <p className="text-sm text-gray-600">El pago se registrará en el sistema.</p>

            {followUpInfo && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
                <p className="text-xs font-bold text-blue-700">📌 Indicación de Seguimiento del Doctor:</p>
                {followUpInfo.date && <p className="text-xs text-blue-600"><strong>Fecha sugerida:</strong> {new Date(followUpInfo.date).toLocaleDateString()}</p>}
                {followUpInfo.notes && <p className="text-xs text-blue-600"><strong>Indicación:</strong> {followUpInfo.notes}</p>}
              </div>
            )}

            <div className="border-t border-gray-50 pt-3 space-y-3">
              <p className="text-xs font-bold text-gray-700 flex items-center gap-1">
                <PlusCircle size={14} className="text-gray-400" />
                ¿Deseas agendar una nueva cita?
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xxs text-gray-400">Fecha</label>
                  <input 
                    type="date" 
                    value={agendaData.date}
                    onChange={(e) => setAgendaData({ ...agendaData, date: e.target.value })}
                    className="w-full p-2 border border-gray-100 rounded-lg text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xxs text-gray-400">Hora</label>
                  <input 
                    type="time" 
                    value={agendaData.start_time}
                    onChange={(e) => setAgendaData({ ...agendaData, start_time: e.target.value })}
                    className="w-full p-2 border border-gray-100 rounded-lg text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xxs text-gray-400">Notas de Cita</label>
                <input 
                  type="text" 
                  placeholder="Ej: Cita de control"
                  value={agendaData.notes}
                  onChange={(e) => setAgendaData({ ...agendaData, notes: e.target.value })}
                  className="w-full p-2 border border-gray-100 rounded-lg text-xs focus:outline-none"
                />
              </div>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100 flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-gray-50">
              <button 
                onClick={() => {
                  setIsPayModalOpen(false);
                  setModalError(null);
                }} 
                className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-bold"
              >
                Cancelar
              </button>
              <button onClick={confirmPayment} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm">
                Confirmar y Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Nuevo Paciente */}
      {isPatientModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 relative">
            <button
              onClick={() => setIsPatientModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 text-lg font-bold"
            >
              &times;
            </button>
            <PatientForm onSuccess={() => {
              setIsPatientModalOpen(false);
              fetchSupportData(); // Refresh patient list dropdown handles!
            }} />
          </div>
        </div>
      )}

      {/* Modal Nueva Cita Directa */}
      {isAppointmentModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row gap-6 relative">
            
            <button
              onClick={() => setIsAppointmentModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 text-lg font-bold"
            >
              &times;
            </button>

            {/* Columna Izquierda: Calendario */}
            <div className="flex-1 space-y-3">
              <h3 className="text-md font-bold text-gray-900 border-b pb-2 flex items-center gap-1.5">
                <Calendar size={18} className="text-blue-600" />
                Selecciona Fecha
              </h3>
              
              <div className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-xl">
                <span className="text-xs font-bold text-gray-800">{monthNames[month]} {year}</span>
                <div className="flex gap-0.5">
                  <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-200 rounded text-gray-600"><ChevronLeft size={16}/></button>
                  <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-200 rounded text-gray-600"><ChevronRight size={16}/></button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center font-bold text-gray-400 text-xxs tracking-wider mb-1">
                <div>D</div><div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div>
              </div>

              <div className="grid grid-cols-7 gap-1 flex-1">
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`b-${i}`} className="h-8"></div>
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const hasCitas = monthAppointments.some(a => a.date === dayStr);
                  const isSelected = newAppointment.date === dayStr;

                  return (
                    <button 
                      key={day} 
                      onClick={() => setNewAppointment({ ...newAppointment, date: dayStr })}
                      className={`h-8 flex flex-col items-center justify-center rounded-lg text-xxs font-bold relative transition-colors ${
                        isSelected 
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' 
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {day}
                      {hasCitas && <div className={`w-1 h-1 rounded-full absolute bottom-1 ${isSelected ? 'bg-white' : 'bg-blue-500'}`}></div>}
                    </button>
                  );
                })}
              </div>
              {newAppointment.date && (
                <p className="text-xxs text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-lg">
                  📅 Seleccionado: {new Date(newAppointment.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </p>
              )}
            </div>

            {/* Columna Derecha: Formulario */}
            <div className="flex-1 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
              <div className="space-y-3">
                <h3 className="text-md font-bold text-gray-900 border-b pb-2">Detalles de la Cita</h3>
                
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Paciente</label>
                  <input 
                    type="text" 
                    placeholder="Buscar o escribir nombre..."
                    value={patientSearch}
                    onChange={(e) => {
                       setPatientSearch(e.target.value);
                       setShowPatientDropdown(true);
                       if (e.target.value === '') setNewAppointment({ ...newAppointment, patient_id: '' });
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    className="w-full bg-white px-3 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
                  />
                  {showPatientDropdown && (
                    <div className="absolute top-14 left-0 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto p-1 space-y-0.5">
                      {patients.filter(p => !patientSearch || p.name?.toLowerCase().includes(patientSearch.toLowerCase())).map(p => (
                         <div 
                           key={p.id} 
                           onClick={() => {
                              setNewAppointment({ ...newAppointment, patient_id: p.id });
                              setPatientSearch(p.name);
                              setShowPatientDropdown(false);
                           }}
                           className="px-3 py-1.5 text-xxs hover:bg-gray-50 cursor-pointer rounded-lg text-gray-700 font-bold"
                         >
                            {p.name}
                         </div>
                      ))}
                      {patients.filter(p => p.name?.toLowerCase().includes(patientSearch.toLowerCase())).length === 0 && patientSearch.trim() !== '' && (
                         <div 
                           onClick={async () => {
                              try {
                                const res = await fetch('/api/patients/create', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ name: patientSearch }),
                                });
                                const result = await res.json();
                                if (!res.ok) throw new Error(result?.error || 'No se pudo crear el paciente');
                                if (result?.data) {
                                  setPatients([...patients, result.data]);
                                  setNewAppointment({ ...newAppointment, patient_id: result.data.id });
                                  setShowPatientDropdown(false);
                                }
                              } catch (e: any) {
                                setModalError(e?.message || 'No se pudo crear el paciente');
                              }
                           }}
                           className="px-3 py-1.5 text-xxs hover:bg-blue-50 cursor-pointer rounded-lg text-blue-600 font-black flex items-center gap-1"
                         >
                            <PlusCircle size={12}/> Crear "{patientSearch}"
                         </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Doctor / Médico</label>
                  <select 
                    value={newAppointment.doctor_id}
                    onChange={(e) => setNewAppointment({ ...newAppointment, doctor_id: e.target.value })}
                    className="w-full bg-white px-3 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
                  >
                    <option value="">Selecciona un doctor...</option>
                    {Array.isArray(doctors) && doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 flex justify-between">
                    <span>Selecciona Hora</span>
                    {newAppointment.start_time && <span className="text-blue-600 font-bold">({newAppointment.start_time})</span>}
                  </label>
                  {!newAppointment.date ? (
                    <p className="text-xxs text-gray-400">Selecciona una fecha en el calendario.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50/20">
                      {(() => {
                        const slots = [];
                        for (let h = 8; h <= 18; h++) {
                          slots.push(`${String(h).padStart(2, '0')}:00`);
                          slots.push(`${String(h).padStart(2, '0')}:30`);
                        }
                        return slots.map(slot => {
                            const isTaken = monthAppointments.some(
                              a => a.date === newAppointment.date && (a.start_time || '').substring(0, 5) === slot && (!newAppointment.doctor_id || a.doctor_id === newAppointment.doctor_id)
                            );
                            const isSelected = newAppointment.start_time === slot;

                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={isTaken}
                              onClick={() => setNewAppointment({ ...newAppointment, start_time: slot })}
                              className={`p-1.5 text-xxs font-bold rounded-lg border text-center transition-colors ${
                                isSelected 
                                  ? 'bg-blue-600 border-blue-600 text-white' 
                                  : isTaken 
                                    ? 'bg-red-50 border-red-50 text-red-500 cursor-not-allowed line-through' 
                                    : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Notas / Motivo</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Consulta general"
                    value={newAppointment.notes}
                    onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                    className="w-full p-2 border border-gray-100 rounded-lg text-xs focus:outline-none"
                  />
                </div>
              </div>

              {modalError && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-2 rounded-xl text-xxs font-bold text-center mt-2">
                   {modalError}
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-50 mt-4 md:mt-0">
                <button 
                  onClick={() => setIsAppointmentModalOpen(false)} 
                  className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-bold"
                >
                  Cancelar
                </button>
                <button onClick={confirmNewAppointment} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm">
                  Agendar Cita
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

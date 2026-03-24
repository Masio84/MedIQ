'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageCircle, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function AppointmentReminders() {
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<any[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 5 * 60 * 1000); // 5 min
    return () => clearInterval(interval);
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          start_time,
          reason,
          folio:public_token,
          patient_id,
          patients ( name, phone ),
          doctor_id
        `)
        .eq('status', 'scheduled')
        .or('reminder_sent.eq.false,reminder_sent.is.null');

      if (error) throw error;

      if (data) {
        // Cargar nombres de doctores manualmente para evitar problemas de relación directa
        const { data: doctors } = await supabase.from('profiles').select('id, name').eq('is_active', true);
        
        const filtered = data.map((app: any) => {
           const doctor = doctors?.find((d: any) => d.id === app.doctor_id);
           return {
              ...app,
              doctor_name: doctor ? doctor.name : 'Médicos'
           };
        }).filter((app: any) => {
           return isToday(app.date) || isTomorrow(app.date);
        });

        setReminders(filtered);
      }
    } catch (err) {
      console.error('Error cargando recordatorios:', err);
    } finally {
      setLoading(false);
    }
  };

  const isToday = (dateStr: string) => {
    const parts = dateStr.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  const isTomorrow = (dateStr: string) => {
    const parts = dateStr.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return d.getDate() === tomorrow.getDate() && d.getMonth() === tomorrow.getMonth() && d.getFullYear() === tomorrow.getFullYear();
  };

  const sendReminder = async (app: any) => {
    setSending(app.id);
    const phone = app.patients?.phone?.replace(/\D/g, '');
    const patientName = app.patients?.name || 'Paciente';
    const doctorName = app.doctor_name;
    const time = app.start_time.substring(0, 5);

    let message = '';
    if (isTomorrow(app.date)) {
      message = `Estimado/a ${patientName}, le recordamos su cita médica con el Dr. ${doctorName} mañana ${new Date(app.date).toLocaleDateString()} a las ${time}. Por favor confirme su asistencia respondiendo este mensaje. Gracias, Consultorio MedIQ.`;
    } else {
      message = `Estimado/a ${patientName}, le recordamos su cita médica con el Dr. ${doctorName} hoy a las ${time}. Le esperamos puntualmente. Gracias, Consultorio MedIQ.`;
    }

    const waUrl = `https://wa.me/52${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
           reminder_sent: true, 
           reminder_sent_at: new Date().toISOString() 
        })
        .eq('id', app.id);

      if (error) throw error;

      setReminders(prev => prev.filter(r => r.id !== app.id));
    } catch (err) {
      console.error('Error al actualizar recordatorio:', err);
    } finally {
      setSending(null);
    }
  };

  if (loading && reminders.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-100/50 shadow-sm flex justify-center items-center h-20">
         <Loader2 size={20} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border-[0.5px] border-black/8 shadow-sm space-y-4">
      <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
         <MessageCircle className="text-blue-600" size={18} />
         Recordatorios Pendientes
      </h3>

      {reminders.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4 bg-gray-50/50 rounded-lg">No hay recordatorios pendientes por enviar</p>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {reminders.map((app) => {
             const hasPhone = !!app.patients?.phone;
             const isTodayCard = isToday(app.date);

             return (
               <div key={app.id} className="p-3 bg-gray-50/50 hover:bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between gap-3 group transition-all">
                  <div className="space-y-1">
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-900">{app.patients?.name || 'Paciente'}</span>
                        {isTodayCard ? (
                          <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[9px] font-black rounded-md">HOY</span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-black rounded-md">MAÑANA</span>
                        )}
                        {!hasPhone && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-[9px] font-black rounded-md flex items-center gap-0.5"><AlertCircle size={9}/> Sin teléfono</span>
                        )}
                     </div>
                     <p className="text-[10px] text-gray-500">
                        👨‍⚕️ Dr. {app.doctor_name} · 🕒 {app.start_time.substring(0, 5)}
                     </p>
                  </div>

                  <button 
                    onClick={() => sendReminder(app)}
                    disabled={!hasPhone || sending === app.id}
                    className="p-2 bg-green-100 hover:bg-green-200 text-green-700 disabled:opacity-40 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                    title={!hasPhone ? "El paciente no tiene número registrado" : "Enviar recordatorio"}
                  >
                    {sending === app.id ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
                  </button>
               </div>
             );
          })}
        </div>
      )}
    </div>
  );
}

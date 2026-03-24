"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { Loader2, CheckCircle, AlertTriangle, Calendar, Clock, Plus, Trash2 } from 'lucide-react';

export default function SetupPage() {
  const [role, setRole] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos base
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Doctor section
  const [specialty, setSpecialty] = useState('');
  const [licenses, setLicenses] = useState<string[]>(['']); // Al menos 1 cédula
  const [institution, setInstitution] = useState('');

  // Admin section
  const [position, setPosition] = useState('');

  // Assistant section
  const [area, setArea] = useState('');

  // Horarios para Doctor (Asumimos el modelo single-row monday_start, monday_end, etc).
  const [schedule, setSchedule] = useState<any>({
    monday_active: true, monday_start: '09:00', monday_end: '18:00',
    tuesday_active: true, tuesday_start: '09:00', tuesday_end: '18:00',
    wednesday_active: true, wednesday_start: '09:00', wednesday_end: '18:00',
    thursday_active: true, thursday_start: '09:00', thursday_end: '18:00',
    friday_active: true, friday_start: '09:00', friday_end: '18:00',
    saturday_active: false, saturday_start: '09:00', saturday_end: '14:00',
    sunday_active: false, sunday_start: '09:00', sunday_end: '14:00'
  });

  const router = useRouter();
  const supabase = createClient();

  const daysLabels: any = {
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
    thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profile.setup_completed) {
          router.push('/dashboard');
          return;
        }

        setRole(profile.role);
        setClinicId(profile.clinic_id);
        setName(profile.name || '');
      } catch (err: any) {
        setError('Error al cargar perfil.');
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [router, supabase]);

  const handleLicenseChange = (index: number, value: string) => {
    const newLicenses = [...licenses];
    newLicenses[index] = value;
    setLicenses(newLicenses);
  };

  const addLicenseField = () => setLicenses([...licenses, '']);
  const removeLicenseField = (index: number) => setLicenses(licenses.filter((_, i) => i !== index));

  const handleScheduleToggle = (day: string) => {
    setSchedule({ ...schedule, [`${day}_active`]: !schedule[`${day}_active`] });
  };

  const handleScheduleTimeChange = (day: string, type: 'start' | 'end', value: string) => {
    setSchedule({ ...schedule, [`${day}_${type}`]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !phone) {
      setError('Nombre y teléfono son obligatorios.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión no encontrada");

      // Validar Cédulas si es doctor
      if (role === 'doctor') {
         if (!specialty || licenses.some(l => !l.trim())) {
              throw new Error("Especialidad y al menos 1 Cédula son obligatorios.");
         }
      }

      const updates: any = {
        name,
        phone,
        setup_completed: true,
      };

      if (role === 'doctor') {
        updates.specialty = specialty;
        updates.medical_license = licenses.join(', '); // Guardar como tira separada por comas
      } else if (role === 'admin') {
        if (position) updates.position = position;
      } else if (role === 'assistant') {
        if (!area) throw new Error("Área es obligatoria.");
        updates.area = area;
      }

      // 1. Actualizar perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 2. Insertar/Upsert Horarios si es doctor
      if (role === 'doctor') {
          const body: any = {
              doctor_id: user.id,
              clinic_id: clinicId, // Opcional pero recomendado
              default_duration_minutes: 30, // Default
              slot_interval_minutes: 30
          };

          for (const day in daysLabels) {
              body[`${day}_active`] = schedule[`${day}_active`];
              // Asegurar formato hora completa HH:MM:00
              body[`${day}_start`] = schedule[`${day}_start`].length === 5 ? `${schedule[`${day}_start`]}:00` : schedule[`${day}_start`];
              body[`${day}_end`] = schedule[`${day}_end`].length === 5 ? `${schedule[`${day}_end`]}:00` : schedule[`${day}_end`];
          }

          const { error: scheduleError } = await supabase
            .from('doctor_schedule')
            .upsert(body, { onConflict: 'doctor_id' });

          if (scheduleError) throw scheduleError;
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
        <p className="text-xs text-gray-500 font-medium">Configurando entorno...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl shadow-gray-100/30 border border-gray-100 p-8 space-y-6">
        <div className="text-center">
          <Image 
            src="/logo_v1.png" 
            alt="MedIQ" 
            width={120} 
            height={40} 
            className="mx-auto mb-3 object-contain"
            priority
            style={{ width: 'auto', height: 'auto' }}
          />
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Configuración Inicial</h1>
          <p className="text-xs text-gray-400 font-medium">Requerimos unos parámetros previos para activar tu cuenta</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 flex items-center gap-2 font-medium">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECCIÓN 1: DATOS GENERALES */}
          <div className="space-y-3">
             <div className="border-b border-gray-100 pb-1.5">
                <h3 className="text-xs font-black text-blue-600 uppercase">1. Datos de Contacto</h3>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xxs font-black text-gray-500 uppercase mb-1">Nombre</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50/10" placeholder="Nombre completo" />
                </div>
                <div>
                  <label className="block text-xxs font-black text-gray-500 uppercase mb-1">Teléfono</label>
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50/10" placeholder="5512345678" />
                </div>
             </div>
          </div>

          {/* SECCIÓN 2: DATOS PROFESIONALES (SI DOCTOR) */}
          {role === 'doctor' && (
             <div className="space-y-3">
                <div className="border-b border-gray-100 pb-1.5 flex justify-between items-center">
                   <h3 className="text-xs font-black text-blue-600 uppercase">2. Cedenciales Médicas</h3>
                </div>
                
                <div>
                  <label className="block text-xxs font-black text-gray-500 uppercase mb-1">Especialidad</label>
                  <input type="text" required value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50/10" placeholder="Ej. Pediatría / Medicina General" />
                </div>

                <div className="space-y-2">
                   <label className="block text-xxs font-black text-gray-500 uppercase">Cédulas Profesionales</label>
                   {licenses.map((license, index) => (
                      <div key={index} className="flex gap-2">
                         <input type="text" required value={license} onChange={(e) => handleLicenseChange(index, e.target.value)} className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50/10" placeholder="Ej. 1234567" />
                         {licenses.length > 1 && (
                            <button type="button" onClick={() => removeLicenseField(index)} className="p-2 border border-red-100 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={16} /></button>
                         )}
                      </div>
                   ))}
                   <button type="button" onClick={addLicenseField} className="text-xxs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">+ Agregar otra cédula</button>
                </div>
             </div>
          )}

          {/* SECCIÓN 3: HORARIOS (SI DOCTOR) */}
          {role === 'doctor' && (
              <div className="space-y-3">
                <div className="border-b border-gray-100 pb-1.5 flex items-center gap-2">
                   <Calendar size={14} className="text-blue-600" />
                   <h3 className="text-xs font-black text-blue-600 uppercase">3. Horario de Consulta</h3>
                </div>
                
                <div className="space-y-1.5 border border-gray-100 rounded-xl p-3 bg-gray-50/20">
                    {Object.keys(daysLabels).map((day) => (
                         <div key={day} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                             <div className="flex items-center gap-2 w-24">
                                <input type="checkbox" checked={schedule[`${day}_active`]} onChange={() => handleScheduleToggle(day)} className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5" />
                                <span className={`text-xxs font-bold ${schedule[`${day}_active`] ? 'text-gray-900' : 'text-gray-400'}`}>{daysLabels[day]}</span>
                             </div>
                             
                             {schedule[`${day}_active`] && (
                                <div className="flex items-center gap-1">
                                    <Clock size={12} className="text-gray-400" />
                                    <input type="time" value={schedule[`${day}_start`]} onChange={(e) => handleScheduleTimeChange(day, 'start', e.target.value)} className="px-1.5 py-0.5 border border-gray-200 rounded-md text-xxs font-medium" />
                                    <span className="text-xxs text-gray-400">-</span>
                                    <input type="time" value={schedule[`${day}_end`]} onChange={(e) => handleScheduleTimeChange(day, 'end', e.target.value)} className="px-1.5 py-0.5 border border-gray-200 rounded-md text-xxs font-medium" />
                                </div>
                             )}
                         </div>
                    ))}
                </div>
              </div>
          )}

          {role === 'admin' && (
             <div>
                <label className="block text-xxs font-black text-gray-500 uppercase mb-1">Puesto / Cargo</label>
                <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-black bg-gray-50/10" placeholder="Ej. Administrador General" />
             </div>
          )}

          {role === 'assistant' && (
             <div>
                <label className="block text-xxs font-black text-gray-500 uppercase mb-1">Área / Módulo</label>
                <input type="text" required value={area} onChange={(e) => setArea(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-black bg-gray-50/10" placeholder="Ej. Recepción / Triaje" />
             </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Activando...' : 'Finalizar Activación'}
          </button>
        </form>
      </div>
    </div>
  );
}

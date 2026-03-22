'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRole } from '@/context/RoleContext';
import ConsultationForm from '@/components/ConsultationForm';

export default function ConsultationsPage() {
  const { role, isLoading } = useRole();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get('patient_id') || undefined;
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(initialPatientId);
  const [patientRecord, setPatientRecord] = useState<any>(null);
  const [loadingRecord, setLoadingRecord] = useState(false);

  const initialSymptoms = searchParams.get('symptoms') || undefined;
  const initialWeight = searchParams.get('weight') || undefined;
  const initialPressure = searchParams.get('blood_pressure') || undefined;
  const initialTemperature = searchParams.get('temperature') || undefined;
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchHistory = async (docId: string) => {
      const { data } = await supabase
        .from('consultations')
        .select(`
          id,
          symptoms,
          diagnosis,
          created_at,
          patients ( name )
        `)
        .eq('doctor_id', docId)
        .order('created_at', { ascending: false });
      if (data) setHistory(data);
    };

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDoctorId(user.id);
        fetchHistory(user.id);
      }
    };

    fetchUser();
  }, [supabase]);

  useEffect(() => {
    if (!selectedPatientId) {
      setPatientRecord(null);
      return;
    }
    const fetchPatientRecord = async () => {
       setLoadingRecord(true);
       try {
          const { data: cData } = await supabase
            .from('consultations')
            .select('id, symptoms, diagnosis, treatment, notes, created_at, weight, blood_pressure, temperature')
            .eq('patient_id', selectedPatientId)
            .order('created_at', { ascending: false });

          const { data: aData } = await supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', selectedPatientId)
            .order('date', { ascending: false })
            .order('start_time', { ascending: false });

          setPatientRecord({ consultations: cData || [], appointments: aData || [] });
       } catch (err) {
          console.error(err);
       } finally {
          setLoadingRecord(false);
       }
    };
    fetchPatientRecord();
  }, [selectedPatientId, supabase]);

  if (isLoading) return null;

  if (role !== 'doctor' && role !== 'admin') {
    return (
      <div className="p-8 text-center bg-white rounded-xl">
        <p className="text-gray-500">Acceso restringido. Solo Médicos y Administradores tienen acceso a este módulo.</p>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Módulo de Consultas</h1>
          <p className="text-sm text-gray-500">Registrar diagnósticos y tratamientos clínicos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div>
            {doctorId && (
              <ConsultationForm 
                doctorId={doctorId} 
                initialPatientId={initialPatientId} 
                initialSymptoms={initialSymptoms} 
                initialWeight={initialWeight} 
                initialPressure={initialPressure} 
                initialTemperature={initialTemperature} 
                onPatientChange={(id) => setSelectedPatientId(id)}
              />
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100/50 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
              {selectedPatientId ? 'Expediente Digital del Paciente' : 'Historial de Consultas Recientes'}
            </h3>
            
            {loadingRecord && <p className="text-sm text-gray-400">Cargando expediente...</p>}

            {selectedPatientId && patientRecord ? (
                <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
                   {patientRecord.consultations?.length === 0 && patientRecord.appointments?.length === 0 && (
                      <p className="text-sm text-gray-400">Sin historial registrado para este paciente.</p>
                   )}

                   {/* Consultas */}
                   {patientRecord.consultations?.length > 0 && (
                      <div>
                         <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider mb-2">Diagnósticos y Tratamientos</h4>
                         <div className="space-y-3">
                            {patientRecord.consultations.map((c: any) => (
                               <div key={c.id} className="p-4 bg-gray-50 border-[0.5px] border-black/5 rounded-xl text-sm relative">
                                  <div className="flex justify-between items-center border-b border-black/5 pb-1.5 mb-2">
                                     <span className="text-xs font-bold text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <div className="space-y-1.5">
                                     <p className="text-xs text-gray-600"><span className="font-bold text-gray-900">Síntomas:</span> {c.symptoms || '-'}</p>
                                     <p className="text-xs text-gray-600"><span className="font-bold text-gray-900">Diagnóstico:</span> {c.diagnosis || '-'}</p>
                                     <p className="text-xs text-gray-600"><span className="font-bold text-gray-900">Tratamiento:</span> {c.treatment || '-'}</p>
                                     {(c.weight || c.blood_pressure || c.temperature) && (
                                        <p className="text-[10px] text-gray-500 italic mt-1 border-t border-black/5 pt-1">
                                           <span className="font-bold text-gray-700">Signos: </span>
                                           {c.weight ? `Peso: ${c.weight}kg ` : ''} 
                                           {c.blood_pressure ? `P.A: ${c.blood_pressure} ` : ''} 
                                           {c.temperature ? `Temp: ${c.temperature}℃` : ''}
                                        </p>
                                     )}
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   )}

                   {/* Agenda */}
                   {patientRecord.appointments?.length > 0 && (
                      <div className="mt-5 border-t border-black/5 pt-4">
                         <h4 className="text-xs font-black text-orange-800 uppercase tracking-wider mb-2">Citas en Agenda</h4>
                         <div className="space-y-2">
                            {patientRecord.appointments.map((a: any) => (
                               <div key={a.id} className="p-3 bg-orange-50/50 border-[0.5px] border-orange-100 rounded-xl flex justify-between items-center">
                                  <div>
                                     <span className="text-xs font-bold text-gray-800">{a.date} ({a.start_time?.substring(0, 5)})</span>
                                     {a.reason && <p className="text-[10px] text-gray-500 line-clamp-1">{a.reason}</p>}
                                  </div>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                     a.status === 'attended' || a.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                                     a.status === 'cancelled' || a.status === 'no_show' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                     {a.status.replace('_', ' ')}
                                  </span>
                               </div>
                            ))}
                         </div>
                      </div>
                   )}
                </div>
            ) : (
                <div className="space-y-2 overflow-y-auto max-h-[600px]">
                   {history.length === 0 && <p className="text-sm text-gray-400">No hay consultas registradas aún.</p>}
                   {history.map((c) => (
                     <div key={c.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100/20 text-sm">
                       <div className="flex justify-between items-center">
                         <span className="font-semibold text-gray-900">{(c.patients as any)?.name || 'Paciente'}</span>
                         <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                       </div>
                       <p className="text-xs text-gray-600 mt-1"><b className="text-gray-900">Síntoma:</b> {c.symptoms || '-'}</p>
                       <p className="text-xs text-gray-600"><b className="text-gray-900">Diag:</b> {c.diagnosis || '-'}</p>
                     </div>
                   ))}
                </div>
            )}
          </div>
        </div>
      </div>
  );
}

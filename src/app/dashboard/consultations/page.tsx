'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRole } from '@/context/RoleContext';
import ConsultationForm from '@/components/ConsultationForm';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Sparkles, Activity, Calendar as CalendarIcon, Heart } from 'lucide-react';

export default function ConsultationsPage() {
  const { role, isLoading } = useRole();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get('patient_id') || undefined;
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(initialPatientId);
  const [patientRecord, setPatientRecord] = useState<any>(null);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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
      setHistory(Array.isArray(data) ? data : []);
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

          const fullRecord = { consultations: cData || [], appointments: aData || [] };
          setPatientRecord(fullRecord);

          if (cData && cData.length > 0) {
             setLoadingSummary(true);
             try {
                const resAI = await fetch('/api/ai/summarize-patient', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify(fullRecord)
                });
                const summaryData = await resAI.json();
                if (summaryData.summary) setAiSummary(summaryData.summary);
             } catch (e) {
                console.error('Error summaries AI:', e);
             } finally {
                setLoadingSummary(false);
             }
          } else {
             setAiSummary(null);
          }
       } catch (err) {
          console.error(err);
       } finally {
          setLoadingRecord(false);
       }
    };
    fetchPatientRecord();
  }, [selectedPatientId, supabase]);

  if (isLoading) return null;

  if (role !== 'doctor') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <Activity size={32} className="text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Acceso Restringido</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          El módulo de consultas clínicas contiene información médica privada. Solo el médico tratante tiene acceso a este módulo.
        </p>
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
                   
                   {/* ✨ AI SUMMARY */}
                   {loadingSummary && (
                      <div className="p-4 bg-blue-50/50 rounded-xl text-xs font-bold text-blue-800 animate-pulse border border-blue-100 flex items-center gap-1.5 shadow-sm">
                         <Sparkles size={14} className="animate-spin text-blue-600"/> Generando Resumen Médico Inteligente...
                      </div>
                   )}
                   {aiSummary && !loadingSummary && (
                      <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/30 p-4 rounded-xl border border-blue-100 shadow-sm mb-1">
                         <div className="flex items-center gap-1 mb-2">
                            <Sparkles size={15} className="text-blue-600 animate-pulse" />
                            <h4 className="text-xs font-black text-blue-900 uppercase">Resumen Ejecutivo de Expediente</h4>
                         </div>
                         <div className="text-[11px] text-blue-950 leading-relaxed font-medium space-y-1 prose prose-sm max-w-none">
                            {aiSummary.split('\n').map((line, ix) => (
                               <p key={ix} className="mb-1">{line}</p>
                            ))}
                         </div>
                      </div>
                   )}

                   {/* 📈 GRÁFICAS */}
                   {mounted && patientRecord.consultations?.length > 1 && (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                         <div className="bg-gray-50/80 p-3 rounded-xl border-[0.5px] border-black/5">
                            <span className="text-[10px] font-black text-gray-500 flex items-center gap-1"><Activity size={12}/> Monitoreo Peso</span>
                            <div className="h-24 mt-2">
                               <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={patientRecord.consultations?.filter((c: any) => c.weight).map((c: any) => ({ date: new Date(c.created_at).toLocaleDateString([], {day: 'numeric', month: 'short'}), peso: Number(c.weight) })).reverse()}>
                                     <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                                     <XAxis dataKey="date" fontSize={7} tickLine={false} />
                                     <YAxis fontSize={7} width={12} tickLine={false} />
                                     <Tooltip contentStyle={{ fontSize: '9px', borderRadius: '6px' }}/>
                                     <Line type="monotone" dataKey="peso" stroke="#1A4A8A" strokeWidth={2} dot={{ r: 1.5 }} />
                                  </LineChart>
                               </ResponsiveContainer>
                            </div>
                         </div>
                         <div className="bg-gray-50/80 p-3 rounded-xl border-[0.5px] border-black/5">
                            <span className="text-[10px] font-black text-gray-500 flex items-center gap-1"><Heart size={12}/> Presión Arterial</span>
                            <div className="h-24 mt-2">
                               <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={patientRecord.consultations?.filter((c: any) => c.blood_pressure && c.blood_pressure.includes('/')).map((c: any) => {
                                     const parts = c.blood_pressure.split('/');
                                     return { date: new Date(c.created_at).toLocaleDateString([], {day: 'numeric', month: 'short'}), sys: Number(parts[0]), dia: Number(parts[1]) };
                                  }).reverse()}>
                                     <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                                     <XAxis dataKey="date" fontSize={7} tickLine={false}/>
                                     <YAxis fontSize={7} width={12} tickLine={false}/>
                                     <Tooltip contentStyle={{ fontSize: '9px' }}/>
                                     <Line type="monotone" dataKey="sys" stroke="#EF4444" strokeWidth={1.5} dot={{ r: 1.5 }} />
                                     <Line type="monotone" dataKey="dia" stroke="#3B82F6" strokeWidth={1.5} dot={{ r: 1.5 }} />
                                  </LineChart>
                               </ResponsiveContainer>
                            </div>
                         </div>
                      </div>
                   )}

                   {patientRecord.consultations?.length === 0 && patientRecord.appointments?.length === 0 && (
                      <p className="text-sm text-gray-400">Sin historial registrado para este paciente.</p>
                   )}

                   {/* Consultas */}
                   {patientRecord.consultations?.length > 0 && (
                      <div>
                         <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1"><Activity size={12}/> Diagnósticos Recientes</h4>
                         <div className="space-y-3">
                            {patientRecord.consultations.map((c: any) => (
                               <div key={c.id} className="p-3.5 bg-gray-50 border-[0.5px] border-black/5 rounded-xl text-sm relative">
                                  <div className="flex justify-between items-center border-b border-black/5 pb-1.5 mb-1.5">
                                     <span className="text-xs font-bold text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <div className="space-y-1">
                                     <p className="text-xs text-gray-600"><span className="font-bold text-gray-900">Síntomas:</span> {c.symptoms || '-'}</p>
                                     <p className="text-xs text-gray-600"><span className="font-bold text-gray-900">Diagnóstico:</span> {c.diagnosis || '-'}</p>
                                     <p className="text-xs text-gray-600"><span className="font-bold text-gray-900">Tratamiento:</span> {c.treatment || '-'}</p>
                                     {(c.weight || c.blood_pressure || c.temperature) && (
                                        <p className="text-[10px] text-gray-500 italic mt-1 border-t border-black/5 pt-1 flex gap-2">
                                           {c.weight && <span><b>Peso:</b> {c.weight}kg</span>} 
                                           {c.blood_pressure && <span><b>P.A:</b> {c.blood_pressure}</span>} 
                                           {c.temperature && <span><b>Temp:</b> {c.temperature}℃</span>}
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
                      <div className="mt-4 border-t border-black/5 pt-3">
                         <h4 className="text-xs font-black text-orange-800 uppercase tracking-wider mb-2 flex items-center gap-1"><CalendarIcon size={12}/> Citas en Agenda</h4>
                         <div className="space-y-2">
                            {patientRecord.appointments.map((a: any) => (
                               <div key={a.id} className="p-2.5 bg-orange-50/30 border-[0.5px] border-orange-100/50 rounded-xl flex justify-between items-center">
                                  <div>
                                     <span className="text-xs font-bold text-gray-800">{a.date} ({a.start_time?.substring(0, 5)})</span>
                                     {a.reason && <p className="text-[10px] text-gray-500 line-clamp-1">{a.reason}</p>}
                                  </div>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md capitalize ${
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
                   {Array.isArray(history) && history.map((c) => (
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

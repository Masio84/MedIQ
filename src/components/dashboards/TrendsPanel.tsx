'use client';

import { useState, useEffect } from 'react';
import FeatureGate from '@/components/FeatureGate';
import { Sparkles, Calendar, User, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface Trend {
    diagnosis: string;
    frequency: number;
    note: string;
}

interface Alert {
    message: string;
    severity: 'high' | 'medium';
}

interface Recommendation {
    action: string;
    priority: 'alta' | 'media' | 'baja';
}

interface Report {
    summary: string;
    trends: Trend[];
    alerts: Alert[];
    recommendations: Recommendation[];
}

export default function TrendsPanel({ clinicId }: { clinicId: string }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
     // Default: Mes actual
     const today = new Date();
     const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
     setDateFrom(firstDay.toISOString().split('T')[0]);
     setDateTo(today.toISOString().split('T')[0]);

     const fetchDoctors = async () => {
         const res = await fetch(`/api/admin/list-users?clinic_id=${clinicId}&role=doctor`);
         const data = await res.json();
         if (data.success) setDoctors(data.users);
     };

     if (clinicId) fetchDoctors();
  }, [clinicId]);

  const handleAnalyze = async () => {
      setLoading(true);
      setError(null);
      try {
          const res = await fetch('/api/ai/analyze-trends', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  clinic_id: clinicId,
                  date_from: dateFrom,
                  date_to: dateTo,
                  doctor_id: doctorId || undefined
              })
          });

          const result = await res.json();
          if (!res.ok || !result.success) throw new Error(result.error || 'Error de analítica');

          setReport(result.report);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  return (
    <FeatureGate feature="ai_trends">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
         <div className="flex items-center gap-2 border-b pb-4">
             <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                 <Sparkles size={20} />
             </div>
             <div>
                 <h2 className="font-bold text-gray-900">Analítica de Tendencias con IA</h2>
                 <p className="text-xs text-gray-400">Genera reportes ejecutivos basados en tus consultas actuales</p>
             </div>
         </div>

         <div className="flex flex-wrap gap-4 items-end">
             <div className="space-y-1">
                 <label className="text-xxs font-black text-gray-400 uppercase flex items-center gap-1">
                     <Calendar size={12} /> Desde
                 </label>
                 <input 
                    type="date" 
                    value={dateFrom} 
                    onChange={e => setDateFrom(e.target.value)}
                    className="text-sm border rounded-lg p-2 focus:outline-none focus:border-blue-500"
                 />
             </div>

             <div className="space-y-1">
                 <label className="text-xxs font-black text-gray-400 uppercase flex items-center gap-1">
                     <Calendar size={12} /> Hasta
                 </label>
                 <input 
                    type="date" 
                    value={dateTo} 
                    onChange={e => setDateTo(e.target.value)}
                    className="text-sm border rounded-lg p-2 focus:outline-none focus:border-blue-500"
                 />
             </div>

             <div className="space-y-1 flex-1 min-w-[200px]">
                 <label className="text-xxs font-black text-gray-400 uppercase flex items-center gap-1">
                     <User size={12} /> Médico
                 </label>
                 <select 
                    value={doctorId} 
                    onChange={e => setDoctorId(e.target.value)}
                    className="w-full text-sm border rounded-lg p-2 focus:outline-none focus:border-blue-500"
                 >
                     <option value="">Todos los médicos</option>
                     {doctors.map(d => (
                         <option key={d.id} value={d.id}>{d.name}</option>
                     ))}
                 </select>
             </div>

             <button 
                onClick={handleAnalyze} 
                disabled={loading}
                className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium h-fit flex items-center gap-1.5 disabled:opacity-50"
             >
                 {loading ? <Sparkles size={16} className="animate-spin" /> : <TrendingUp size={16} />}
                 Generar Reporte
             </button>
         </div>

         {error && (
             <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                 {error}
             </div>
         )}

         {loading && (
             <div className="space-y-4 animate-pulse">
                 <div className="h-20 bg-gray-100 rounded-xl w-full" />
                 <div className="flex gap-4">
                    <div className="h-40 bg-gray-50 rounded-xl flex-1" />
                    <div className="h-40 bg-gray-50 rounded-xl flex-1" />
                 </div>
             </div>
         )}

         {!loading && report && (
             <div className="space-y-6">
                 {/* Resumen */}
                 <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                     <h3 className="text-sm font-bold text-blue-900 mb-1 flex items-center gap-1">
                         <Sparkles size={16} /> Resumen Ejecutivo
                     </h3>
                     <p className="text-sm text-blue-800 leading-relaxed font-medium">{report.summary}</p>
                 </div>

                 <div className="grid md:grid-cols-2 gap-4">
                     {/* Tendencias */}
                     <div className="space-y-3">
                         <h4 className="text-xs font-black text-gray-400 uppercase flex items-center gap-1">
                             Diagnósticos Principales
                         </h4>
                         <div className="space-y-2">
                             {report.trends?.map((t, idx) => (
                                 <div key={idx} className="bg-white border rounded-xl p-3 flex justify-between items-center hover:shadow-sm transition-shadow">
                                     <div className="space-y-0.5">
                                         <span className="text-sm font-semibold text-gray-900">{t.diagnosis}</span>
                                         {t.note && <p className="text-xxs text-gray-400">{t.note}</p>}
                                     </div>
                                     <span className="bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded-md text-xxs">
                                         {t.frequency} {t.frequency === 1 ? 'vez' : 'veces'}
                                     </span>
                                 </div>
                             ))}
                         </div>
                     </div>

                     {/* Alertas */}
                     <div className="space-y-3">
                         <h4 className="text-xs font-black text-gray-400 uppercase flex items-center gap-1">
                              Alertas Operativas
                         </h4>
                         <div className="space-y-2">
                             {report.alerts?.map((a, idx) => (
                                 <div 
                                   key={idx} 
                                   className={`p-3 rounded-xl border-l-4 flex gap-2 ${
                                      a.severity === 'high' 
                                        ? 'bg-red-50/50 border-red-500 border border-y-red-100 border-r-red-100' 
                                        : 'bg-yellow-50/50 border-yellow-500 border border-y-yellow-100 border-r-yellow-100'
                                   }`}
                                 >
                                     <AlertCircle size={16} className={a.severity === 'high' ? 'text-red-600' : 'text-yellow-600'} />
                                     <span className={`text-sm font-medium ${a.severity === 'high' ? 'text-red-900' : 'text-yellow-900'}`}>
                                         {a.message}
                                     </span>
                                 </div>
                             ))}
                         </div>
                     </div>
                 </div>

                 {/* Recomendaciones */}
                 <div className="space-y-3">
                     <h4 className="text-xs font-black text-gray-400 uppercase">
                          Recomendaciones Accionables
                     </h4>
                     <div className="grid sm:grid-cols-2 gap-3">
                         {report.recommendations?.map((r, idx) => {
                             const priorityColors = {
                                 alta: 'text-red-700 font-bold',
                                 media: 'text-yellow-700 font-medium',
                                 baja: 'text-green-700 font-medium'
                             };
                             return (
                                 <div key={idx} className="bg-gray-50 p-3 rounded-xl flex items-start gap-2 border border-gray-100 hover:bg-gray-100/50 transition-colors">
                                     <CheckCircle size={16} className="text-blue-500 mt-0.5" />
                                     <div className="space-y-1">
                                         <p className="text-sm font-medium text-gray-800">{r.action}</p>
                                         <span className={`text-xxs uppercase tracking-wider ${priorityColors[r.priority]}`}>
                                             Prioridad {r.priority}
                                         </span>
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                 </div>

             </div>
         )}
      </div>
    </FeatureGate>
  );
}

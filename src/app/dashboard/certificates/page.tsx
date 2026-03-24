'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRole } from '@/context/RoleContext';
import CertificateForm from '@/components/CertificateForm';
import { FileText, Download, Printer, Loader2, Sparkles, Plus } from 'lucide-react';

export default function CertificatesPage() {
  const { role, isLoading } = useRole();
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get('patient_id') || undefined;
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(initialPatientId);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    let query = supabase
      .from('medical_certificates')
      .select(`
        id,
        certificate_type,
        folio,
        purpose,
        findings,
        conclusion,
        valid_days,
        issued_at,
        expires_at,
        patient_id,
        patients ( name )
      `)
      .order('created_at', { ascending: false });

    if (selectedPatientId) {
      query = query.eq('patient_id', selectedPatientId);
    }

    const { data } = await query;
    setHistory(Array.isArray(data) ? data : []);
    setLoadingHistory(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedPatientId, supabase]);

  if (isLoading) return null;

  const isExpired = (expiresAt: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getTypeName = (type: string) => {
    const map: Record<string, string> = {
      salud_general: 'Salud General',
      incapacidad: 'Incapacidad Laboral',
      aptitud_fisica: 'Aptitud Física'
    };
    return map[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Módulo de Certificados</h1>
          <p className="text-sm text-gray-500">Gestión y emisión de certificados médicos oficiales</p>
        </div>
        {role === 'doctor' && (
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-1 shadow-sm"
          >
            <Plus size={16} />
            {isFormOpen ? 'Ver Historial' : 'Nuevo Certificado'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 items-start">
        {isFormOpen ? (
          <div className="animate-in fade-in-50 duration-200">
            <CertificateForm 
              patientId={selectedPatientId} 
              onSuccess={() => {
                setIsFormOpen(false);
                fetchHistory();
              }} 
            />
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl border border-gray-100/50 shadow-sm animate-in fade-in-50 duration-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-3 mb-4 gap-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                <FileText className="text-blue-500" size={18} /> Historial de Certificados
              </h3>
              
              <div className="w-full md:w-auto">
                 <select 
                   value={selectedPatientId || ''} 
                   onChange={(e) => setSelectedPatientId(e.target.value || undefined)}
                   className="w-full md:w-48 bg-gray-50 border border-gray-100/50 rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none"
                 >
                    <option value="">Todos los Pacientes</option>
                    {/* Unique pacientes in history for grouping or fallback list */}
                    {Array.from(new Set(history.map(c => c.patient_id))).map(id => {
                       const cert = history.find(c => c.patient_id === id);
                       return <option key={id} value={id}>{cert?.patients?.name || 'Paciente'}</option>;
                    })}
                 </select>
              </div>
            </div>

            {loadingHistory && <p className="text-sm text-gray-400">Cargando certificados...</p>}

            {!loadingHistory && history.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No hay certificados registrados aún.</p>
            )}

            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
              {history.map((c) => {
                const expired = isExpired(c.expires_at);
                return (
                  <div key={c.id} className="p-4 bg-gray-50/70 border border-gray-100 rounded-xl text-sm relative hover:shadow-sm transition-all">
                    <div className="flex justify-between items-start mb-2">
                       <div>
                         <span className="text-xs font-black text-gray-400 tracking-wider">Folio: {c.folio}</span>
                         <h4 className="font-bold text-gray-900">{(c.patients as any)?.name || 'Paciente'}</h4>
                       </div>
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${expired ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                         {expired ? 'Vencido' : 'Vigente'}
                       </span>
                    </div>

                    <p className="text-xs text-gray-600 mb-1"><b className="text-gray-900">Tipo:</b> {getTypeName(c.certificate_type)}</p>
                    <p className="text-xs text-gray-600 mb-1"><b className="text-gray-900">Propósito:</b> {c.purpose}</p>
                    <p className="text-xs text-gray-600 mb-1"><b className="text-gray-900">Conclusión:</b> {c.conclusion}</p>

                    <div className="flex justify-between items-center text-[10px] text-gray-500 italic border-t border-black/5 pt-2 mt-2">
                       <span>Expedido: {new Date(c.issued_at).toLocaleDateString()}</span>
                       <span>Vigencia: {c.valid_days} días</span>
                    </div>

                    <div className="absolute bottom-4 right-4 flex gap-2">
                       {/* Se mantiene la descarga client-side generando de nuevo con el Form render simple, 
                           o alternando un trigger en el Form element */}
                       {/* Botón dummy de Descarga para replicar funcionalidad si subiese a Bucket, 
                           en este diseño, se usa para descargar en el editor al guardarlo */}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

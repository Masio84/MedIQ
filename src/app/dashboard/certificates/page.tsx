'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRole } from '@/context/RoleContext';
import CertificateForm from '@/components/CertificateForm';
import { FileText, Download, Printer, Loader2, Sparkles, Plus, Mail, MessageCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function CertificatesPage() {
  const { role, isLoading } = useRole();
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get('patient_id') || undefined;
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(initialPatientId);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [printingCert, setPrintingCert] = useState<any>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

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
        patients ( name ),
        doctor:doctor_id ( name, medical_license, specialty, specialty_license )
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

  const generatePDF = async (cert: any) => {
    setDownloading(cert.id);
    setPrintingCert(cert);

    await new Promise(r => setTimeout(r, 200)); 

    const element = document.getElementById('certificate-print-template');
    if (!element) {
       setDownloading(null);
       return;
    }

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Certificado_${cert.patients?.name?.replace(/ /g, '_') || 'Paciente'}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setDownloading(null);
      setPrintingCert(null);
    }
  };

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

                    <div className="absolute bottom-4 right-4 flex gap-1.5">
                       <button 
                         onClick={() => generatePDF(c)}
                         disabled={!!downloading}
                         className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors flex items-center justify-center bg-white shadow-sm"
                         title="Descargar PDF"
                       >
                          {downloading === c.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                       </button>
                       <button 
                         onClick={() => { alert('Envío por email en desarrollo (Simulado). El PDF se descargará...'); generatePDF(c); }}
                         className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-green-600 transition-colors flex items-center justify-center bg-white shadow-sm"
                         title="Enviar por Email"
                       >
                         <Mail size={14} />
                       </button>
                       <button 
                         onClick={() => { 
                            const text = `Hola, te comparto tu certificado médico Folio: ${c.folio} expedido por MedIQ.`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                         }}
                         className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-teal-600 transition-colors flex items-center justify-center bg-white shadow-sm"
                         title="Compartir WhatsApp"
                       >
                         <MessageCircle size={14} />
                       </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Template oculto para jsPDF y html2canvas */}
      {printingCert && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div id="certificate-print-template" style={{ width: '794px', backgroundColor: '#fff', color: '#1E293B', fontFamily: 'Arial, sans-serif' }} className="p-12 box-border">
             <div className="border-b-2 border-slate-100 pb-4 mb-8">
                <p className="text-xl font-black text-slate-800">MedIQ</p>
                <p className="text-xs text-slate-500">Expediente Clínico Inteligente</p>
             </div>

             <p className="text-right text-[10px] text-slate-400 font-bold mb-4">Fecha: {new Date(printingCert.issued_at).toLocaleDateString('es-MX')}</p>

             <h2 className="text-center font-black text-slate-900 text-base uppercase tracking-wider mb-8 py-2 bg-slate-50 rounded-lg">
                CERTIFICADO MÉDICO — {getTypeName(printingCert.certificate_type)}
             </h2>

             <div className="mb-6">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Datos del Paciente</p>
                <p className="text-sm font-medium"><b className="font-bold">Nombre:</b> {printingCert.patients?.name}</p>
             </div>

             <div className="mb-6 space-y-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Certífico que:</p>
                <p className="text-sm leading-relaxed text-justify">
                   Habiendo practicado la exploración clínica correspondiente al paciente mencionado, se encuentran los siguientes hallazgos:
                </p>
                <p className="text-sm leading-relaxed bg-slate-50 p-4 rounded-lg font-medium text-slate-800">
                   {printingCert.findings || 'Sin hallazgos clínicos particulares registrados.'}
                </p>
                <p className="text-sm">
                   Este certificado se expide para los fines de: <b className="font-bold">{printingCert.purpose || 'Trámite general'}</b>.
                </p>
             </div>

             <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 mb-6">
                <p className="text-sm font-bold text-slate-900">Conclusión:</p>
                <p className="text-base font-black text-slate-800">
                   {printingCert.conclusion}
                </p>
             </div>

             <p className="text-xs text-slate-400 italic mb-12">
                El presente certificado tiene una validez de {printingCert.valid_days} días a partir de la fecha de su expedición.
             </p>

             {printingCert.doctor && (
               <div className="border-t border-slate-200 pt-6 text-center mt-20 max-w-sm mx-auto">
                  <div className="h-16"></div>
                  <p className="text-sm font-black text-slate-900">Dr. {printingCert.doctor.name}</p>
                  <p className="text-xs text-slate-500">Cédula Profesional: {printingCert.doctor.medical_license || 'N/A'}</p>
                  {printingCert.doctor.specialty && (
                     <p className="text-[11px] text-slate-400 mt-0.5">Especialidad: {printingCert.doctor.specialty} | Cédula: {printingCert.doctor.specialty_license}</p>
                  )}
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}

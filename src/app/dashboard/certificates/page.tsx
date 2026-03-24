'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRole } from '@/context/RoleContext';
import CertificateForm from '@/components/CertificateForm';
import { FileText, Download, Printer, Loader2, Sparkles, Plus, Mail, MessageCircle, CheckCircle, XCircle } from 'lucide-react';
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

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailTargetCert, setEmailTargetCert] = useState<any>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const triggerToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const generatePDF = async (cert: any) => {
    setDownloading(cert.id);

    const element = document.getElementById(`certificate-print-template-${cert.id}`);
    if (!element) {
       triggerToast('No se encontró la plantilla para generar el PDF.', 'error');
       setDownloading(null);
       return;
    }

    try {
      const canvas = await html2canvas(element, { scale: 1.5, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Certificado_${cert.patients?.name?.replace(/ /g, '_') || 'Paciente'}.pdf`);
      triggerToast('Certificado descargado correctamente', 'success');
    } catch (err) {
      console.error('Error generando PDF:', err);
      triggerToast('Error al generar el PDF.', 'error');
    } finally {
      setDownloading(null);
    }
  };

  const sendEmail = async (cert: any, inputEmail: string) => {
    setSendingEmail(cert.id);
    const element = document.getElementById(`certificate-print-template-${cert.id}`);
    if (!element) {
       triggerToast('No se encontró la plantilla para adjuntar el PDF.', 'error');
       setSendingEmail(null);
       return;
    }
    try {
      const canvas = await html2canvas(element, { scale: 1.2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 0.7); 
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      const pdfBase64 = pdf.output('datauristring');

      const response = await fetch('/api/email/send', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            email: inputEmail,
            folio: cert.folio,
            pdfBase64: pdfBase64,
            patientName: cert.patients?.name || 'Paciente'
         })
      });

      const res = await response.json();
      if (res.success) {
         triggerToast('Certificado enviado correctamente', 'success');
         setIsEmailModalOpen(false);
      } else {
         triggerToast('Error al enviar el certificado. Intenta de nuevo.', 'error');
      }
    } catch (err: any) {
      console.error('Error enviando correo:', err);
      triggerToast('Error al enviar el certificado. Intenta de nuevo.', 'error');
    } finally {
      setSendingEmail(null);
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

                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-black/5 justify-end">
                       <button 
                         onClick={() => generatePDF(c)}
                         disabled={!!downloading}
                         className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-bold px-3 py-2 rounded-lg shadow-sm transition-all disabled:opacity-50"
                       >
                          {downloading === c.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                          Descargar PDF
                       </button>

                       <button 
                         onClick={() => { 
                            setEmailTargetCert(c); 
                            setEmailInput(''); 
                            setIsEmailModalOpen(true); 
                         }}
                         className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-2 rounded-lg shadow-sm transition-all"
                       >
                         <Mail size={13} />
                         Email
                       </button>

                       <button 
                         onClick={() => { 
                            const text = `Hola, te comparto tu certificado médico Folio: ${c.folio} expedido por MedIQ.`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                         }}
                         className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold px-3 py-2 rounded-lg shadow-sm transition-all"
                       >
                         <MessageCircle size={13} />
                         WhatsApp
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
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {history.map(c => (
          <div key={`print-${c.id}`} id={`certificate-print-template-${c.id}`} style={{ width: '794px', backgroundColor: '#ffffff', color: '#1E293B', fontFamily: 'Arial, sans-serif', padding: '48px', boxSizing: 'border-box', marginBottom: '40px' }}>
             <div style={{ borderBottom: '2px solid #E2E8F0', paddingBottom: '16px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                   <p style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B', margin: 0 }}>MedIQ</p>
                   <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Expediente Clínico Inteligente</p>
                </div>
                {c.folio && <p style={{ fontSize: '12px', fontWeight: '900', color: '#94A3B8', margin: 0 }}>Folio: {c.folio}</p>}
             </div>

             <p style={{ textAlign: 'right', fontSize: '10px', color: '#94A3B8', fontWeight: 'bold', marginBottom: '16px' }}>
               Fecha: {c.issued_at ? new Date(c.issued_at).toLocaleDateString('es-MX') : 'N/A'}
             </p>

             <h2 style={{ textAlign: 'center', fontWeight: '900', color: '#0F172A', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '32px', paddingTop: '8px', paddingBottom: '8px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                CERTIFICADO MÉDICO — {getTypeName(c.certificate_type)}
             </h2>

             <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', margin: 0 }}>
                  Datos del Paciente
                </p>
                <p style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>
                  <b style={{ fontWeight: 'bold' }}>Nombre:</b> {c.patients?.name}
                </p>
             </div>

             <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', margin: 0 }}>
                  Certífico que:
                </p>
                <p style={{ fontSize: '14px', lineHeight: '1.6', textAlign: 'justify', marginBottom: '12px', margin: '0 0 12px 0' }}>
                   Habiendo practicado la exploración clínica correspondiente al paciente mencionado, se encuentran los siguientes hallazgos:
                </p>
                <p style={{ fontSize: '14px', lineHeight: '1.6', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', fontWeight: '500', color: '#1E293B', whiteSpace: 'pre-wrap', marginBottom: '12px', margin: '0 0 12px 0', border: '1px solid #F1F5F9' }}>
                   {c.findings || 'Sin hallazgos clínicos particulares registrados.'}
                </p>
                <p style={{ fontSize: '14px', margin: 0 }}>
                   Este certificado se expide para los fines de: <b style={{ fontWeight: 'bold' }}>{c.purpose || 'Trámite general'}</b>.
                </p>
             </div>

             <div style={{ backgroundColor: '#F1F5F9', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
                <p style={{ fontSize: '14px', color: '#0F172A', fontWeight: 'bold', margin: '0 0 4px 0' }}>Conclusión:</p>
                <p style={{ fontSize: '16px', fontWeight: '900', color: '#1E293B', margin: 0 }}>
                   {c.conclusion}
                </p>
             </div>

             <p style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic', marginBottom: '48px' }}>
                El presente certificado tiene una validez de {c.valid_days} días a partir de la fecha de su expedición.
             </p>

             {c.doctor && (
               <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '24px', textAlign: 'center', marginTop: '80px', maxWidth: '384px', marginLeft: 'auto', marginRight: 'auto' }}>
                  <div style={{ height: '64px' }}></div>
                  <p style={{ fontSize: '14px', fontWeight: '900', color: '#0F172A', margin: '0 0 2px 0' }}>Dr. {c.doctor.name}</p>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 2px 0' }}>Cédula Profesional: {c.doctor.medical_license || 'N/A'}</p>
                  {c.doctor.specialty && (
                     <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', margin: 0 }}>Especialidad: {c.doctor.specialty} | Cédula: {c.doctor.specialty_license}</p>
                  )}
               </div>
             )}
          </div>
        ))}
      </div>

      {/* Modal para solicitar Email del paciente */}
      {isEmailModalOpen && emailTargetCert && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
             <h3 className="font-bold text-lg text-gray-900 flex items-center gap-1.5"><Mail className="text-blue-500" size={18}/> Enviar Certificado</h3>
             <p className="text-xs text-gray-500">Ingresa el correo electrónico del paciente para enviarle el PDF del certificado.</p>
             
             <div>
               <label className="block text-xs font-medium text-gray-500 mb-1">Correo Electrónico *</label>
               <input 
                 type="email" 
                 placeholder="ejemplo@correo.com" 
                 value={emailInput} 
                 onChange={(e) => setEmailInput(e.target.value)}
                 className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none"
               />
             </div>

             <div className="flex gap-2 pt-2">
               <button 
                 onClick={() => setIsEmailModalOpen(false)}
                 className="flex-1 py-2 border border-gray-100 font-medium hover:bg-gray-50 rounded-xl text-xs text-gray-700"
               >
                 Cancelar
               </button>
               <button 
                 onClick={() => sendEmail(emailTargetCert, emailInput)}
                 disabled={!emailInput || !!sendingEmail}
                 className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-1 disabled:opacity-50"
               >
                 {sendingEmail === emailTargetCert.id ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                 Enviar
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Notificación Toast */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
           {toast.type === 'success' ? <CheckCircle size={18}/> : <XCircle size={18}/>}
           <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

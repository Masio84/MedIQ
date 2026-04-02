'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Search, 
  Filter, 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  Hash,
  Loader2,
  X,
  MessageCircle,
  Mail,
  MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';

import CertDocumentPreview from '@/components/certificates/preview/CertDocumentPreview';
import { CertPreviewTemplateContext, CertPreviewDataContext } from '@/components/certificates/preview/CertPreviewContext';
import { generateCertificatePDF } from '@/components/certificates/utils/cert-pdf-generator';
import { shareCertificateViaWhatsApp } from '@/components/certificates/utils/cert-sharing-engine';

export default function CertificatesArchivePage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    fetchCertificates();
  }, [supabase]);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('medical_certificates')
        .select(`
          *,
          patients (
            name,
            last_name,
            gender,
            birthdate,
            email,
            phone
          ),
          profiles:doctor_id (
            name,
            specialty,
            medical_license,
            specialty_license,
            clinic_name,
            clinic_address,
            clinic_phone
          )
        `)
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
    } catch (error: any) {
      console.error('Error fetching certificates:', error);
      toast.error('Error al cargar historial de certificados');
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = certificates.filter(c => {
    const patientName = `${c.patients?.name || ''} ${c.patients?.last_name || ''}`.toLowerCase();
    const folio = (c.folio || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return patientName.includes(search) || folio.includes(search);
  });

  const handleView = (doc: any) => {
    setSelectedDoc(doc);
    setIsPreviewOpen(true);
  };

  const reconstructContextData = (doc: any) => {
    if (!doc) return null;
    const calculateAge = (birthdate: string) => {
      if (!birthdate) return 'N/A';
      const diff = Date.now() - new Date(birthdate).getTime();
      return Math.floor(diff / 31557600000).toString(); 
    };

    return {
      patient: {
        name: doc.patients?.name || 'Nombre Paciente',
        age: doc.patients ? calculateAge(doc.patients.birthdate) : 'XX',
        gender: doc.patients?.gender || 'Sexo',
        folio: doc.folio,
        date: new Date(doc.created_at).toLocaleDateString('es-MX'),
      },
      doctor: {
        name: doc.profiles?.name || 'Doctor',
        specialty: doc.profiles?.specialty || 'Especialidad',
        cedula: doc.profiles?.medical_license || 'CED',
        specialtyCedula: doc.profiles?.specialty_license || 'CEP',
      },
      clinic: {
        name: doc.profiles?.clinic_name || 'Clínica',
        address: doc.profiles?.clinic_address || 'Dirección Completa',
        phone: doc.profiles?.clinic_phone || 'Teléfono',
      },
      purpose: doc.purpose,
      findings: doc.findings,
      conclusion: doc.conclusion,
      validDays: doc.valid_days
    };
  };

  const handleDownload = async (doc: any) => {
    setIsGenerating(true);
    const t = toast.loading('Generando PDF...');
    try {
      if (!doc.template_snapshot) throw new Error("Plantilla no encontrada");
      await generateCertificatePDF(doc.template_snapshot, `cert-hidden-canvas-${doc.id}`, doc.folio);
      toast.success('PDF descargado', { id: t });
    } catch (error) {
      toast.error('Error al generar PDF', { id: t });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsApp = (doc: any) => {
    if (!doc.patients?.phone) {
      toast.warning('El paciente no tiene número registrado');
      return;
    }
    shareCertificateViaWhatsApp(doc.patients.phone, doc.folio, doc.patient_id);
  };

  const handleEmail = (doc: any) => {
    if (!doc.patients?.email) {
      toast.warning('El paciente no tiene correo electrónico registrado');
      return;
    }
    const mailto = `mailto:${doc.patients.email}?subject=Certificado Médico ${doc.folio}&body=Hola ${doc.patients.name},%0D%0A%0D%0AAdjunto a este correo su certificado médico (Folio: ${doc.folio}).%0D%0A%0D%0ASaludos.`;
    window.location.href = mailto;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-blue-600" /> Historial de Certificados
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualiza y gestiona todos los certificados médicos emitidos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Buscar por paciente o folio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 w-full md:w-72 shadow-inner-sm transition-all"
            />
          </div>
          <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all shadow-sm">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 flex flex-col items-center justify-center text-gray-400 shadow-sm">
          <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
          <p className="text-sm font-medium">Buscando certificados...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 flex flex-col items-center justify-center text-gray-400 shadow-sm text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <FileText size={32} strokeWidth={1.5} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No se encontraron certificados</h3>
          <p className="text-sm text-gray-500 max-w-md">
            {searchTerm 
              ? `No se encontraron coincidencias para "${searchTerm}" en tu historial.` 
              : 'Aún no has emitido ningún certificado médico.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col relative group">
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Hash size={14} />
                  </div>
                  <span className="font-mono text-sm font-black text-gray-700">{doc.folio}</span>
                </div>
                <span className={`px-2 py-1 space-x-1 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center
                  ${doc.certificate_type === 'incapacidad' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}
                `}>
                  {doc.certificate_type === 'incapacidad' ? 'Incapacidad' : doc.certificate_type === 'salud_general' ? 'Salud' : 'Aptitud'}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                  <User size={18} />
                </div>
                <div className="truncate">
                  <p className="text-sm font-bold text-gray-900 leading-tight truncate">
                    {doc.patients?.name} {doc.patients?.last_name}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                    <Calendar size={12} />
                    {new Intl.DateTimeFormat('es-MX', { 
                      day: '2-digit', month: 'short', year: 'numeric'
                    }).format(new Date(doc.created_at))}
                  </div>
                </div>
              </div>

              <div className="mt-auto grid grid-cols-4 gap-2 border-t border-gray-50 pt-4">
                <button 
                  onClick={() => handleView(doc)}
                  className="flex items-center justify-center p-2.5 text-blue-600 bg-blue-50/50 hover:bg-blue-100 rounded-xl transition-colors tooltip-trigger"
                  title="Vista Previa"
                >
                  <Eye size={16} />
                </button>
                <button 
                  onClick={() => handleDownload(doc)}
                  className="flex items-center justify-center p-2.5 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100 rounded-xl transition-colors tooltip-trigger"
                  title="Descargar PDF"
                >
                  <Download size={16} />
                </button>
                <button 
                  onClick={() => handleWhatsApp(doc)}
                  disabled={!doc.patients?.phone}
                  className="flex items-center justify-center p-2.5 text-green-600 bg-green-50/50 hover:bg-green-100 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-green-50/50 tooltip-trigger"
                  title={doc.patients?.phone ? "Enviar por WhatsApp" : "No hay teléfono"}
                >
                  <MessageCircle size={16} />
                </button>
                <button 
                  onClick={() => handleEmail(doc)}
                  disabled={!doc.patients?.email}
                  className="flex items-center justify-center p-2.5 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-indigo-50/50 tooltip-trigger"
                  title={doc.patients?.email ? "Enviar por Email" : "No hay correo electrónico"}
                >
                  <Mail size={16} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Visually hidden container for PDF generation tracking template structure */}
      <div className="hidden">
        {certificates.map(doc => {
          if (!doc.template_snapshot) return null;
          return (
            <div id={`cert-hidden-canvas-${doc.id}`} key={doc.id}>
               <CertPreviewTemplateContext.Provider value={doc.template_snapshot}>
                 <CertPreviewDataContext.Provider value={reconstructContextData(doc)}>
                   <CertDocumentPreview zoom={1} showRules={false} showGrid={false} />
                 </CertPreviewDataContext.Provider>
               </CertPreviewTemplateContext.Provider>
            </div>
          )
        })}
      </div>

      {/* Modal de Vista Previa */}
      {isPreviewOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-white/20">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">Certificado: {selectedDoc.folio}</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
                    Registro Inmutable de {new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(new Date(selectedDoc.created_at))}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDownload(selectedDoc)}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm"
                >
                  {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  DESCARGAR PDF
                </button>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-gray-100/50 p-8 custom-scrollbar">
               <CertPreviewTemplateContext.Provider value={selectedDoc.template_snapshot}>
                 <CertPreviewDataContext.Provider value={reconstructContextData(selectedDoc)}>
                   <CertDocumentPreview zoom={0.7} showRules={false} showGrid={false} />
                 </CertPreviewDataContext.Provider>
               </CertPreviewTemplateContext.Provider>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

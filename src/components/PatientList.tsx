'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { 
  Calendar, Phone, Mail, FileText, User, Search, History, Pill, ClipboardCheck,
  ChevronRight, AlertCircle, Hash, Droplets, Activity, ChevronDown, ChevronUp,
  X, Clock, Edit3, MessageSquare, AlertTriangle, Eye, Download, Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRole } from '@/context/RoleContext';
import ConsultationForm from './ConsultationForm';
import DocumentPreview from './prescriptions/preview/DocumentPreview';
import { PreviewTemplateContext, PreviewDataContext } from './prescriptions/preview/PreviewContext';
import { generatePrescriptionPDF } from './prescriptions/utils/pdf-generator';
import { toast } from 'sonner';
import FullRecordReport from './reports/FullRecordReport';
import { generateFullRecordPDF } from './reports/utils/report-generator';

// --- SUB-COMPONENTS MEMOIZED ---

const BackgroundSection = memo(({ title, content, type, expanded, onToggle }: any) => (
  <div className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all shadow-sm">
    <button 
      onClick={() => onToggle(type)}
      className="w-full flex justify-between items-center group"
    >
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
        <Activity size={12} className="text-blue-500" /> {title}
      </p>
      {expanded === type ? <ChevronUp size={16} className="text-gray-300" /> : <ChevronDown size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />}
    </button>
    {expanded === type && (
      <div className="mt-3 pt-3 border-t border-gray-50 animate-in slide-in-from-top-1 duration-200">
        <p className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">
          {content || 'Sin antecedentes registrados.'}
        </p>
      </div>
    )}
  </div>
));

const ConsultationCard = memo(({ consultation, prescriptions, onFetchHistory, onEdit, onPreviewPrescription, role }: any) => {
  const hasPrescription = prescriptions.find((p: any) => p.consultation_id === consultation.id);
  const formattedDate = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(consultation.created_at));

  return (
    <div className="relative group">
      <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full border-4 border-white bg-gray-900 shadow-sm z-10 transition-transform group-hover:scale-125" />
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
              <Calendar size={12} /> {formattedDate}
            </p>
            <h4 className="text-base font-black text-gray-900">Consulta Médica</h4>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onFetchHistory(consultation.id)}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-all"
              title="Ver historial de cambios"
            >
              <MessageSquare size={16} />
            </button>
            {hasPrescription && (
              <button 
                onClick={() => onPreviewPrescription(hasPrescription)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-green-600 transition-all"
                title="Ver Receta Asociada"
              >
                <Pill size={16} />
              </button>
            )}
            {role === 'doctor' && (
              <button 
                onClick={() => onEdit(consultation.id)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-amber-600 transition-all"
                title="Editar consulta"
              >
                <Edit3 size={16} />
              </button>
            )}
            <span className="bg-gray-100 text-gray-600 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ml-2">Folio: {consultation.id.split('-')[0]}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {consultation.symptoms && (
            <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
              <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Motivo / Síntomas</p>
              <p className="text-xs font-medium text-gray-700 leading-normal">{consultation.symptoms}</p>
            </div>
          )}
          {consultation.diagnosis && (
            <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/50">
              <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Diagnóstico</p>
              <p className="text-xs font-black text-gray-900 leading-normal">{consultation.diagnosis}</p>
            </div>
          )}
          {consultation.treatment && (
            <div className="md:col-span-2 bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/50">
              <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Tratamiento Planificado</p>
              <p className="text-xs font-medium text-gray-700 leading-relaxed italic">"{consultation.treatment}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const PrescriptionRow = memo(({ prescription, onPreview }: any) => (
  <tr className="hover:bg-blue-50/30 transition-colors group border-b border-gray-50 last:border-0 text-sm">
    <td className="px-6 py-4 font-mono text-[10px] font-black text-blue-600 uppercase">#{prescription.folio}</td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        <div className="p-1 bg-yellow-50 text-yellow-600 rounded">
          <Calendar size={10} />
        </div>
        <span className="font-bold text-gray-700">{new Date(prescription.created_at).toLocaleDateString()}</span>
      </div>
    </td>
    <td className="px-6 py-4 text-right">
      <button 
        onClick={() => onPreview(prescription)}
        className="px-3 py-1.5 bg-gray-100 text-gray-900 rounded-lg text-[10px] font-black uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm flex items-center gap-2 ml-auto"
      >
        <Eye size={12} /> Ver Receta
      </button>
    </td>
  </tr>
));

export type Patient = {
  id: string;
  name: string;
  last_name?: string;
  birthdate?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  allergies?: string;
  medical_history?: string;
  curp?: string;
  blood_type?: string;
  hereditary_background?: any;
  personal_pathological_background?: any;
  non_pathological_background?: any;
  gyneco_obstetric_background?: any;
  created_at: string;
};

type TabType = 'general' | 'history' | 'prescriptions' | 'certificates';

export default function PatientList({ role }: { role: 'admin' | 'doctor' | 'assistant' | 'superadmin' | undefined }) {
  const supabase = useMemo(() => createClient(), []);
  const { doctorId: contextDoctorId } = useRole();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [expandedBg, setExpandedBg] = useState<string | null>(null);
  
  // Data for tabs
  const [consultations, setConsultations] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Editing and History States
  const [editingConsultationId, setEditingConsultationId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [consultationHistory, setConsultationHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Prescription Preview State
  const [selectedPrescription, setSelectedPrescription] = useState<any | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleDownloadPrescription = useCallback(async (prescription: any) => {
    setIsGeneratingPDF(true);
    const t = toast.loading('Generando PDF profesional...');
    try {
      await generatePrescriptionPDF(prescription.template_snapshot, 'prescription-timeline-canvas');
      toast.success('PDF descargado correctamente', { id: t });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF', { id: t });
    } finally {
      setIsGeneratingPDF(false);
    }
  }, []);

  const handleExportFullRecord = useCallback(async () => {
    if (!selectedPatient) return;
    setIsGeneratingReport(true);
    const t = toast.loading('Generando Expediente Integral...');
    try {
      await generateFullRecordPDF(selectedPatient.name, 'full-record-report-content');
      toast.success('Expediente exportado correctamente', { id: t });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Error al exportar el expediente', { id: t });
    } finally {
      setIsGeneratingReport(false);
    }
  }, [selectedPatient]);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/patients/list');
    const result = await res.json();
    if (result?.success && Array.isArray(result.data)) {
      setPatients(result.data);
    }
    setLoading(false);
  }, []);

  const fetchPatientData = useCallback(async (patientId: string) => {
    setLoadingData(true);
    try {
      // Fetch Consultations
      const { data: consData } = await supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      setConsultations(consData || []);

      // Fetch Prescriptions
      const { data: presData } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      setPrescriptions(presData || []);

      // Fetch Certificates
      const { data: certData } = await supabase
        .from('medical_certificates')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      setCertificates(certData || []);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    }
    setLoadingData(false);
  }, [supabase]);

  const fetchConsultationHistory = useCallback(async (consultationId: string) => {
    setLoadingHistory(true);
    setViewingHistoryId(consultationId);
    try {
      const { data, error } = await supabase
        .from('consultation_history')
        .select(`
          *,
          modifier:profiles(name, last_name)
        `)
        .eq('consultation_id', consultationId)
        .order('modified_at', { ascending: false });
      
      if (error) throw error;
      setConsultationHistory(data || []);
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientData(selectedPatient.id);
      setActiveTab('general');
      setExpandedBg(null);
    }
  }, [selectedPatient, fetchPatientData]);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.last_name && p.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [patients, searchTerm]);

  const handleToggleBg = useCallback((type: string) => {
    setExpandedBg(prev => prev === type ? null : type);
  }, []);

  const handleEditConsultation = useCallback((id: string) => {
    setEditingConsultationId(id);
    setIsEditModalOpen(true);
  }, []);

  const handlePreviewPrescription = useCallback((prescription: any) => {
    setSelectedPrescription(prescription);
    setIsPreviewModalOpen(true);
  }, []);

  const calculateAge = (birthdate?: string) => {
    if (!birthdate) return 'N/A';
    const birth = new Date(birthdate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const renderBackground = (title: string, data: any, id: string) => {
    if (!data) return null;
    const isExpanded = expandedBg === id;
    
    // Convert object to list of true values
    const details = Object.entries(data)
      .filter(([key, val]) => val === true)
      .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'));
    
    const otherText = data.other || data.fur || data.medicines || "";

    return (
      <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm transition-all">
        <button 
          onClick={() => setExpandedBg(isExpanded ? null : id)}
          className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors"
        >
          <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{title}</span>
          {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </button>
        {isExpanded && (
          <div className="p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            {details.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {details.map(d => (
                  <span key={d} className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md uppercase">{d}</span>
                ))}
              </div>
            ) : !otherText && <p className="text-xs text-gray-400 italic">Sin hallazgos positivos.</p>}
            {otherText && (
              <div className="mt-2">
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Observaciones</p>
                <p className="text-xs text-gray-700 font-medium">{otherText}</p>
              </div>
            )}
            {id === 'gyneco' && (data.pregnancies || data.births) && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div><p className="text-[9px] font-black text-gray-400 uppercase">Gestas</p><p className="text-xs font-bold text-gray-900">{data.pregnancies || 0}</p></div>
                <div><p className="text-[9px] font-black text-gray-400 uppercase">Partos</p><p className="text-xs font-bold text-gray-900">{data.births || 0}</p></div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[600px]">
      {/* List Sidebar */}
      <div className="w-full lg:w-80 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Buscar paciente..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/5 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-8 text-center"><p className="text-xs text-gray-400 font-medium">No se encontraron pacientes.</p></div>
          ) : (
            filteredPatients.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPatient(p)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${
                  selectedPatient?.id === p.id 
                    ? 'bg-gray-900 text-white shadow-md shadow-gray-200' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    selectedPatient?.id === p.id ? 'bg-white/10' : 'bg-gray-100'
                  }`}>
                    <User size={18} className={selectedPatient?.id === p.id ? 'text-white' : 'text-gray-400'} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold truncate max-w-[150px] leading-tight">{p.name} {p.last_name}</p>
                    <p className={`text-[10px] font-medium mt-0.5 ${selectedPatient?.id === p.id ? 'text-white/60' : 'text-gray-400'}`}>
                      {p.phone || 'Sin teléfono'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                  selectedPatient?.id === p.id ? 'text-white' : 'text-gray-300'
                }`} />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail Content */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        {selectedPatient ? (
          <>
            {/* Detail Header */}
            <div className="p-6 border-b border-gray-50 bg-gray-50/20">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedPatient.name} {selectedPatient.last_name}</h2>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest leading-none">
                      ID: {selectedPatient.id.split('-')[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                    <span className="flex items-center gap-1.5 font-bold"><Calendar size={13} className="text-gray-300" /> {calculateAge(selectedPatient.birthdate)} años</span>
                    <span className="flex items-center gap-1.5 font-bold"><Clock size={13} className="text-gray-300" /> Alta: {new Date(selectedPatient.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {role === 'doctor' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleExportFullRecord}
                      disabled={isGeneratingReport}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl text-[10px] font-black transition-all flex items-center gap-2 shadow-sm uppercase tracking-widest"
                    >
                      {isGeneratingReport ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
                      Exportar Expediente
                    </button>
                    <button 
                      onClick={() => window.location.href = `/dashboard/consultations?patient_id=${selectedPatient.id}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black transition-all flex items-center gap-2 shadow-sm uppercase tracking-widest"
                    >
                      <Activity size={14} /> Nueva Consulta
                    </button>
                    <button 
                      onClick={() => window.location.href = `/dashboard/certificates?patient_id=${selectedPatient.id}`}
                      className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-[10px] font-black transition-all flex items-center gap-2 shadow-sm uppercase tracking-widest"
                    >
                      <FileText size={14} /> Emitir Certificado
                    </button>
                  </div>
                )}
              </div>

              {/* Tabs Navigation */}
              <div className="flex gap-1 mt-8 p-1 bg-gray-100/50 rounded-xl w-fit">
                {(['general', 'history', 'prescriptions', 'certificates'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 rounded-lg text-xs font-black transition-all uppercase tracking-widest ${
                      activeTab === tab 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-400 hover:text-gray-500'
                    }`}
                  >
                    {tab === 'general' && <span className="flex items-center gap-2"><User size={14} /> General</span>}
                    {tab === 'history' && <span className="flex items-center gap-2"><History size={14} /> Historial</span>}
                    {tab === 'prescriptions' && <span className="flex items-center gap-2"><Pill size={14} /> Recetas</span>}
                    {tab === 'certificates' && <span className="flex items-center gap-2"><ClipboardCheck size={14} /> Certificados</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Panels */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
              {activeTab === 'general' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                  {/* Personal Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/30">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Información de Contacto</p>
                      <div className="space-y-2 mt-3">
                        <p className="text-sm font-bold flex items-center gap-2 text-gray-700"><Phone size={14} className="text-gray-300" /> {selectedPatient.phone || 'No especificado'}</p>
                        <p className="text-sm font-bold flex items-center gap-2 text-gray-700 truncate"><Mail size={14} className="text-gray-300" /> {selectedPatient.email || 'No especificado'}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/30">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Datos Identificativos</p>
                      <div className="space-y-2 mt-3">
                        <p className="text-sm font-bold flex items-center gap-2 text-gray-700"><Hash size={14} className="text-gray-300" /> CURP: {selectedPatient.curp || 'No reg.'}</p>
                        <p className="text-sm font-bold flex items-center gap-2 text-gray-700"><Droplets size={14} className="text-red-300" /> Sangre: {selectedPatient.blood_type || 'N/A'}</p>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border ${selectedPatient.allergies ? 'border-red-100 bg-red-50/50' : 'border-gray-100 bg-gray-50/30'}`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedPatient.allergies ? 'text-red-400' : 'text-gray-400'}`}>Alergias Críticas</p>
                      <div className="mt-3 flex items-start gap-2">
                        {selectedPatient.allergies ? (
                          <>
                            <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                            <p className="text-sm font-black text-red-600 leading-tight">{selectedPatient.allergies}</p>
                          </>
                        ) : (
                          <p className="text-sm font-bold text-gray-400">Ninguna reportada</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* NOM-004 Backgrounds */}
                  <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BackgroundSection 
                      title="Heredo-Familiares" 
                      content={selectedPatient.hereditary_background} 
                      type="hereditary" 
                      expanded={expandedBg} 
                      onToggle={handleToggleBg} 
                    />
                    <BackgroundSection 
                      title="Personales Patológicos" 
                      content={selectedPatient.personal_pathological_background} 
                      type="patho" 
                      expanded={expandedBg} 
                      onToggle={handleToggleBg} 
                    />
                    <BackgroundSection 
                      title="No Patológicos" 
                      content={selectedPatient.non_pathological_background} 
                      type="nonpatho" 
                      expanded={expandedBg} 
                      onToggle={handleToggleBg} 
                    />
                    <BackgroundSection 
                      title="Gineco-Obstétricos" 
                      content={selectedPatient.gyneco_obstetric_background} 
                      type="gyneco" 
                      expanded={expandedBg} 
                      onToggle={handleToggleBg} 
                    />
                  </div>
                  </div>

                  {/* General History */}
                  <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50/30">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Notas de Historial General</p>
                    <div className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {selectedPatient.medical_history || 'Sin notas adicionales.'}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {loadingData ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>
                  ) : consultations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <History size={30} className="text-gray-200" />
                      </div>
                      <p className="text-gray-400 text-sm font-bold">Sin historial de consultas.</p>
                    </div>
                  ) : (
                    <div className="relative pl-8 space-y-8 before:absolute before:inset-0 before:left-[15px] before:w-[2px] before:bg-gray-100/60 pb-8">
                       {consultations.map((c) => (
                         <div key={c.id} className="relative group">
                            <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full border-4 border-white bg-gray-900 shadow-sm z-10 transition-transform group-hover:scale-125" />
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
                               <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                      <Calendar size={12} /> {new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(c.created_at))}
                                    </p>
                                    <h4 className="text-base font-black text-gray-900">Consulta Médica</h4>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => fetchConsultationHistory(c.id)}
                                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-all"
                                      title="Ver historial de cambios"
                                    >
                                      <MessageSquare size={16} />
                                    </button>
                                    {/* Cross-link to prescription */}
                                    {prescriptions.find(p => p.consultation_id === c.id) && (
                                      <button 
                                        onClick={() => {
                                          const pres = prescriptions.find(p => p.consultation_id === c.id);
                                          setSelectedPrescription(pres);
                                          setIsPreviewModalOpen(true);
                                        }}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-green-600 transition-all"
                                        title="Ver Receta Asociada"
                                      >
                                        <Pill size={16} />
                                      </button>
                                    )}
                                    {role === 'doctor' && (
                                      <button 
                                        onClick={() => {
                                          setEditingConsultationId(c.id);
                                          setIsEditModalOpen(true);
                                        }}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-amber-600 transition-all"
                                        title="Editar consulta"
                                      >
                                        <Edit3 size={16} />
                                      </button>
                                    )}
                                    <span className="bg-gray-100 text-gray-600 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ml-2">Folio: {c.id.split('-')[0]}</span>
                                  </div>
                               </div>
                               
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {c.symptoms && (
                                    <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                                      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Motivo / Síntomas</p>
                                      <p className="text-xs font-medium text-gray-700 leading-normal">{c.symptoms}</p>
                                    </div>
                                  )}
                                  {c.diagnosis && (
                                    <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/50">
                                      <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Diagnóstico</p>
                                      <p className="text-xs font-black text-gray-900 leading-normal">{c.diagnosis}</p>
                                    </div>
                                  )}
                                  {c.treatment && (
                                    <div className="col-span-full bg-gray-50 p-4 rounded-xl border border-gray-100">
                                      <p className="text-[9px] font-black text-gray-400 uppercase mb-2 flex items-center gap-1.5"><Pill size={12} className="text-blue-500" /> Plan de Tratamiento</p>
                                      <p className="text-xs font-medium text-gray-600 whitespace-pre-wrap leading-relaxed">{c.treatment}</p>
                                    </div>
                                  )}
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'prescriptions' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {loadingData ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>
                  ) : prescriptions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Pill size={30} className="text-gray-200" />
                      </div>
                      <p className="text-gray-400 text-sm font-bold">Sin recetas emitidas.</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Folio</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha de Emisión</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {prescriptions.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                              <td className="px-6 py-4 font-mono text-blue-600 font-bold text-xs">{p.folio}</td>
                              <td className="px-6 py-4 text-xs font-bold text-gray-600">
                                {new Date(p.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => {
                                    setSelectedPrescription(p);
                                    setIsPreviewModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 bg-gray-100 text-gray-900 rounded-lg text-[10px] font-black uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm flex items-center gap-2 ml-auto"
                                >
                                  <Eye size={12} /> Ver Receta
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'certificates' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {loadingData ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>
                  ) : certificates.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ClipboardCheck size={30} className="text-gray-200" />
                      </div>
                      <p className="text-gray-400 text-sm font-bold">Sin certificados médicos.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {certificates.map((cert) => (
                        <div key={cert.id} className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex justify-between items-center group hover:border-blue-200 hover:shadow-md transition-all">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded uppercase tracking-widest">{cert.folio}</span>
                              <p className="text-[10px] font-bold text-gray-400">
                                {new Date(cert.issued_at).toLocaleDateString()}
                              </p>
                            </div>
                            <h5 className="text-sm font-black text-gray-900 leading-tight">{cert.certificate_type || 'Certificado Médico'}</h5>
                            <p className="text-[10px] text-gray-400 mt-1 line-clamp-1 italic">{cert.purpose || 'Uso oficial'}</p>
                          </div>
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                            <FileText size={18} className="text-gray-300 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50/20">
            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-soft flex items-center justify-center mb-8 rotate-3 border border-gray-50">
              <User size={40} className="text-gray-100 transition-transform group-hover:rotate-12" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-3">Expediente Médico Digital</h3>
            <p className="max-w-[320px] text-sm font-medium text-gray-400 leading-relaxed">
              Seleccione un paciente de la lista para gestionar su <span className="text-gray-600 font-bold">historial clínico, recetas y certificados</span> de manera integral.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: PRESCRIPTION PREVIEW */}
      {isPreviewModalOpen && selectedPrescription && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col scale-in-center">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Pill size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Vista Previa de Receta</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-blue-600 font-black uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded">Folio: {selectedPrescription.folio}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1"><Calendar size={10} /> {new Date(selectedPrescription.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden bg-gray-100/50 p-8 flex justify-center custom-scrollbar overflow-y-auto">
              <div className="bg-white shadow-2xl rounded-sm max-w-[800px] w-full transform origin-top scale-[0.85] lg:scale-100 mb-8">
                <PreviewTemplateContext.Provider value={selectedPrescription.template_snapshot}>
                  <PreviewDataContext.Provider value={selectedPrescription.content_snapshot}>
                    <DocumentPreview showRules={false} />
                  </PreviewDataContext.Provider>
                </PreviewTemplateContext.Provider>
              </div>

              {/* Canvas oculto para generación de PDF de alta resolución */}
              <div className="hidden">
                <div id="prescription-timeline-canvas">
                  <PreviewTemplateContext.Provider value={selectedPrescription.template_snapshot}>
                    <PreviewDataContext.Provider value={selectedPrescription.content_snapshot}>
                      <DocumentPreview zoom={1} showRules={false} />
                    </PreviewDataContext.Provider>
                  </PreviewTemplateContext.Provider>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white flex justify-between items-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">
                Copia digital de seguridad — MedIQ Platform
              </p>
              <button 
                onClick={() => handleDownloadPrescription(selectedPrescription)}
                disabled={isGeneratingPDF}
                className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                {isGeneratingPDF ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {isGeneratingPDF ? 'Generando...' : 'Descargar PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CONSULTATION */}
      {isEditModalOpen && editingConsultationId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <div>
                <h3 className="text-xl font-black text-gray-900">Editar Consulta Histórica</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Audit Log: {editingConsultationId.split('-')[0]}</p>
              </div>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingConsultationId(null);
                }}
                className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/10">
              <ConsultationForm 
                doctorId={contextDoctorId || ''} 
                editingId={editingConsultationId} 
                onComplete={() => {
                  setIsEditModalOpen(false);
                  setEditingConsultationId(null);
                  if (selectedPatient) fetchPatientData(selectedPatient.id);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VERSION HISTORY (AUDIT LOG) */}
      {viewingHistoryId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <History size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Historial de Auditoría</h3>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-0.5">Control de Versiones Médico-Legal</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingHistoryId(null)}
                className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/10 custom-scrollbar">
              {loadingHistory ? (
                <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
              ) : consultationHistory.length === 0 ? (
                <div className="text-center py-12">
                   <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                      <Clock size={30} className="text-gray-200" />
                   </div>
                   <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Sin modificaciones registradas.</p>
                   <p className="text-[10px] text-gray-400 mt-2">Esta consulta mantiene su versión original integra.</p>
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:left-[19px] before:w-[2px] before:bg-blue-100/50">
                  {consultationHistory.map((h) => (
                    <div key={h.id} className="relative pl-12">
                       <div className="absolute left-0 top-1 w-10 h-10 bg-white border-4 border-blue-50 rounded-full flex items-center justify-center shadow-sm z-10">
                          <Clock size={16} className="text-blue-600" />
                       </div>
                       <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                             <div>
                                <p className="text-xs font-black text-gray-900 capitalize">Cambio en: <span className="text-blue-600 uppercase">{h.field_modified === 'diagnosis' ? 'Diagnóstico' : h.field_modified === 'treatment' ? 'Tratamiento' : h.field_modified === 'symptoms' ? 'Síntomas' : h.field_modified === 'notes' ? 'Notas' : h.field_modified}</span></p>
                                <p className="text-[10px] text-gray-400 font-bold mt-1 flex items-center gap-1.5"><Clock size={12} /> {new Date(h.modified_at).toLocaleString('es-MX')}</p>
                             </div>
                             <div className="text-right">
                                <span className="text-[8px] font-black bg-gray-100 text-gray-500 px-2 py-1 rounded uppercase">Por: {h.modifier?.name || 'Dr.'}</span>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4">
                             <div className="p-3 bg-red-50/30 rounded-xl border border-red-100/30">
                                <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                   <ArrowDownRight size={10} /> Valor Anterior
                                </p>
                                <p className="text-xs text-red-700/70 font-medium italic">{h.previous_value || 'Vacio'}</p>
                             </div>
                             <div className="p-3 bg-green-50/30 rounded-xl border border-green-100/30">
                                <p className="text-[8px] font-black text-green-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                   <ArrowUpRight size={10} /> Nuevo Valor
                                </p>
                                <p className="text-xs text-green-900 font-black">{h.new_value || 'Vacio'}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50/30">
               <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                  <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                  <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                     De acuerdo con la <span className="font-black">NOM-004-SSA3-2012</span>, toda modificación al expediente debe ser auditada y conservada para garantizar la integridad médico-legal de la información clínica.
                  </p>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Report for PDF Generation */}
      <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none" aria-hidden="true">
        {selectedPatient && (
          <FullRecordReport 
            patient={selectedPatient}
            consultations={consultations}
            prescriptions={prescriptions}
            certificates={certificates}
          />
        )}
      </div>
    </div>
  );
}

// Sub-components helpers
function ArrowDownRight({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7 7l10 10" />
      <path d="M17 7v10H7" />
    </svg>
  );
}

function ArrowUpRight({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

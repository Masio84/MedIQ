'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileText, Download, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { useCertificateStore } from '@/components/certificates/store/certificate-template.store';
import CertDocumentPreview from '@/components/certificates/preview/CertDocumentPreview';
import { generateCertificatePDF } from '@/components/certificates/utils/cert-pdf-generator';
import { CertPreviewDataContext } from '@/components/certificates/preview/CertPreviewContext';

export default function NewCertificatePage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState<string>(''); // Para hidratación segura

  const { template, loadTemplate } = useCertificateStore();

  const [formData, setFormData] = useState({
    patient_id: '',
    certificate_type: 'salud_general',
    purpose: '',
    findings: '',
    conclusion: 'Apto', 
    valid_days: 30,
    incapacidad_days: 1 
  });

  const supabase = createClient();

  useEffect(() => {
    const fetchContext = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: doc } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (doc) setDoctorProfile(doc);

        const { data: tpl } = await supabase
          .from('certificate_templates')
          .select('id, name, page_config, styles, branding, blocks')
          .eq('doctor_id', user.id)
          .maybeSingle();

        if (tpl) {
          const loadedTemplate = {
            id: tpl.id,
            doctorId: user.id,
            name: tpl.name,
            page: tpl.page_config,
            styles: tpl.styles,
            branding: {
              ...tpl.branding,
              signature: doc?.signature_data ? { ...tpl.branding?.signature, url: doc.signature_data } : tpl.branding?.signature,
              seal: doc?.seal_config ? { ...tpl.branding?.seal, textConfig: doc.seal_config } : tpl.branding?.seal
            },
            blocks: tpl.blocks,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          loadTemplate(loadedTemplate as any);
        } else if (doc) {
          const currentTemplate = useCertificateStore.getState().template;
          loadTemplate({
            ...currentTemplate,
            branding: {
              ...currentTemplate.branding,
              signature: doc.signature_data ? { ...currentTemplate.branding.signature, url: doc.signature_data } : currentTemplate.branding.signature,
              seal: doc.seal_config ? { ...currentTemplate.branding.seal, textConfig: doc.seal_config } : currentTemplate.branding.seal
            }
          } as any);
        }
      }

      const { data: ptList } = await supabase.from('patients').select('id, name').order('name');
      if (ptList) setPatients(ptList);

      setFetching(false);
    };

    fetchContext();
    setCurrentDate(new Date().toLocaleDateString('es-MX')); // Establecer fecha solo en cliente
  }, [supabase, loadTemplate]);

  useEffect(() => {
    if (!formData.patient_id) {
      setPatientData(null);
      return;
    }
    const fetchPatient = async () => {
      const { data } = await supabase.from('patients').select('*').eq('id', formData.patient_id).single();
      if (data) setPatientData(data);
    };
    fetchPatient();
  }, [formData.patient_id, supabase]);

  const purposesMap: Record<string, string[]> = {
    salud_general: ['Inscripción escolar', 'Trámite laboral', 'Trámite migratorio', 'Otro'],
    incapacidad: ['Reposo en casa', 'Hospitalización', 'Procedimiento quirúrgico'],
    aptitud_fisica: ['Actividad deportiva', 'Empleo de riesgo', 'Actividad física general']
  };

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return 'N/A';
    const birthDate = new Date(birthdate);
    const difference = Date.now() - birthDate.getTime();
    return Math.floor(difference / 31557600000); 
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.patient_id || !doctorProfile) return;

    setLoading(true);
    const t = toast.loading('Generando certificado...');

    try {
      const payload: any = {
        patient_id: formData.patient_id,
        doctor_id: doctorProfile.id,
        clinic_id: doctorProfile.clinic_id,
        certificate_type: formData.certificate_type,
        purpose: formData.purpose,
        findings: formData.findings,
        valid_days: formData.valid_days,
        conclusion: formData.certificate_type === 'incapacidad' ? `${formData.incapacidad_days} días de incapacidad` : formData.conclusion,
        template_snapshot: template // guardamos un snapshot de cómo lució la plantilla al generarse
      };

      const { data, error } = await supabase
        .from('medical_certificates')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // Generar hash y registro de verificación (Validez Digital)
      const encoder = new TextEncoder();
      const contentString = `${data.id}-${payload.patient_id}-${new Date().toISOString()}`;
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(contentString));
      const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const verificationPayload = {
        document_type: 'certificate',
        document_id: data.id,
        hash_sha256: hashHex,
        doctor_id: doctorProfile.id,
        patient_id: formData.patient_id,
        content_snapshot: payload,
        ip_address: 'client-generated' // Podría usar API de IP si fuera requerido
      };

      const { data: verifData } = await supabase
        .from('document_verification')
        .insert([verificationPayload])
        .select('id')
        .single();

      toast.success(`Certificado generado con Folio ${data.folio}`, { id: t });
      
      // Prompt PDF download incluyend URL de verificación para RR QR
      const verificationUrl = verifData ? `${window.location.origin}/verify/${verifData.id}` : undefined;
      await generateCertificatePDF(template, 'certificate-canvas', data.folio, verificationUrl);

    } catch (err: any) {
      toast.error(err.message || 'Error al guardar certificado', { id: t });
    } finally {
      setLoading(false);
    }
  };

  // Build the unified data object required by variable-engine and CertBodyBlock
  const dynamicData = useMemo(() => {
    const age = patientData ? calculateAge(patientData.birthdate).toString() : 'XX';
    return {
      patient: {
        name: patientData?.name || 'Nombre del Paciente',
        age: age,
        gender: patientData?.gender || 'Sexo',
        folio: 'Borrador', // O el real si ya existe
        date: currentDate || '...',
      },
      doctor: {
        name: doctorProfile?.name || 'Nombre Médico',
        specialty: doctorProfile?.specialty || 'Especialidad',
        cedula: doctorProfile?.medical_license || 'CED',
        specialtyCedula: doctorProfile?.specialty_license || 'CEP',
      },
      clinic: {
        name: doctorProfile?.clinic_name || 'Nombre Clínica',
        address: doctorProfile?.clinic_address || 'Dirección de la Clínica',
        phone: doctorProfile?.clinic_phone || 'Teléfono de la Clínica',
      },
      purpose: formData.purpose || 'Propósito del certificado...',
      findings: formData.findings || 'Hallazgos clínicos...',
      conclusion: formData.certificate_type === 'incapacidad' ? `${formData.incapacidad_days} días de incapacidad` : formData.conclusion,
      validDays: formData.valid_days
    };
  }, [patientData, doctorProfile, formData]);

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50/30">
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white/80 backdrop-blur-xl shrink-0">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="text-blue-600" /> Nuevo Certificado
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Generación de certificado a paciente</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setFormData({ ...formData, purpose: '', findings: '', patient_id: '' })}
             className="px-4 py-2 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1.5"
           >
             <RotateCcw size={14} /> LIMPIAR
           </button>
           <button
             onClick={handleSave}
             disabled={loading || !formData.patient_id || !formData.findings || !formData.purpose}
             className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black tracking-widest uppercase shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
           >
             {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
             Guardar & Generar PDF
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full max-w-[1600px] mx-auto">
          
          {/* Formulario */}
          <div className="lg:col-span-5 flex flex-col gap-4">
             <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 pb-2 border-b border-gray-50">Datos Principales</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Paciente Seleccionado</label>
                    <select
                      name="patient_id"
                      value={formData.patient_id}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 px-4 py-2.5 text-sm font-medium text-gray-800 rounded-xl shadow-inner-sm transition-all"
                    >
                      <option value="">Selecciona un paciente...</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Certificado</label>
                      <select
                        name="certificate_type"
                        value={formData.certificate_type}
                        onChange={(e) => setFormData({ ...formData, certificate_type: e.target.value, purpose: '', conclusion: e.target.value === 'incapacidad' ? '1' : 'Apto' })}
                        className="w-full bg-slate-50 border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 px-3 py-2 text-sm text-gray-800 rounded-xl shadow-inner-sm transition-all"
                      >
                        <option value="salud_general">Salud General</option>
                        <option value="incapacidad">Incapacidad Laboral</option>
                        <option value="aptitud_fisica">Aptitud Física</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Vigencia (Días)</label>
                      <input
                        type="number"
                        min={1}
                        name="valid_days"
                        value={formData.valid_days}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 px-3 py-2 text-sm text-gray-800 rounded-xl shadow-inner-sm transition-all"
                      />
                    </div>
                  </div>
                </div>
             </div>

             <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex-1 flex flex-col">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 pb-2 border-b border-gray-50">Contenido Médico</h3>
                
                <div className="space-y-4 flex-1 flex flex-col">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Propósito / Destino</label>
                    <div className="flex gap-2">
                      <select
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleInputChange}
                        className="w-1/2 bg-slate-50 border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 px-3 py-2 text-sm text-gray-800 rounded-xl shadow-inner-sm"
                      >
                        <option value="">Sugerencias...</option>
                        {purposesMap[formData.certificate_type].map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <input 
                        type="text" 
                        name="purpose"
                        placeholder="Escribe el destino..." 
                        value={formData.purpose} 
                        onChange={handleInputChange}
                        className="w-1/2 bg-white border border-gray-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 px-3 py-2 text-sm text-gray-800 rounded-xl shadow-inner-sm placeholder:text-gray-300"
                      />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-[150px]">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Hallazgos Clínicos</label>
                    <textarea
                      name="findings"
                      value={formData.findings}
                      onChange={handleInputChange}
                      className="w-full flex-1 bg-white border border-gray-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 px-4 py-3 text-sm text-gray-800 rounded-xl shadow-inner-sm resize-none custom-scrollbar leading-relaxed"
                      placeholder="Describir estado de salud actual, signos vitales relevantes y resultados de examen físico..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {formData.certificate_type === 'incapacidad' ? (
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1 justify-between">
                          <span>Días otorgados de incapacidad</span>
                          <span className="text-blue-600 font-bold bg-blue-50 px-2 rounded-md">{formData.incapacidad_days} días</span>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="90"
                          name="incapacidad_days"
                          value={formData.incapacidad_days}
                          onChange={handleInputChange}
                          className="w-full accent-blue-600 mt-2"
                        />
                      </div>
                    ) : (
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Conclusión Médica</label>
                        <select
                          name="conclusion"
                          value={formData.conclusion}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 px-3 py-2 text-sm font-bold text-gray-800 rounded-xl shadow-inner-sm"
                        >
                          <option value="Se considera APTO">Se considera APTO</option>
                          <option value="Se considera NO APTO">Se considera NO APTO</option>
                          <option value="APTO con restricciones">APTO con restricciones</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
             </div>
          </div>

          {/* Vista Previa */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-inner overflow-hidden flex flex-col relative h-[calc(100vh-160px)]">
             <div className="absolute top-4 right-6 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-black tracking-widest text-emerald-700">LIVE PREVIEW</span>
             </div>
             
             <div className="flex-1 overflow-auto custom-scrollbar bg-gray-100/50">
               <CertPreviewDataContext.Provider value={dynamicData}>
                 <CertDocumentPreview zoom={0.8} showRules={false} showGrid={false} />
               </CertPreviewDataContext.Provider>
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

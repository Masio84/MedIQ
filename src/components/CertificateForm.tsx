'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertTriangle, FileText, Download, Mail } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function CertificateForm({ patientId, onSuccess }: { patientId?: string; onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);

  const [formData, setFormData] = useState({
    patient_id: patientId || '',
    certificate_type: 'salud_general',
    purpose: '',
    findings: '',
    conclusion: 'Apto', 
    valid_days: 30,
    incapacidad_days: 1 
  });

  const [feedback, setFeedback] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' }>({ isOpen: false, title: '', message: '', type: 'success' });

  const supabase = createClient();

  useEffect(() => {
    const fetchContext = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: doc } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (doc) setDoctorProfile(doc);
      }

      const { data: ptList } = await supabase.from('patients').select('id, name').order('name');
      if (ptList) setPatients(ptList);

      setFetching(false);
    };

    fetchContext();
  }, [supabase]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateAge = (dob: string) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const difference = Date.now() - birthDate.getTime();
    return Math.floor(difference / 31557600000); 
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id || !doctorProfile) return;

    setLoading(true);

    try {
      const payload: any = {
        patient_id: formData.patient_id,
        doctor_id: doctorProfile.id,
        clinic_id: doctorProfile.clinic_id,
        certificate_type: formData.certificate_type,
        purpose: formData.purpose,
        findings: formData.findings,
        valid_days: formData.valid_days,
        conclusion: formData.certificate_type === 'incapacidad' ? `${formData.incapacidad_days} días de incapacidad` : formData.conclusion
      };

      const { data, error } = await supabase
        .from('medical_certificates')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      setFeedback({ isOpen: true, title: 'Éxito', message: `Certificado generado correctamente con Folio ${data.folio}`, type: 'success' });
      if (onSuccess) onSuccess();

    } catch (err: any) {
      setFeedback({ isOpen: true, title: 'Error', message: err.message || 'Error al guardar certificado', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    const element = document.getElementById('certificate-template');
    if (!element) return;

    setLoading(true);
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Certificado_${patientData?.name?.replace(/ /g, '_') || 'Paciente'}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-2xl mx-auto mb-10">
        <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
           <FileText className="text-blue-600" size={20} /> Generar Certificado Médico
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Paciente *</label>
            <select
              name="patient_id"
              required
              value={formData.patient_id}
              onChange={handleInputChange}
              className="w-full bg-white px-3 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
              disabled={!!patientId}
            >
              <option value="">Selecciona un paciente...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Certificado *</label>
            <select
              name="certificate_type"
              value={formData.certificate_type}
              onChange={(e) => setFormData({ ...formData, certificate_type: e.target.value, purpose: '', conclusion: e.target.value === 'incapacidad' ? '1' : 'Apto' })}
              className="w-full bg-white px-3 py-2 text-sm border border-gray-100 rounded-lg"
            >
              <option value="salud_general">Salud General</option>
              <option value="incapacidad">Incapacidad Laboral</option>
              <option value="aptitud_fisica">Aptitud Física</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Propósito / Destino *</label>
          <div className="flex gap-2">
            <select
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              required
              className="w-full bg-white px-3 py-2 text-sm border border-gray-100 rounded-lg"
            >
              <option value="">Selecciona sugerencia...</option>
              {purposesMap[formData.certificate_type].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input 
              type="text" 
              name="purpose"
              placeholder="O escribe otro..." 
              value={formData.purpose} 
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm border border-gray-100 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Hallazgos Clínicos *</label>
          <textarea
            name="findings"
            rows={4}
            required
            value={formData.findings}
            onChange={handleInputChange}
            className="w-full px-3 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
            placeholder="Describir estado de salud, signos vitales relevantes y examen físico..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formData.certificate_type === 'incapacidad' ? (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Días de Incapacidad *</label>
              <input
                type="number"
                min={1}
                name="incapacidad_days"
                value={formData.incapacidad_days}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-100 rounded-lg"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Conclusión *</label>
              <select
                name="conclusion"
                value={formData.conclusion}
                onChange={handleInputChange}
                className="w-full bg-white px-3 py-2 text-sm border border-gray-100 rounded-lg"
              >
                <option value="Apto">Apto</option>
                <option value="No Apto">No Apto</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Vigencia (Días)</label>
            <input
              type="number"
              min={1}
              name="valid_days"
              value={formData.valid_days}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-sm border border-gray-100 rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-gray-50">
          <button
            type="submit"
            disabled={loading || !doctorProfile || !patientData}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            Generar en Sistema
          </button>
          
          {formData.findings && doctorProfile && patientData && (
            <button
              type="button"
              onClick={generatePDF}
              disabled={loading}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
               {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16}/>} 
               Descargar PDF
            </button>
          )}
        </div>

        {feedback.isOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 text-center">
              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${feedback.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                <AlertTriangle size={24} />
              </div>
              <h3 className="font-bold text-lg text-gray-900">{feedback.title}</h3>
              <p className="text-sm text-gray-500">{feedback.message}</p>
              <div>
                <button 
                  type="button"
                  onClick={() => setFeedback({ ...feedback, isOpen: false })} 
                  className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Template oculto para jsPDF y html2canvas */}
      {patientData && doctorProfile && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div id="certificate-template" style={{ width: '794px', backgroundColor: '#fff', color: '#1E293B', fontFamily: 'Arial, sans-serif' }} className="p-12 box-border">
             <div className="border-b-2 border-slate-100 pb-4 mb-8">
                <p className="text-xl font-black text-slate-800">MedIQ</p>
                <p className="text-xs text-slate-500">Expediente Clínico Inteligente</p>
             </div>

             <p className="text-right text-[10px] text-slate-400 font-bold mb-4">Fecha: {new Date().toLocaleDateString('es-MX')}</p>

             <h2 className="text-center font-black text-slate-900 text-base uppercase tracking-wider mb-8 py-2 bg-slate-50 rounded-lg">
                CERTIFICADO MÉDICO — {formData.certificate_type === 'salud_general' ? 'Salud General' : formData.certificate_type === 'incapacidad' ? 'Incapacidad Laboral' : 'Aptitud Física'}
             </h2>

             <div className="mb-6">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Datos del Paciente</p>
                <p className="text-sm font-medium"><b className="font-bold">Nombre:</b> {patientData.name}</p>
                <p className="text-sm"><b className="font-bold">CURP:</b> {patientData.curp || 'N/A'}</p>
                <p className="text-sm"><b className="font-bold">Edad:</b> {calculateAge(patientData.dob)} años | <b className="font-bold">Sexo:</b> {patientData.gender || 'N/A'}</p>
             </div>

             <div className="mb-6 space-y-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Certífico que:</p>
                <p className="text-sm leading-relaxed text-justify">
                   Habiendo practicado la exploración clínica correspondiente al paciente mencionado, se encuentran los siguientes hallazgos:
                </p>
                <p className="text-sm leading-relaxed bg-slate-50 p-4 rounded-lg font-medium text-slate-800">
                   {formData.findings || 'Sin hallazgos clínicos particulares registrados.'}
                </p>
                <p className="text-sm">
                   Este certificado se expide para los fines de: <b className="font-bold">{formData.purpose || 'Trámite general'}</b>.
                </p>
             </div>

             <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 mb-6">
                <p className="text-sm font-bold text-slate-900">Conclusión:</p>
                <p className="text-base font-black text-slate-800">
                   {formData.certificate_type === 'incapacidad' ? `${formData.incapacidad_days} días de incapacidad` : formData.conclusion}
                </p>
             </div>

             <p className="text-xs text-slate-400 italic mb-12">
                El presente certificado tiene una validez de {formData.valid_days} días a partir de la fecha de su expedición.
             </p>

             <div className="border-t border-slate-200 pt-6 text-center mt-20 max-w-sm mx-auto">
                <div className="h-16"></div>
                <p className="text-sm font-black text-slate-900">Dr. {doctorProfile.name}</p>
                <p className="text-xs text-slate-500">Cédula Profesional: {doctorProfile.medical_license || 'N/A'}</p>
                {doctorProfile.specialty && (
                   <p className="text-[11px] text-slate-400 mt-0.5">Especialidad: {doctorProfile.specialty} | Cédula: {doctorProfile.specialty_license}</p>
                )}
             </div>
          </div>
        </div>
      )}
    </>
  );
}

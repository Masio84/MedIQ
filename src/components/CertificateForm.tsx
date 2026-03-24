'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertTriangle, FileText, Download, Printer, Mail } from 'lucide-react';
import dynamic from 'next/dynamic';

const PDFDownloadLink = dynamic(() => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink), { ssr: false });
const Document = dynamic(() => import('@react-pdf/renderer').then(mod => mod.Document), { ssr: false });
const Page = dynamic(() => import('@react-pdf/renderer').then(mod => mod.Page), { ssr: false });
const Text = dynamic(() => import('@react-pdf/renderer').then(mod => mod.Text), { ssr: false });
const View = dynamic(() => import('@react-pdf/renderer').then(mod => mod.View), { ssr: false });

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
    conclusion: 'Apto', // Default for general/fitness
    valid_days: 30,
    incapacidad_days: 1 // Only for incapacidad
  });

  const [feedback, setFeedback] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' }>({ isOpen: false, title: '', message: '', type: 'success' });

  const supabase = createClient();

  useEffect(() => {
    const fetchContext = async () => {
      // 1. Fetch Doctor
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: doc } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (doc) setDoctorProfile(doc);
      }

      // 2. Fetch Patients
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
    return Math.floor(difference / 31557600000); // years
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

  const styles = {
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11, color: '#334155', lineHeight: 1.5 },
    header: { marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 10 },
    clinicName: { fontSize: 16, fontWeight: 'bold' as any, color: '#1E3A8A' },
    title: { fontSize: 14, fontWeight: 'bold' as any, textAlign: 'center' as any, marginVertical: 20, textTransform: 'uppercase' as any, color: '#0F172A' },
    folioSection: { textAlign: 'right' as any, fontSize: 10, color: '#64748B', marginBottom: 15 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold' as any, color: '#1E293B', marginBottom: 5 },
    text: { marginBottom: 3 },
    paragraph: { textAlign: 'justify' as any, marginBottom: 15 },
    conclusion: { fontSize: 12, fontWeight: 'bold' as any, padding: 10, backgroundColor: '#F8FAFC', borderLeftWidth: 3, borderLeftColor: '#1E3A8A', marginVertical: 15 },
    footer: { marginTop: 40, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0', textAlign: 'center' as any },
    signatureSpace: { height: 60 },
    subText: { fontSize: 9, color: '#64748B' }
  };

  const CertificatePDFElement = ({ certData }: { certData: any }) => {
    if (!doctorProfile || !patientData) return null;

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.clinicName}>MedIQ - Clinica</Text>
            <Text style={styles.subText}>Medicina Especializada</Text>
          </View>

          <Text style={styles.folioSection}>Folio: PENDING | Fecha: {new Date().toLocaleDateString('es-MX')}</Text>

          <Text style={styles.title}>CERTIFICADO MÉDICO — {formData.certificate_type === 'salud_general' ? 'SALUD GENERAL' : formData.certificate_type === 'incapacidad' ? 'INCAPACIDAD LABORAL' : 'APTITUD FÍSICA'}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DATOS DEL PACIENTE</Text>
            <Text style={styles.text}>Nombre: {patientData.name}</Text>
            <Text style={styles.text}>CURP: {patientData.curp || 'N/A'}</Text>
            <Text style={styles.text}>Edad: {calculateAge(patientData.dob)} años | Sexo: {patientData.gender || 'N/A'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CERTIFICO QUE</Text>
            <Text style={styles.paragraph}>Habiendo practicado la exploración clínica correspondiente al paciente mencionado, se encuentran los siguientes hallazgos:</Text>
            <Text style={styles.paragraph}>{formData.findings || 'Sin hallazgos particulares registrados.'}</Text>
            <Text style={styles.paragraph}>Este certificado se expide a solicitud del interesado para los fines de: {formData.purpose || 'Trámite general'}.</Text>
          </View>

          <View style={styles.conclusion}>
            <Text style={{ fontWeight: 'bold' }}>CONCLUSIÓN: </Text>
            <Text>{formData.certificate_type === 'incapacidad' ? `${formData.incapacidad_days} días de incapacidad` : formData.conclusion}</Text>
          </View>

          <View style={{ marginTop: 20 }}>
            <Text style={styles.subText}>Este certificado tiene una validez por {formData.valid_days} días a partir de su expedición.</Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.signatureSpace} />
            <Text style={{ fontWeight: 'bold' }}>Dr. {doctorProfile.name}</Text>
            <Text style={styles.subText}>Cédula Profesional: {doctorProfile.medical_license || 'N/A'}</Text>
            {doctorProfile.specialty && <Text style={styles.subText}>Especialidad: {doctorProfile.specialty} | Cédula: {doctorProfile.specialty_license}</Text>}
          </View>
        </Page>
      </Document>
    );
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-2xl mx-auto">
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
          <PDFDownloadLink
            document={<CertificatePDFElement certData={{}} />}
            fileName={`Certificado_${patientData.name.replace(/ /g, '_')}.pdf`}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm transition-colors"
          >
             {/* @ts-ignore */}
             {({ loading: pdfLoading }) => pdfLoading ? 'Generando...' : <><Download size={16}/> Descargar PDF</>}
          </PDFDownloadLink>
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
  );
}

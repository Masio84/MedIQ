'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertTriangle, Sparkles, X, Plus } from 'lucide-react';

export default function ConsultationForm({ doctorId, initialPatientId, initialSymptoms, initialWeight, initialPressure, initialTemperature, onPatientChange }: { doctorId: string; initialPatientId?: string; initialSymptoms?: string; initialWeight?: string; initialPressure?: string; initialTemperature?: string; onPatientChange?: (id: string) => void }) {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Doctor Pricing Settings State
  const [doctorSettings, setDoctorSettings] = useState<any>({
    base_price: 0,
    discount_min: 0, discount_max: 0,
    increment_min: 0, increment_max: 0
  });

  // AI Suggestions and fields content state
  const [formData, setFormData] = useState({
    patient_id: '',
    weight: '', blood_pressure: '', temperature: '',
    symptoms: '', diagnosis: '', treatment: '', notes: '',
    needs_follow_up: false, follow_up_date: '', follow_up_time: '', follow_up_notes: ''
  });

  const [aiSuggestions, setAiSuggestions] = useState<{
    symptoms: string[];
    diagnosis: string[];
    treatment: string[];
  }>({ symptoms: [], diagnosis: [], treatment: [] });

  // AI Integration States
  const [symptomsList, setSymptomsList] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isTreating, setIsTreating] = useState(false);
  const [isSuggestingFollowup, setIsSuggestingFollowup] = useState(false);
  const [patientContext, setPatientContext] = useState<any>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'normal' | 'discount' | 'increment'>('normal');
  const [finalPrice, setFinalPrice] = useState(0);

  // Feedback State
  const [feedback, setFeedback] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' }>({ isOpen: false, title: '', message: '', type: 'success' });

  // Auto-schedule Modal State
  const [scheduleModal, setScheduleModal] = useState({ 
    isOpen: false, 
    date: '', 
    start_time: '10:00', 
    reason: '', 
    notes: '', 
    submitting: false 
  });

  useEffect(() => {
    if (initialSymptoms) {
      // Dividir los síntomas por comas, guiones o saltos si aplica, o simplemente crear una capsula individual entera si es un texto continuo.
      const items = initialSymptoms.split(',').map(s => s.trim()).filter(Boolean);
      if (items.length > 0) {
         setSymptomsList(items);
      }
    }
    // Pre-cargar signos vitales si vienen de la Agenda
    if (initialWeight) setFormData(prev => ({ ...prev, weight: initialWeight }));
    if (initialPressure) setFormData(prev => ({ ...prev, blood_pressure: initialPressure }));
    if (initialTemperature) setFormData(prev => ({ ...prev, temperature: initialTemperature }));
  }, [initialSymptoms, initialWeight, initialPressure, initialTemperature]);
  


  const supabase = createClient();

  // Load patients and doctor profile settings
  useEffect(() => {
    const fetchPatients = async () => {
      const { data } = await supabase.from('patients').select('id, name').order('name');
      if (data) setPatients(data);
    };

    const fetchSettings = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', doctorId).single();
      if (data) {
        setDoctorSettings({
          base_price: Number(data.base_price || 0),
          discount_min: Number(data.discount_min || 0),
          discount_max: Number(data.discount_max || 0),
          increment_min: Number(data.increment_min || 0),
          increment_max: Number(data.increment_max || 0),
        });
        setFinalPrice(Number(data.base_price || 0));
      }
    };

    fetchPatients();
    fetchSettings();
  }, [supabase, doctorId]);

  useEffect(() => {
    if (!initialPatientId) return;
    setFormData((prev) => ({ ...prev, patient_id: initialPatientId }));
  }, [initialPatientId]);

  useEffect(() => {
    if (!formData.patient_id) {
      setPatientContext(null);
      return;
    }
    const fetchPatientData = async () => {
      const { data } = await supabase.from('patients').select('*').eq('id', formData.patient_id).single();
      if (data) setPatientContext(data);
    };
    fetchPatientData();
  }, [formData.patient_id, supabase]);

  useEffect(() => {
    if (onPatientChange && formData.patient_id) {
       onPatientChange(formData.patient_id);
    }
  }, [formData.patient_id, onPatientChange]);

  const mockAiSytmpoms = ['Fiebre', 'Dolor de cabeza', 'Tos seca', 'Dolor de garganta', 'Congestión nasal', 'Fatiga', 'Náuseas'];

  useEffect(() => {
    setAiSuggestions({
      symptoms: mockAiSytmpoms.filter(s => symptomInput && s.toLowerCase().includes(symptomInput.toLowerCase()) && !symptomsList.includes(s)),
      diagnosis: [],
      treatment: []
    });
  }, [symptomInput, symptomsList]);

  const handleAddSymptom = (s: string) => {
    if (!s.trim()) return;
    if (!symptomsList.includes(s.trim())) {
      setSymptomsList([...symptomsList, s.trim()]);
    }
    setSymptomInput('');
  };

  const generateDiagnosis = async (retry = false) => {
    if (symptomsList.length === 0 && !formData.symptoms) {
      setFeedback({ isOpen: true, title: 'Atención', message: 'Agrega síntomas primero', type: 'error' });
      return;
    }
    setIsDiagnosing(true);
    try {
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptomsList.length > 0 ? symptomsList : [formData.symptoms],
          weight: formData.weight,
          blood_pressure: formData.blood_pressure,
          temperature: formData.temperature,
          age: patientContext?.dob ? Math.floor((new Date().getTime() - new Date(patientContext.dob).getTime()) / 31557600000) : null,
          medical_history: patientContext?.medical_history || ''
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (retry) {
        setFormData(prev => ({ ...prev, diagnosis: prev.diagnosis + '\n\nOtra opción IA:\n' + data.diagnosis }));
      } else {
        setFormData(prev => ({ ...prev, diagnosis: data.diagnosis }));
      }
    } catch (err: any) {
      setFeedback({ isOpen: true, title: 'Error IA', message: err.message, type: 'error' });
    } finally {
      setIsDiagnosing(false);
    }
  };

  const generateTreatment = async () => {
    if (!formData.diagnosis) {
      setFeedback({ isOpen: true, title: 'Atención', message: 'Genera o escribe un diagnóstico primero', type: 'error' });
      return;
    }
    setIsTreating(true);
    try {
      const res = await fetch('/api/ai/treat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptomsList.length > 0 ? symptomsList : [formData.symptoms],
          diagnosis: formData.diagnosis,
          weight: formData.weight,
          blood_pressure: formData.blood_pressure,
          temperature: formData.temperature,
          age: patientContext?.dob ? Math.floor((new Date().getTime() - new Date(patientContext.dob).getTime()) / 31557600000) : null,
          medical_history: patientContext?.medical_history || ''
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFormData(prev => ({ ...prev, treatment: data.treatment }));
    } catch (err: any) {
      setFeedback({ isOpen: true, title: 'Error IA', message: err.message, type: 'error' });
    } finally {
      setIsTreating(false);
    }
  };


  const generateFollowUp = async () => {
    if (!formData.diagnosis) {
      setFeedback({ isOpen: true, title: 'Atención', message: 'Genera o escribe un diagnóstico primero', type: 'error' });
      return;
    }
    setIsSuggestingFollowup(true);
    try {
      const res = await fetch('/api/ai/suggest-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosis: formData.diagnosis,
          treatment: formData.treatment,
          symptoms: symptomsList.length > 0 ? symptomsList.join(', ') : formData.symptoms
        })
      });
      const aiData = await res.json();
      if (!res.ok) throw new Error(aiData.error);
      
      setFormData(prev => ({ ...prev, follow_up_notes: aiData.follow_up }));

      // Abrir modal de agendado automático
      setScheduleModal({
         isOpen: true,
         date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
         start_time: '10:00',
         reason: aiData.follow_up,
         notes: 'Sugerido por Inteligencia Artificial',
         submitting: false
      });

    } catch (err: any) {
      setFeedback({ isOpen: true, title: 'Error IA', message: err.message, type: 'error' });
    } finally {
      setIsSuggestingFollowup(false);
    }
  };

  const handleConfirmSchedule = async () => {
      setScheduleModal(prev => ({ ...prev, submitting: true }));
      try {
          const res = await fetch('/api/appointments/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  patient_id: formData.patient_id,
                  doctor_id: doctorId,
                  date: scheduleModal.date,
                  start_time: scheduleModal.start_time,
                  reason: scheduleModal.reason,
                  notes: scheduleModal.notes,
                  status: 'scheduled'
              })
          });

          const result = await res.json();

          if (res.status === 403) {
              setFeedback({ isOpen: true, title: 'Límite', message: 'Tu plan no incluye agendado automático.', type: 'error' });
          } else if (!res.ok) {
              throw new Error(result.error || 'Error al agendar');
          } else {
              setFeedback({ isOpen: true, title: 'Éxito', message: 'Cita agendada correctamente', type: 'success' });
              setScheduleModal(prev => ({ ...prev, isOpen: false }));
          }
      } catch (err: any) {
          setFeedback({ isOpen: true, title: 'Cita Fallida', message: err.message || 'Error al guardar, intenta de nuevo', type: 'error' });
      } finally {
          setScheduleModal(prev => ({ ...prev, submitting: false }));
      }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const applySuggestion = (field: 'symptoms' | 'diagnosis' | 'treatment', value: string) => {
    setFormData({ ...formData, [field]: value });
    setAiSuggestions(prev => ({ ...prev, [field]: [] }));
  };

  // Trigger Confirmation Modal instead of direct submit
  const triggerSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_id) {
      setFeedback({ isOpen: true, title: 'Atención', message: 'Por favor selecciona un paciente', type: 'error' });
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirmSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Insert Consultation
      const { data: consultation, error: consultationError } = await supabase
        .from('consultations')
        .insert([
          {
            patient_id: formData.patient_id,
            doctor_id: doctorId,
            symptoms: symptomsList.length > 0 ? symptomsList.join(', ') : (formData.symptoms || null),
            diagnosis: formData.diagnosis || null,
            treatment: formData.treatment || null,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            blood_pressure: formData.blood_pressure || null,
            temperature: formData.temperature ? parseFloat(formData.temperature) : null,
            notes: (formData.notes || '') + ( (formData as any).needs_follow_up ? `\n\n[SEGUIMIENTO]: Fecha sugerida: ${(formData as any).follow_up_date || 'N/A'}. Notas de médico: ${(formData as any).follow_up_notes || 'N/A'}` : ''),
          },
        ])
        .select()
        .single();

      if (consultationError) throw consultationError;

      // Calculate discount and increment based on paymentType selection for billing update
      let discount = 0;
      let extra_charge = 0;
      if (paymentType === 'discount') discount = Math.max(0, doctorSettings.base_price - finalPrice);
      if (paymentType === 'increment') extra_charge = Math.max(0, finalPrice - doctorSettings.base_price);

      // 2. Insert Billing Record (triggers sync action back to flow)
      const { error: billingError } = await supabase
        .from('billing')
        .insert([
          {
            consultation_id: consultation.id,
            patient_id: formData.patient_id,
            normal_fee: doctorSettings.base_price,
            discount: discount,
            extra_charge: extra_charge,
          },
        ]);

      if (billingError) throw billingError;

      // 3. Insert follow-up notification if needed
      if ((formData as any).needs_follow_up && (formData as any).follow_up_date) {
        // Find assistant linked to this doctor
        const { data: doctorProfile } = await supabase
          .from('profiles')
          .select('name, doctor_id, clinic_id')
          .eq('id', doctorId)
          .single();

        // Look for an assistant linked to this doctor
        const { data: assistants } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'assistant')
          .eq('doctor_id', doctorId)
          .limit(1);

        const assistantUserId = assistants?.[0]?.id;
        const patientName = patients.find(p => p.id === formData.patient_id)?.name || 'Paciente';
        const doctorName = doctorProfile?.name || 'el médico';

        if (assistantUserId) {
          await supabase.from('notifications').insert([{
            clinic_id: doctorProfile?.clinic_id || null,
            from_user_id: doctorId,
            to_user_id: assistantUserId,
            type: 'seguimiento_sugerido',
            patient_id: formData.patient_id,
            suggested_date: (formData as any).follow_up_date,
            suggested_time: (formData as any).follow_up_time || null,
            message: `El Dr. ${doctorName} sugiere seguimiento para ${patientName}`,
            read: false,
            acted: false,
          }]);
        }
      }

      setFeedback({ isOpen: true, title: '¡Éxito!', message: 'Consulta guardada y enviada a facturación.', type: 'success' });
      setIsModalOpen(false);
      setFormData({
        patient_id: '', weight: '', blood_pressure: '', temperature: '',
        symptoms: '', diagnosis: '', treatment: '', notes: '',
        needs_follow_up: false, follow_up_date: '', follow_up_time: '',
      } as any);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la consulta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={triggerSave} className="space-y-6 bg-white p-6 rounded-xl border border-gray-100/50 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Registrar Consulta</h3>
        
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Seleccionar Paciente *</label>
          <select
            name="patient_id"
            required
            value={formData.patient_id}
            onChange={handleInputChange}
            className="w-full bg-white px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="">Selecciona un paciente...</option>
            {Array.isArray(patients) && patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Peso (kg)</label>
            <input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleInputChange} className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Presión Arterial</label>
            <input type="text" name="blood_pressure" value={formData.blood_pressure} onChange={handleInputChange} placeholder="120/80" className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Temperatura (°C)</label>
            <input type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleInputChange} className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none" />
          </div>
        </div>

        {/* Symptoms (Capsules) */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Síntomas *</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {Array.isArray(symptomsList) && symptomsList.map(s => (
              <span key={s} className="inline-flex items-center gap-1 bg-gray-100 border-[0.5px] border-black/8 text-gray-800 px-2 py-1 rounded-md text-xs font-medium">
                {s}
                <button type="button" onClick={() => setSymptomsList(symptomsList.filter(item => item !== s))} className="text-gray-400 hover:text-red-500"><X size={12}/></button>
              </span>
            ))}
          </div>
          <div className="relative flex gap-2">
            <input
              type="text"
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter'){ e.preventDefault(); handleAddSymptom(symptomInput); } }}
              className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="Escribe síntoma y presiona Enter..."
            />
            <button type="button" onClick={() => handleAddSymptom(symptomInput)} className="px-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-600">
              <Plus size={16}/>
            </button>
            {aiSuggestions.symptoms.length > 0 && (
              <div className="absolute top-full z-10 w-full shadow-lg rounded-xl mt-1 p-3 bg-[#F8F9FA] border border-gray-100 border-l-[2px] border-l-[#1A4A8A]">
                <div className="mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ backgroundColor: '#E8F0FB', color: '#1A4A8A' }}>
                    ✦ Sugerencias IA
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(aiSuggestions.symptoms) && aiSuggestions.symptoms.map(s => (
                    <button key={s} type="button" onClick={() => handleAddSymptom(s)} className="text-xs bg-white border-[0.5px] border-black/8 text-gray-700 px-2.5 py-1.5 rounded-md hover:bg-gray-50 transition-colors shadow-sm">{s}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Diagnosis */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-medium text-gray-500">Diagnóstico</label>
            <div className="flex gap-2">
              {formData.diagnosis && (
                 <button type="button" onClick={() => generateDiagnosis(true)} disabled={isDiagnosing} className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors disabled:opacity-50">
                    Sugerir otro
                 </button>
              )}
              <button type="button" onClick={() => generateDiagnosis(false)} disabled={isDiagnosing} className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md transition-colors disabled:opacity-50" style={{ backgroundColor: '#E8F0FB', color: '#1A4A8A' }}>
                {isDiagnosing ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />} Sugerencia IA
              </button>
            </div>
          </div>
          <textarea
            name="diagnosis"
            rows={3}
            value={formData.diagnosis}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="Ej: Rinofaringitis aguda..."
          />
        </div>

        {/* Treatment */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-medium text-gray-500">Tratamiento / Receta</label>
            <button type="button" onClick={generateTreatment} disabled={isTreating} className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md transition-colors disabled:opacity-50" style={{ backgroundColor: '#E8F0FB', color: '#1A4A8A' }}>
              {isTreating ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />} Sugerir Tratamiento IA
            </button>
          </div>
          <textarea
            name="treatment"
            rows={4}
            value={formData.treatment}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="Prescribir medicamentos y dosis..."
          />
        </div>

        {/* AI Warning Footer */}
        <div className="p-3 bg-[#F8F9FA] rounded-xl flex items-start gap-2 border border-gray-100 border-l-[3px] border-l-[#854F0B]">
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            Las sugerencias generadas por IA NO constituyen un diagnóstico médico. Son únicamente recomendaciones basadas en los síntomas registrados. La responsabilidad final recae en el médico tratante.
          </p>
        </div>

        {/* Seguimiento de Consulta (Follow Up) */}
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              name="needs_follow_up"
              checked={(formData as any).needs_follow_up || false}
              onChange={(e) => setFormData({ ...formData, needs_follow_up: e.target.checked } as any)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm font-semibold text-gray-800">¿Requiere Consulta de Seguimiento?</label>
          </div>

          {(formData as any).needs_follow_up && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Fecha Sugerida</label>
                <input 
                  type="date" 
                  name="follow_up_date"
                  value={formData.follow_up_date || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hora Sugerida</label>
                <input 
                  type="time" 
                  name="follow_up_time"
                  value={formData.follow_up_time || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
                />
              </div>
              <div className="col-span-full mt-2">
                 <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-gray-500">Indicaciones de Seguimiento / Notas Próxima Cita</label>
                    <button type="button" onClick={generateFollowUp} disabled={isSuggestingFollowup} className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md transition-colors disabled:opacity-50" style={{ backgroundColor: '#E8F0FB', color: '#1A4A8A' }}>
                       {isSuggestingFollowup ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />} Sugerir Seguimiento IA
                    </button>
                 </div>
                 <textarea 
                    name="follow_up_notes"
                    rows={2}
                    value={formData.follow_up_notes || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none resize-none"
                    placeholder="Ej: Cita en 7 días para revisión de analgésicos..."
                 />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          Guardar Consulta
        </button>
      </form>

      {/* Confirmation Rules Pricing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Confirmar Pago de Consulta</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Pago</label>
                <select
                  value={paymentType}
                  onChange={(e) => {
                    const type = e.target.value as 'normal' | 'discount' | 'increment';
                    setPaymentType(type);
                    setFinalPrice(doctorSettings.base_price); // reset
                  }}
                  className="w-full bg-white px-3 py-2 text-sm border border-gray-200 rounded-lg"
                >
                  <option value="normal">Precio Normal ({doctorSettings.base_price}$)</option>
                  <option value="discount">Aplicar Descuento</option>
                  <option value="increment">Aplicar Incremento</option>
                </select>
              </div>

              {paymentType === 'discount' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Descuento Permitido: {doctorSettings.discount_min}$ - {doctorSettings.discount_max}$</label>
                  <input
                    type="range"
                    min={doctorSettings.discount_min}
                    max={doctorSettings.discount_max}
                    step="1"
                    className="w-full h-2 bg-gray-200 rounded-lg"
                    onChange={(e) => setFinalPrice(doctorSettings.base_price - parseFloat(e.target.value))}
                  />
                  <span className="text-sm font-semibold">Valor Final: ${finalPrice.toFixed(2)}</span>
                </div>
              )}

              {paymentType === 'increment' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Incremento Permitido: {doctorSettings.increment_min}$ - {doctorSettings.increment_max}$</label>
                  <input
                    type="range"
                    min={doctorSettings.increment_min}
                    max={doctorSettings.increment_max}
                    step="1"
                    className="w-full h-2 bg-gray-200 rounded-lg"
                    onChange={(e) => setFinalPrice(doctorSettings.base_price + parseFloat(e.target.value))}
                  />
                  <span className="text-sm font-semibold">Valor Final: ${finalPrice.toFixed(2)}</span>
                </div>
              )}

              {paymentType === 'normal' && (
                <div className="text-sm">Coste normal predefinido en la configuración.</div>
              )}

              <div className="pt-4 border-t border-gray-50 flex gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSave}
                  disabled={loading}
                  className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Auto-Schedule Modal Overlay */}
      {scheduleModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-lg text-gray-900 border-b pb-2 flex items-center gap-1.5">
               <Sparkles size={18} className="text-blue-500" /> Agendado Automático
            </h3>
            
            <div className="space-y-3">
               <div>
                  <label className="block text-xxs font-black text-gray-400 uppercase">Fecha de Cita</label>
                  <input 
                    type="date" 
                    value={scheduleModal.date} 
                    onChange={e => setScheduleModal(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full text-sm border border-gray-100 rounded-lg p-2 focus:outline-none focus:border-blue-500 mt-1"
                  />
               </div>
               <div>
                  <label className="block text-xxs font-black text-gray-400 uppercase">Hora</label>
                  <input 
                    type="time" 
                    value={scheduleModal.start_time} 
                    onChange={e => setScheduleModal(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full text-sm border border-gray-100 rounded-lg p-2 focus:outline-none focus:border-blue-500 mt-1"
                  />
               </div>
               <div>
                  <label className="block text-xxs font-black text-gray-400 uppercase">Motivo</label>
                  <input 
                    type="text" 
                    value={scheduleModal.reason} 
                    onChange={e => setScheduleModal(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full text-sm border border-gray-100 rounded-lg p-2 focus:outline-none focus:border-blue-500 mt-1"
                  />
               </div>
               <div>
                  <label className="block text-xxs font-black text-gray-400 uppercase">Notas</label>
                  <textarea 
                    value={scheduleModal.notes} 
                    onChange={e => setScheduleModal(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full text-sm border border-gray-100 rounded-lg p-2 focus:outline-none focus:border-blue-500 mt-1"
                  />
               </div>
            </div>

            <div className="flex gap-2 pt-2">
               <button 
                 type="button" 
                 onClick={() => setScheduleModal(prev => ({ ...prev, isOpen: false }))}
                 className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-sm font-medium"
               >
                 Cancelar
               </button>
               <button 
                 type="button" 
                 disabled={scheduleModal.submitting}
                 onClick={handleConfirmSchedule}
                 className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
               >
                 {scheduleModal.submitting && <Loader2 size={14} className="animate-spin" />}
                 Confirmar y Agendar
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal Overlay */}
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
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${feedback.type === 'success' ? 'bg-gray-900 hover:bg-gray-800 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

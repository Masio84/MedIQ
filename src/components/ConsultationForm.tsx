'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertTriangle, Sparkles, X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import cie10Catalogue from '@/lib/cie10_comunes.json';

export default function ConsultationForm({ doctorId, initialPatientId, initialSymptoms, initialWeight, initialPressure, initialTemperature, onPatientChange, editingId, onComplete }: { doctorId: string; initialPatientId?: string; initialSymptoms?: string; initialWeight?: string; initialTemperature?: string; initialPressure?: string; onPatientChange?: (id: string) => void; editingId?: string; onComplete?: () => void }) {
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
    needs_follow_up: false, follow_up_date: '', follow_up_time: '', follow_up_notes: '',
    cie10_code: '', cie10_description: '',
    physical_examination: '', prognosis: '', interconsultation_note: '',
    informed_consent_id: ''
  });

  const [systemsReview, setSystemsReview] = useState({
    general: '', respiratory: '', digestive: '', cardiovascular: '', other: ''
  });

  const [collapsed, setCollapsed] = useState({
    systems: true
  });

  const [aiSuggestions, setAiSuggestions] = useState<{
    symptoms: string[];
    diagnosis: string[];
    treatment: string[];
  }>({ symptoms: [], diagnosis: [], treatment: [] });

  // AI Integration States
  const [cie10Search, setCie10Search] = useState('');
  const [cie10Suggestions, setCie10Suggestions] = useState<{ code: string; description: string }[]>([]);
  const [isSearchingCie10, setIsSearchingCie10] = useState(false);
  const [symptomsList, setSymptomsList] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isTreating, setIsTreating] = useState(false);
  const [isSuggestingFollowup, setIsSuggestingFollowup] = useState(false);
  const [patientContext, setPatientContext] = useState<any>(null);

  // AI Diagnostic Suggestions (Debounced)
  const [suggestedDiagnostics, setSuggestedDiagnostics] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (symptomsList.length < 2) {
      setSuggestedDiagnostics([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch('/api/ai/diagnose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symptoms: symptomsList,
            weight: formData.weight,
            blood_pressure: formData.blood_pressure,
            temperature: formData.temperature,
            age: patientContext?.dob ? Math.floor((Date.now() - new Date(patientContext.dob).getTime()) / 31557600000) : 'Desconocida',
            gender: patientContext?.gender || 'Desconocido',
            medical_history: patientContext?.medical_history
          })
        });
        const data = await res.json();
        if (data.suggestions) {
          setSuggestedDiagnostics(data.suggestions);
        } else {
          setSuggestedDiagnostics([]);
        }
      } catch (err) {
        setSuggestedDiagnostics([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 800);

    return () => clearTimeout(delayDebounce);
  }, [symptomsList, formData.weight, formData.blood_pressure, formData.temperature, patientContext]);

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
          // Doctor identity fields for prescription snapshot
          name: data.name || '',
          specialty: data.specialty || '',
          cedula: data.cedula || '',
          cedula_especialidad: data.cedula_especialidad || '',
          clinic_name: data.clinic_name || '',
          clinic_phone: data.clinic_phone || '',
          clinic_address: data.clinic_address || '',
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

  // Load consultation data if editingId is provided
  useEffect(() => {
    if (!editingId) return;

    const fetchConsultation = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('consultations')
          .select('*')
          .eq('id', editingId)
          .single();

        if (error) throw error;

        if (data) {
          setFormData({
            patient_id: data.patient_id,
            weight: data.weight?.toString() || '',
            blood_pressure: data.blood_pressure || '',
            temperature: data.temperature?.toString() || '',
            symptoms: '', // will be handled by symptomsList if it was a joined string
            diagnosis: data.diagnosis || '',
            treatment: data.treatment || '',
            notes: data.notes || '',
            needs_follow_up: false, // reset or keep as logic dictates
            follow_up_date: '',
            follow_up_time: '',
            follow_up_notes: '',
            cie10_code: data.cie10_code || '',
            cie10_description: data.cie10_description || '',
            physical_examination: data.physical_examination || '',
            prognosis: data.prognosis || '',
            interconsultation_note: data.interconsultation_note || '',
            informed_consent_id: data.informed_consent_id || ''
          });

          if (data.symptoms) {
            setSymptomsList(data.symptoms.split(',').map((s: string) => s.trim()));
          }

          if (data.systems_review) {
            setSystemsReview(data.systems_review);
          }

          setCie10Search(data.cie10_code ? `${data.cie10_code} - ${data.cie10_description}` : '');
        }
      } catch (err: any) {
        setError("Error al cargar la consulta: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultation();
  }, [editingId, supabase]);

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

  // Efecto para búsqueda CIE-10 (Local + AI Fallback)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!cie10Search.trim() || cie10Search.length < 2) {
        setCie10Suggestions([]);
        return;
      }

      // 1. Búsqueda Local (Rápida)
      const localResults = cie10Catalogue.filter(item => 
        item.code.toLowerCase().includes(cie10Search.toLowerCase()) || 
        item.description.toLowerCase().includes(cie10Search.toLowerCase())
      ).slice(0, 5);

      if (localResults.length > 0) {
        setCie10Suggestions(localResults as any);
      }

      // 2. Búsqueda AI (Catálogo Completo con filtros demográficos)
      setIsSearchingCie10(true);
      try {
        const age = patientContext?.dob ? Math.floor((Date.now() - new Date(patientContext.dob).getTime()) / 31557600000) : null;
        const res = await fetch('/api/ai/cie10/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: cie10Search,
            gender: patientContext?.gender || 'Desconocido',
            age
          })
        });
        const data = await res.json();
        if (data.codes) {
          // Combinar resultados locales y AI evitando duplicados por código
          const combined = [...localResults];
          data.codes.forEach((aiItem: any) => {
            if (!combined.some(c => c.code === aiItem.code)) {
              combined.push(aiItem);
            }
          });
          setCie10Suggestions(combined.slice(0, 10));
        }
      } catch (err) {
        console.error('Error en búsqueda AI CIE-10:', err);
      } finally {
        setIsSearchingCie10(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [cie10Search, patientContext]);

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
          gender: patientContext?.gender || 'Desconocido',
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
      // 0. Fetch the doctor's prescription template snapshot
      const { data: templateData } = await supabase
        .from('prescription_templates')
        .select('config')
        .eq('doctor_id', doctorId)
        .single();
      
      const templateSnapshot = templateData?.config || {};

      // 1. Insert or Update Consultation
      let consultation;
      if (editingId) {
        const { data, error: updateError } = await supabase
          .from('consultations')
          .update({
            symptoms: symptomsList.length > 0 ? symptomsList.join(', ') : (formData.symptoms || null),
            diagnosis: formData.diagnosis || null,
            treatment: formData.treatment || null,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            blood_pressure: formData.blood_pressure || null,
            temperature: formData.temperature ? parseFloat(formData.temperature) : null,
            notes: (formData.notes || '') + ( (formData as any).needs_follow_up ? `\n\n[SEGUIMIENTO]: Fecha sugerida: ${(formData as any).follow_up_date || 'N/A'}. Notas de médico: ${(formData as any).follow_up_notes || 'N/A'}` : ''),
            cie10_code: formData.cie10_code || null,
            cie10_description: formData.cie10_description || null,
            physical_examination: formData.physical_examination || null,
            prognosis: formData.prognosis || null,
            interconsultation_note: formData.interconsultation_note || null,
            systems_review: systemsReview
          })
          .eq('id', editingId)
          .select()
          .single();
        
        if (updateError) throw updateError;
        consultation = data;
      } else {
        const { data, error: insertError } = await supabase
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
              cie10_code: formData.cie10_code || null,
              cie10_description: formData.cie10_description || null,
              physical_examination: formData.physical_examination || null,
              prognosis: formData.prognosis || null,
              interconsultation_note: formData.interconsultation_note || null,
              systems_review: systemsReview,
              informed_consent_id: formData.informed_consent_id || null
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        consultation = data;
      }

      // Calculate discount and increment based on paymentType selection for billing update
      let discount = 0;
      let extra_charge = 0;
      if (paymentType === 'discount') discount = Math.max(0, doctorSettings.base_price - finalPrice);
      if (paymentType === 'increment') extra_charge = Math.max(0, finalPrice - doctorSettings.base_price);

      // 2. Insert Billing Record (only for new consultations)
      if (!editingId) {
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
      }

      // 3. Update Prescription Content Snapshot if editing
      if (editingId) {
        const updatedContentSnapshot = {
          symptoms: symptomsList.length > 0 ? symptomsList.join(', ') : (formData.symptoms || null),
          diagnosis: formData.diagnosis || null,
          treatment: formData.treatment || null,
          notes: formData.notes || null,
          vitals: {
            weight: formData.weight,
            blood_pressure: formData.blood_pressure,
            temperature: formData.temperature
          }
        };

        const { error: prescriptionUpdateError } = await supabase
          .from('prescriptions')
          .update({
            content_snapshot: updatedContentSnapshot
          })
          .eq('consultation_id', editingId);
        
        // Non-critical if fails for old consultations without prescription record
      } else {
        // 3. Crear Receta Automática (Prescription) - for new consultations
        const generateFolio = () => {
          const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
          const shortDoc = doctorId.split('-')[0].toUpperCase();
          const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
          return `REC-${shortDoc}-${date}-${rand}`;
        };

        const contentSnapshot: Record<string, any> = {
          symptoms: symptomsList.length > 0 ? symptomsList.join(', ') : (formData.symptoms || null),
          diagnosis: formData.diagnosis || null,
          treatment: formData.treatment || null,
          notes: formData.notes || null,
          vitals: {
            weight: formData.weight,
            blood_pressure: formData.blood_pressure,
            temperature: formData.temperature
          },
          // Variable map for prescription blocks to render correctly
          '{{doctor_name}}': doctorSettings.name || '',
          '{{doctor_specialty}}': doctorSettings.specialty || '',
          '{{doctor_cedula}}': doctorSettings.cedula || '',
          '{{doctor_cedula_esc}}': doctorSettings.cedula_especialidad || '',
          '{{clinic_name}}': doctorSettings.clinic_name || '',
          '{{clinic_phone}}': doctorSettings.clinic_phone || '',
          '{{clinic_address}}': doctorSettings.clinic_address || '',
          '{{patient_name}}': patientContext ? `${patientContext.name || ''} ${patientContext.last_name || ''}`.trim() : '',
          '{{patient_age}}': patientContext?.dob ? String(Math.floor((Date.now() - new Date(patientContext.dob).getTime()) / 31557600000)) : '',
          '{{patient_gender}}': patientContext?.gender || '',
          '{{patient_id}}': patientContext?.id || '',
          '{{date}}': new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
        };

        const { error: prescriptionError } = await supabase
          .from('prescriptions')
          .insert([{
            folio: generateFolio(),
            patient_id: formData.patient_id,
            consultation_id: consultation.id,
            doctor_id: doctorId,
            template_snapshot: templateSnapshot,
            content_snapshot: contentSnapshot
          }]);

        if (prescriptionError) throw prescriptionError;
      }

      // 4. Insert follow-up notification if needed
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

      setFeedback({ 
        isOpen: true, 
        title: editingId ? '¡Actualizado!' : '¡Éxito!', 
        message: editingId ? 'La consulta ha sido actualizada y los cambios registrados en el historial.' : 'Consulta y receta generadas con éxito y enviadas a facturación.', 
        type: 'success' 
      });
      setIsModalOpen(false);
      
      if (onComplete) {
        onComplete();
      }

      if (!editingId) {
        setFormData({
          patient_id: '', weight: '', blood_pressure: '', temperature: '',
          symptoms: '', diagnosis: '', treatment: '', notes: '',
          needs_follow_up: false, follow_up_date: '', follow_up_time: '',
        } as any);
        setSymptomsList([]);
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar la consulta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={triggerSave} className="space-y-6 bg-white p-6 rounded-xl border border-gray-100/50 shadow-sm transition-all duration-300">
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Editar Consulta' : 'Registrar Consulta'}</h3>
          {editingId && (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-black rounded uppercase tracking-widest border border-amber-100">Modo Edición</span>
          )}
        </div>
        
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
          <div className="flex flex-wrap gap-2 mb-2 p-2 border border-gray-100 rounded-lg focus-within:ring-1 focus-within:ring-gray-900 bg-white">
            {Array.isArray(symptomsList) && symptomsList.map(s => (
              <span key={s} className="inline-flex items-center gap-1 bg-gray-50 border-[0.5px] border-black/8 text-gray-800 px-1.5 py-1 rounded-md text-xs font-medium">
                {s}
                <button type="button" onClick={() => setSymptomsList(symptomsList.filter(item => item !== s))} className="text-gray-400 hover:text-red-500"><X size={12}/></button>
              </span>
            ))}
            <input
              type="text"
              placeholder="Escribe un síntoma y presiona Enter o coma..."
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
              onKeyDown={(e) => {
                const isDelimiter = e.key === 'Enter' || e.key === ',';
                if (isDelimiter) {
                  e.preventDefault();
                  const val = symptomInput.trim().replace(/^,|,$/g, '');
                  if (val && !symptomsList.includes(val)) {
                    setSymptomsList([...symptomsList, val]);
                    setSymptomInput('');
                  }
                }
              }}
              className="flex-1 min-w-[150px] text-xs font-medium border-0 focus:outline-none focus:ring-0 p-0.5 placeholder-gray-400 bg-transparent"
            />
          </div>
        </div>

        {/* Interrogatorio por Aparatos y Sistemas */}
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setCollapsed(prev => ({ ...prev, systems: !prev.systems }))}
            className="w-full flex items-center justify-between p-3 bg-gray-50 text-sm font-medium text-gray-700"
          >
            <span>Interrogatorio por Aparatos y Sistemas (NOM-004)</span>
            {collapsed.systems ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          {!collapsed.systems && (
            <div className="p-3 space-y-2 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">General</label>
                <textarea rows={1} className="w-full p-2 border border-gray-100 rounded text-xs" onChange={e => setSystemsReview(p => ({ ...p, general: e.target.value }))}></textarea>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Cardiovascular / Respiratorio</label>
                <textarea rows={1} className="w-full p-2 border border-gray-100 rounded text-xs" onChange={e => setSystemsReview(p => ({ ...p, respiratory: e.target.value }))}></textarea>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Digestivo</label>
                <textarea rows={1} className="w-full p-2 border border-gray-100 rounded text-xs" onChange={e => setSystemsReview(p => ({ ...p, digestive: e.target.value }))}></textarea>
              </div>
            </div>
          )}
        </div>

        {/* Exploración Física */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Exploración Física Detallada *</label>
          <textarea
            name="physical_examination"
            rows={3}
            value={formData.physical_examination}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
            placeholder="Describir cabeza, cuello, tórax, extremidades..."
            required
          />
        </div>

        {/* CIE-10 & Diagnosis */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-medium text-gray-500">Diagnóstico CIE-10 / Impresión Diagnóstica *</label>
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

          {/* Sugerencias de IA CIE-10 */}
          {symptomsList.length >= 2 && (
            <div className="mb-4 animate-in fade-in-50 duration-300">
              {loadingSuggestions ? (
                <div className="bg-blue-50/20 p-4 rounded-xl border border-blue-100/30 flex items-center justify-center gap-2 text-xs text-blue-800 font-bold">
                   <Loader2 size={14} className="animate-spin text-blue-600"/> Analizando síntomas y calculando diagnósticos...
                </div>
              ) : suggestedDiagnostics.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-blue-900 flex items-center gap-1"><Sparkles size={12} className="text-blue-600"/> Diagnósticos Sugeridos por IA</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {suggestedDiagnostics.map((sug, ix) => (
                      <button
                        key={ix}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, cie10_code: sug.codigo, cie10_description: sug.descripcion, diagnosis: sug.descripcion }));
                          setCie10Search(`${sug.codigo} - ${sug.descripcion}`);
                        }}
                        className="bg-gradient-to-br from-white to-blue-50/10 p-3 rounded-xl border border-blue-100/50 hover:shadow-sm hover:border-blue-300 transform hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-1 overflow-hidden">
                             <span className="text-xs font-black text-gray-900 truncate flex-1"><span className="text-blue-600">{sug.codigo}</span> - {sug.descripcion}</span>
                             <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full capitalize ml-1 ${sug.probabilidad === 'alta' ? 'bg-green-50 text-green-700' : sug.probabilidad === 'media' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-500'}`}>
                                {sug.probabilidad}
                             </span>
                          </div>
                          {sug.razon && <p className="text-[10px] text-gray-500 leading-normal line-clamp-2">{sug.razon}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-400 italic">Sugerencias generadas por IA como apoyo al criterio médico. El diagnóstico final es responsabilidad del médico.</p>
                </div>
              ) : null}
            </div>
          )}

          <div className="relative mb-2">
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-medium"
                placeholder="Buscar por nombre o código CIE-10..."
                value={cie10Search}
                onChange={(e) => setCie10Search(e.target.value)}
              />
              {isSearchingCie10 && (
                <div className="absolute right-3 top-3.5">
                  <Loader2 className="animate-spin text-gray-400" size={18} />
                </div>
              )}
            </div>

            {cie10Suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-2 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sugerencias Inteligentes (CIE-10)</span>
                  {isSearchingCie10 && <span className="text-[10px] text-gray-400 animate-pulse">Consultando catálogo completo...</span>}
                </div>
                {cie10Suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, cie10_code: item.code, cie10_description: item.description, diagnosis: item.description }));
                      setCie10Search(`${item.code} - ${item.description}`);
                      setCie10Suggestions([]);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase">{item.code}</span>
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">Oficial</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Prognosis */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Pronóstico (NOM-004)</label>
          <textarea
            name="prognosis"
            rows={1}
            value={formData.prognosis}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
            placeholder="Ej: Bueno para la vida, reservado para la función..."
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
                  {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Confirmar'}
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

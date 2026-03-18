'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function ConsultationForm({ doctorId, initialPatientId }: { doctorId: string; initialPatientId?: string }) {
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
    symptoms: '', diagnosis: '', treatment: '', notes: ''
  });

  const [aiSuggestions, setAiSuggestions] = useState<{
    symptoms: string[];
    diagnosis: string[];
    treatment: string[];
  }>({ symptoms: [], diagnosis: [], treatment: [] });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'normal' | 'discount' | 'increment'>('normal');
  const [finalPrice, setFinalPrice] = useState(0);

  // Feedback State
  const [feedback, setFeedback] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' }>({ isOpen: false, title: '', message: '', type: 'success' });

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

  // AI Mock Autocomplete mechanism
  useEffect(() => {
    const mockAiSytmpoms = ['Fiebre', 'Dolor de cabeza', 'Tos seca', 'Dolor de garganta', 'Congestión nasal'];
    const mockAiDiag = ['Rinofaringitis aguda (Resfriado común)', 'Gastroenteritis viral', 'Faringoamigdalitis', 'Infección urinaria'];
    const mockAiTreat = ['Paracetamol 500mg cada 8 horas', 'Reposo e hidratación abundante', 'Amoxicilina 500mg (según criterio)', 'Antigripal descongestivo'];

    setAiSuggestions({
      symptoms: mockAiSytmpoms.filter(s => formData.symptoms && s.toLowerCase().includes(formData.symptoms.toLowerCase())),
      diagnosis: mockAiDiag.filter(s => formData.diagnosis && s.toLowerCase().includes(formData.diagnosis.toLowerCase())),
      treatment: mockAiTreat.filter(s => formData.treatment && s.toLowerCase().includes(formData.treatment.toLowerCase())),
    });
  }, [formData.symptoms, formData.diagnosis, formData.treatment]);

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
            symptoms: formData.symptoms || null,
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

      setFeedback({ isOpen: true, title: '¡Éxito!', message: 'Consulta guardada y enviada a facturación.', type: 'success' });
      setIsModalOpen(false);
      setFormData({
        patient_id: '', weight: '', blood_pressure: '', temperature: '',
        symptoms: '', diagnosis: '', treatment: '', notes: ''
      });
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
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Symptoms filed with AI Autocomplete */}
        <div className="relative">
          <label className="block text-xs font-medium text-gray-500 mb-1">Síntomas</label>
          <textarea
            name="symptoms"
            rows={2}
            value={formData.symptoms}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
            placeholder="El paciente presenta..."
          />
          {aiSuggestions.symptoms.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-50 shadow-sm rounded-lg mt-1 p-2">
              <span className="text-xs text-gray-400 font-semibold mb-1 block">Sugerencias IA:</span>
              <div className="flex flex-wrap gap-1">
                {aiSuggestions.symptoms.map(s => (
                  <button key={s} type="button" onClick={() => applySuggestion('symptoms', s)} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100">{s}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Diagnosis with AI Autocomplete */}
        <div className="relative">
          <label className="block text-xs font-medium text-gray-500 mb-1">Diagnóstico</label>
          <textarea
            name="diagnosis"
            rows={2}
            value={formData.diagnosis}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
            placeholder="Ej: Rinofaringitis aguda..."
          />
          {aiSuggestions.diagnosis.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-50 shadow-sm rounded-lg mt-1 p-2">
              <span className="text-xs text-gray-400 font-semibold mb-1 block">Sugerencias IA:</span>
              <div className="flex flex-wrap gap-1">
                {aiSuggestions.diagnosis.map(d => (
                  <button key={d} type="button" onClick={() => applySuggestion('diagnosis', d)} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100">{d}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Treatment with AI Autocomplete */}
        <div className="relative">
          <label className="block text-xs font-medium text-gray-500 mb-1">Tratamiento / Receta</label>
          <textarea
            name="treatment"
            rows={3}
            value={formData.treatment}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
            placeholder="Prescribir medicamentos y dosis..."
          />
          {aiSuggestions.treatment.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-50 shadow-sm rounded-lg mt-1 p-2">
              <span className="text-xs text-gray-400 font-semibold mb-1 block">Sugerencias IA:</span>
              <div className="flex flex-wrap gap-1">
                {aiSuggestions.treatment.map(t => (
                  <button key={t} type="button" onClick={() => applySuggestion('treatment', t)} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100">{t}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Warning Footer */}
        <div className="p-3 bg-amber-50 rounded-lg flex items-start gap-2 border border-amber-100">
          <AlertTriangle className="text-amber-500 flex-shrink-0" size={16} />
          <p className="text-xs text-amber-700">
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
                  value={(formData as any).follow_up_date || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Indicaciones (Para Asistente)</label>
                <input 
                  type="text" 
                  name="follow_up_notes"
                  placeholder="Ej: Revisión de estudios"
                  value={(formData as any).follow_up_notes || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
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

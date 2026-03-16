'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ShieldCheck, X } from 'lucide-react';

export default function PatientForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' }>({ isOpen: false, title: '', message: '', type: 'success' });
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const { error: insertError } = await supabase
        .from('patients')
        .insert([
          {
            name: data.name,
            birthdate: data.birthdate || null,
            phone: data.phone || null,
            email: data.email || null,
            address: data.address || null,
            allergies: data.allergies || null,
            medical_history: data.medical_history || null,
          },
        ]);

      if (insertError) throw insertError;

      setFeedback({ isOpen: true, title: '¡Éxito!', message: 'Paciente registrado exitosamente', type: 'success' });
      e.currentTarget.reset();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-gray-100/50">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Registrar Nuevo Paciente</h3>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Nombre Completo *</label>
          <input
            type="text"
            name="name"
            required
            className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="Juan Pérez"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Fecha de Nacimiento</label>
          <input
            type="date"
            name="birthdate"
            className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono</label>
          <input
            type="tel"
            name="phone"
            className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="+56 9 1234 5678"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Correo Electrónico</label>
          <input
            type="email"
            name="email"
            className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="juan@correo.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Dirección</label>
        <input
          type="text"
          name="address"
          className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
          placeholder="Av. Providencia 1234, Santiago"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Alergias</label>
        <textarea
          name="allergies"
          rows={2}
          className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
          placeholder="Ej: Penicilina, mariscos"
        ></textarea>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Historial Médico Relevante</label>
        <textarea
          name="medical_history"
          rows={3}
          className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
          placeholder="Ej: Hipertensión, diabetes tipo 2..."
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? 'Guardando...' : 'Registrar Paciente'}
      </button>
      {feedback.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 text-center">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${feedback.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {feedback.type === 'success' ? <ShieldCheck size={24} /> : <X size={24} />}
            </div>
            <h3 className="font-bold text-lg text-gray-900">{feedback.title}</h3>
            <p className="text-sm text-gray-500">{feedback.message}</p>
            <div>
              <button 
                type="button"
                onClick={() => { setFeedback({ ...feedback, isOpen: false }); onSuccess(); }} 
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${feedback.type === 'success' ? 'bg-gray-900 hover:bg-gray-800 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
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

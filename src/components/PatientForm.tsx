'use client';

import { useState } from 'react';
import { Loader2, ShieldCheck, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function PatientForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' }>({ isOpen: false, title: '', message: '', type: 'success' });

  const [backgrounds, setBackgrounds] = useState({
    hereditary: { diabetes: false, hypertension: false, cancer: false, other: '' },
    personalPathological: { surgery: false, hospitalization: false, medicines: '', other: '' },
    nonPathological: { smoke: false, alcohol: false, exercise: false, other: '' },
    gynecoObstetric: { fur: '', pregnancies: '', births: '', abortions: '', cesareans: '' }
  });

  const [collapsed, setCollapsed] = useState({
    hereditary: true,
    personalPathological: true,
    nonPathological: true,
    gynecoObstetric: true
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Validación CURP en Frontend
    const curp = String(data.curp || '').toUpperCase();
    if (curp && !/^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z]{2}$/.test(curp)) {
      setError('El formato de la CURP no es válido');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/patients/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          birthdate: data.birthdate || null,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
          allergies: data.allergies || null,
          medical_history: data.medical_history || null,
          gender: data.gender || null,
          curp: curp || null,
          blood_type: data.blood_type || null,
          hereditary_background: backgrounds.hereditary,
          personal_pathological_background: backgrounds.personalPathological,
          non_pathological_background: backgrounds.nonPathological,
          gyneco_obstetric_background: backgrounds.gynecoObstetric,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.error || 'Error al guardar');

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

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha de Nacimiento</label>
            <input
              type="date"
              name="birthdate"
              className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Género *</label>
            <select
              name="gender"
              required
              className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
            >
              <option value="">Seleccionar...</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro / No especificado</option>
            </select>
          </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Dirección</label>
          <input
            type="text"
            name="address"
            className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="Av. Providencia 1234"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">CURP</label>
            <input
              type="text"
              name="curp"
              maxLength={18}
              className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="ABCD123456HEFGHI00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Sangre</label>
            <select
              name="blood_type"
              className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
            >
              <option value="">Seleccionar...</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
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
        <label className="block text-xs font-medium text-gray-500 mb-1">Motivo de Consulta / Historial General</label>
        <textarea
          name="medical_history"
          rows={3}
          className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
          placeholder="Ej: Checkup general"
        ></textarea>
      </div>

      {/* --- SECCIONES DE ANTECEDENTES NOM-004 --- */}
      <h4 className="text-sm font-bold text-gray-900 mt-4 border-b pb-1">Antecedentes Médicos (NOM-004)</h4>

      {/* Heredo-Familiares */}
      <div className="border border-gray-100 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setCollapsed(prev => ({ ...prev, hereditary: !prev.hereditary }))}
          className="w-full flex items-center justify-between p-3 bg-gray-50 text-sm font-medium text-gray-700"
        >
          <span>Heredo-Familiares</span>
          {collapsed.hereditary ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        {!collapsed.hereditary && (
          <div className="p-3 grid grid-cols-2 gap-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" onChange={e => setBackgrounds(p => ({ ...p, hereditary: { ...p.hereditary, diabetes: e.target.checked } }))} /> Diabetes</label>
            <label className="flex items-center gap-2"><input type="checkbox" onChange={e => setBackgrounds(p => ({ ...p, hereditary: { ...p.hereditary, hypertension: e.target.checked } }))} /> Hipertensión</label>
            <label className="flex items-center gap-2"><input type="checkbox" onChange={e => setBackgrounds(p => ({ ...p, hereditary: { ...p.hereditary, cancer: e.target.checked } }))} /> Cáncer</label>
            <textarea className="col-span-2 mt-1 w-full p-2 border border-gray-100 rounded text-xs" rows={1} placeholder="Cáncer especificar, otros antecedentes..." onChange={e => setBackgrounds(p => ({ ...p, hereditary: { ...p.hereditary, other: e.target.value } }))}></textarea>
          </div>
        )}
      </div>

      {/* Personales Patológicos */}
      <div className="border border-gray-100 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setCollapsed(prev => ({ ...prev, personalPathological: !prev.personalPathological }))}
          className="w-full flex items-center justify-between p-3 bg-gray-50 text-sm font-medium text-gray-700"
        >
          <span>Personales Patológicos</span>
          {collapsed.personalPathological ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        {!collapsed.personalPathological && (
          <div className="p-3 grid grid-cols-2 gap-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" onChange={e => setBackgrounds(p => ({ ...p, personalPathological: { ...p.personalPathological, surgery: e.target.checked } }))} /> Cirugías</label>
            <label className="flex items-center gap-2"><input type="checkbox" onChange={e => setBackgrounds(p => ({ ...p, personalPathological: { ...p.personalPathological, hospitalization: e.target.checked } }))} /> Hospitalizaciones</label>
            <textarea className="col-span-2 mt-1 w-full p-2 border border-gray-100 rounded text-xs" rows={1} placeholder="Medicamentos actuales, alergias ya descritas..." onChange={e => setBackgrounds(p => ({ ...p, personalPathological: { ...p.personalPathological, medicines: e.target.value } }))}></textarea>
            <textarea className="col-span-2 mt-1 w-full p-2 border border-gray-100 rounded text-xs" rows={1} placeholder="Otras enfermedades previas..." onChange={e => setBackgrounds(p => ({ ...p, personalPathological: { ...p.personalPathological, other: e.target.value } }))}></textarea>
          </div>
        )}
      </div>

      {/* No Patológicos */}
      <div className="border border-gray-100 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setCollapsed(prev => ({ ...prev, nonPathological: !prev.nonPathological }))}
          className="w-full flex items-center justify-between p-3 bg-gray-50 text-sm font-medium text-gray-700"
        >
          <span>No Patológicos</span>
          {collapsed.nonPathological ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        {!collapsed.nonPathological && (
          <div className="p-3 grid grid-cols-2 gap-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" onChange={e => setBackgrounds(p => ({ ...p, nonPathological: { ...p.nonPathological, smoke: e.target.checked } }))} /> Tabaquismo</label>
            <label className="flex items-center gap-2"><input type="checkbox" onChange={e => setBackgrounds(p => ({ ...p, nonPathological: { ...p.nonPathological, alcohol: e.target.checked } }))} /> Alcoholismo</label>
            <label className="flex items-center gap-2"><input type="checkbox" onChange={e => setBackgrounds(p => ({ ...p, nonPathological: { ...p.nonPathological, exercise: e.target.checked } }))} /> Ejercicio Regular</label>
            <textarea className="col-span-2 mt-1 w-full p-2 border border-gray-100 rounded text-xs" rows={1} placeholder="Frecuencia, otros hábitos..." onChange={e => setBackgrounds(p => ({ ...p, nonPathological: { ...p.nonPathological, other: e.target.value } }))}></textarea>
          </div>
        )}
      </div>

      {/* Gyneco-Obstetric (Collapsible) */}
      <div className="border border-gray-100 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setCollapsed(prev => ({ ...prev, gynecoObstetric: !prev.gynecoObstetric }))}
          className="w-full flex items-center justify-between p-3 bg-gray-50 text-sm font-medium text-gray-700"
        >
          <span>Gineco-Obstétricos (Mujeres)</span>
          {collapsed.gynecoObstetric ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        {!collapsed.gynecoObstetric && (
          <div className="p-3 grid grid-cols-2 gap-2 text-sm">
            <div><label className="block text-xs font-medium text-gray-500 mb-1">FUM (Fecha Última Menstruación)</label><input type="date" className="w-full px-2 py-1 text-xs border border-gray-100 rounded" onChange={e => setBackgrounds(p => ({ ...p, gynecoObstetric: { ...p.gynecoObstetric, fur: e.target.value } }))} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Gestas</label><input type="number" min="0" className="w-full px-2 py-1 text-xs border border-gray-100 rounded" onChange={e => setBackgrounds(p => ({ ...p, gynecoObstetric: { ...p.gynecoObstetric, pregnancies: e.target.value } }))} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Partos</label><input type="number" min="0" className="w-full px-2 py-1 text-xs border border-gray-100 rounded" onChange={e => setBackgrounds(p => ({ ...p, gynecoObstetric: { ...p.gynecoObstetric, births: e.target.value } }))} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Cesáreas</label><input type="number" min="0" className="w-full px-2 py-1 text-xs border border-gray-100 rounded" onChange={e => setBackgrounds(p => ({ ...p, gynecoObstetric: { ...p.gynecoObstetric, cesareans: e.target.value } }))} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Abortos</label><input type="number" min="0" className="w-full px-2 py-1 text-xs border border-gray-100 rounded" onChange={e => setBackgrounds(p => ({ ...p, gynecoObstetric: { ...p.gynecoObstetric, abortions: e.target.value } }))} /></div>
          </div>
        )}
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

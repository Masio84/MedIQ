'use client';

import { useState, useEffect } from 'react';
import { AIPrompt, AIPromptFeature, AIPromptWithAssignments } from '@/types/ai';
import { X, Save, AlertCircle, Info, UserPlus, Trash2 } from 'lucide-react';

interface PromptFormProps {
  prompt: AIPromptWithAssignments | null;
  doctors: any[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const FEATURE_OPTIONS: { value: AIPromptFeature; label: string }[] = [
  { value: 'diagnose', label: 'Diagnóstico Principal' },
  { value: 'summarize', label: 'Resumen de Paciente' },
  { value: 'treat', label: 'Plan de Tratamiento' },
  { value: 'analyze-trends', label: 'Análisis de Tendencias' },
  { value: 'suggest-followup', label: 'Sugerir Seguimiento' },
  { value: 'cie10-search', label: 'Búsqueda CIE-10' },
  { value: 'summarize-assistant', label: 'Resumen Asistente' },
  { value: 'treatment_suggestion', label: 'Sugerencia de Tratamiento' },
  { value: 'patient_summary', label: 'Resumen de Paciente (V2)' },
  { value: 'assistant_summary', label: 'Resumen de Asistente (V2)' },
  { value: 'followup_suggestion', label: 'Sugerencia de Seguimiento (V2)' },
  { value: 'trend_analysis', label: 'Análisis de Tendencias (V2)' },
];

export default function PromptForm({ prompt, doctors, isOpen, onClose, onSave }: PromptFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt_text: '',
    feature_key: 'diagnose' as AIPromptFeature,
    is_public: true,
    is_active: true,
    assignments: [] as string[]
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prompt) {
      setFormData({
        name: prompt.name || '',
        description: prompt.description || '',
        prompt_text: prompt.prompt_text || '',
        feature_key: prompt.feature_key || 'diagnose',
        is_public: prompt.is_public ?? true,
        is_active: prompt.is_active ?? true,
        assignments: prompt.assignments || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        prompt_text: '',
        feature_key: 'diagnose',
        is_public: true,
        is_active: true,
        assignments: []
      });
    }
  }, [prompt, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el prompt');
    } finally {
      setSaving(false);
    }
  };

  const toggleDoctor = (doctorId: string) => {
    setFormData(prev => ({
      ...prev,
      assignments: prev.assignments.includes(doctorId)
        ? prev.assignments.filter(id => id !== doctorId)
        : [...prev.assignments, doctorId]
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md overflow-y-auto overflow-x-hidden">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/20">
        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase text-[15px]">
              {prompt ? 'Editar Configuración IA' : 'Configurar Nuevo Prompt'}
            </h2>
            <p className="text-[11px] text-gray-400 font-bold mt-1.5 uppercase tracking-wider">
              {prompt ? `VERSIÓN ACTUAL: v${prompt.version}` : 'SISTEMA DE INTELIGENCIA MÉDICA'}
            </p>
          </div>
          <button 
             onClick={onClose} 
             className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-6">
          {error && (
            <div className="p-4 text-xs font-bold text-red-600 bg-red-50 rounded-2xl flex gap-3 border border-red-100 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre Descriptivo</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 text-sm font-medium border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none bg-gray-50/50 text-gray-900 transition-all"
                  placeholder="Ej. Diagnóstico Estándar v2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Funcionalidad</label>
                <select
                  value={formData.feature_key}
                  onChange={(e) => setFormData({ ...formData, feature_key: e.target.value as AIPromptFeature })}
                  className="w-full px-4 py-3 text-sm font-bold border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none bg-gray-50/50 text-gray-700 transition-all cursor-pointer"
                >
                  {FEATURE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Memo / Notas Internas</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 text-sm font-medium border border-gray-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none bg-gray-50/50 text-gray-900 transition-all resize-none"
                  placeholder="Instrucciones breves para otros admins..."
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 ml-1">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Contenido del Prompt (System Role)</label>
              <div className="group relative">
                <Info className="w-3.5 h-3.5 text-gray-300 cursor-help" />
                <div className="hidden group-hover:block absolute right-0 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-[10px] rounded-xl shadow-xl z-10 border border-gray-800 font-medium">
                  Configura el comportamiento fundamental de la IA. Usa claves como {"{symptoms}"} o {"{context}"} según el feature.
                </div>
              </div>
            </div>
            <textarea
              required
              rows={6}
              value={formData.prompt_text}
              onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
              className="w-full px-4 py-3 font-mono text-xs border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none bg-gray-900 text-gray-100 leading-relaxed transition-all shadow-inner"
              placeholder="Eres un experto en medicina preventiva..."
            />
          </div>

          <div className="p-5 bg-blue-50/30 rounded-2xl border border-blue-100/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={formData.is_public} 
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded-lg border-gray-200 focus:ring-offset-0 focus:ring-blue-500/20 cursor-pointer"
                  />
                  <span className="text-[11px] font-black text-gray-700 uppercase tracking-wide group-hover:text-blue-600 transition-colors">Visibilidad Global</span>
                </label>
                
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={formData.is_active} 
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-green-500 rounded-lg border-gray-200 focus:ring-offset-0 focus:ring-green-500/20 cursor-pointer"
                  />
                  <span className="text-[11px] font-black text-gray-700 uppercase tracking-wide group-hover:text-green-600 transition-colors">Estado Activo</span>
                </label>
              </div>
            </div>

            {!formData.is_public && (
              <div className="pt-4 border-t border-blue-100">
                <label className="block text-[10px] font-black text-blue-800 uppercase tracking-widest mb-3">
                  ACCESO EXCLUSIVO PARA MÉDICOS (WHITELIST)
                </label>
                <div className="max-h-36 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1 custom-scrollbar">
                  {doctors.map(dr => (
                    <button
                      key={dr.id}
                      type="button"
                      onClick={() => toggleDoctor(dr.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                        formData.assignments.includes(dr.id)
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                          : 'bg-white text-gray-500 border-gray-100 hover:border-blue-300 hover:bg-blue-50/50 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 transition-colors ${
                          formData.assignments.includes(dr.id) ? 'bg-blue-500 shadow-inner' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {dr.name?.[0]?.toUpperCase() || 'D'}
                        </div>
                        <span className="text-[11px] font-bold truncate tracking-tight">{dr.name}</span>
                      </div>
                      {formData.assignments.includes(dr.id) ? (
                        <Trash2 className="w-3.5 h-3.5 ml-2" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5 ml-2 text-gray-300" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-gray-400 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 hover:text-gray-600 transition-all active:scale-95 shadow-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2.5 text-[11px] font-black uppercase tracking-widest text-white bg-blue-600 rounded-xl hover:bg-blue-700 flex items-center justify-center min-w-[170px] disabled:opacity-70 transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-2" />
                  {prompt ? 'Actualizar Versión' : 'Publicar Prompt'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

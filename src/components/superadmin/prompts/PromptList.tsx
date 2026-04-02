'use client';

import { useState } from 'react';
import { AIPrompt, AIPromptFeature } from '@/types/ai';
import { 
  Edit2, 
  Play, 
  Search, 
  Globe, 
  Lock, 
  Terminal, 
  Code2, 
  MessageSquare,
  Activity,
  UserSearch,
  FileSearch,
  Filter
} from 'lucide-react';

interface PromptListProps {
  prompts: AIPrompt[];
  loading: boolean;
  onEdit: (prompt: AIPrompt) => void;
  onTest: (prompt: AIPrompt) => void;
}

const FEATURE_ICONS: Record<AIPromptFeature, any> = {
  'diagnose': Activity,
  'summarize': MessageSquare,
  'treat': Terminal,
  'analyze-trends': Code2,
  'suggest-followup': UserSearch,
  'cie10-search': FileSearch,
  'summarize-assistant': MessageSquare,
  'treatment_suggestion': Terminal,
  'patient_summary': MessageSquare,
  'assistant_summary': MessageSquare,
  'followup_suggestion': UserSearch,
  'trend_analysis': Code2,
};

const FEATURE_LABELS: Record<AIPromptFeature, string> = {
  'diagnose': 'Diagnóstico',
  'summarize': 'Resumen Paciente',
  'treat': 'Plan de Tratamiento',
  'analyze-trends': 'Análisis de Tendencias',
  'suggest-followup': 'Sugerir Seguimiento',
  'cie10-search': 'Búsqueda CIE-10',
  'summarize-assistant': 'Resumen Asistente',
  'treatment_suggestion': 'Sugerencia de Tratamiento',
  'patient_summary': 'Resumen de Paciente (V2)',
  'assistant_summary': 'Resumen de Asistente (V2)',
  'followup_suggestion': 'Sugerencia de Seguimiento (V2)',
  'trend_analysis': 'Análisis de Tendencias (V2)',
};

export default function PromptList({ prompts, loading, onEdit, onTest }: PromptListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [featureFilter, setFeatureFilter] = useState<string>('all');

  const filteredPrompts = prompts.filter((prompt) => {
    const matchesSearch = 
      prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      prompt.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFeature = featureFilter === 'all' || prompt.feature_key === featureFilter;
    return matchesSearch && matchesFeature;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Filters Head */}
      <div className="p-4 border-b border-gray-50 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/30">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs font-medium border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-900 transition-all shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-gray-100 shadow-sm">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={featureFilter}
            onChange={(e) => setFeatureFilter(e.target.value)}
            className="text-[11px] font-bold text-gray-600 border-none bg-transparent py-2 focus:ring-0 cursor-pointer"
          >
            <option value="all">TODAS LAS FUNCIONES</option>
            {Object.entries(FEATURE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto whitespace-nowrap">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-4">Configuración / Origen</th>
              <th className="px-6 py-4">Alcance</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-center">Versión</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  <div className="flex justify-center items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Cargando prompts...</span>
                  </div>
                </td>
              </tr>
            ) : filteredPrompts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No se encontraron prompts
                </td>
              </tr>
            ) : (
              filteredPrompts.map((prompt) => {
                const Icon = FEATURE_ICONS[prompt.feature_key] || Activity;
                
                return (
                  <tr key={prompt.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-100/50">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{prompt.name}</div>
                          <div className="text-[10px] font-black text-blue-500/80 uppercase tracking-tight mt-0.5">
                            {FEATURE_LABELS[prompt.feature_key]}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {prompt.is_public ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-100 uppercase tracking-tighter">
                          <Globe className="w-3 h-3" /> Global
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-tighter">
                          <Lock className="w-3 h-3" /> Privado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        prompt.is_active 
                          ? 'bg-green-50 text-green-600 border border-green-100' 
                          : 'bg-gray-50 text-gray-400 border border-gray-100'
                      }`}>
                        {prompt.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-400 font-black text-[11px] bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                        v{prompt.version}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onTest(prompt)}
                          className="px-3 py-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 border border-transparent hover:border-green-100 shadow-sm hover:shadow-none"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Probar
                        </button>
                        <button
                          onClick={() => onEdit(prompt)}
                          className="px-3 py-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 border border-transparent hover:border-blue-100 shadow-sm hover:shadow-none"
                        >
                          <Edit2 className="w-3 h-3" />
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

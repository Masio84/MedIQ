'use client';

import { useState } from 'react';
import { AIPrompt } from '@/types/ai';
import { X, Play, AlertCircle, Bot, Zap, Clock, Terminal } from 'lucide-react';

interface PromptTesterProps {
  prompt: AIPrompt | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PromptTester({ prompt, isOpen, onClose }: PromptTesterProps) {
  const [testInput, setTestInput] = useState('{\n  "age": 45,\n  "gender": "Masculino",\n  "symptoms": "Fiebre persistente, tos seca, dolor torácico"\n}');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [usage, setUsage] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !prompt) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setUsage(null);
    setError(null);

    try {
      const response = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_text: prompt.prompt_text,
          input_data: testInput
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al conectar con la IA de prueba');
      }

      setTestResult(data.result);
      setUsage(data.usage);
    } catch (err: any) {
      setError(err.message || 'Error inesperado durante la prueba');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md overflow-y-auto overflow-x-hidden">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/20">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm border border-blue-100/50">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight leading-tight uppercase text-[15px]">LABORATORIO DE PROMPTS</h2>
              <p className="text-[11px] text-gray-400 font-bold mt-1 uppercase tracking-wider">PROBANDO: <span className="text-blue-600">{prompt.name}</span></p>
            </div>
          </div>
          <button 
             onClick={onClose} 
             className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
          
          <div className="w-full md:w-1/2 p-8 flex flex-col gap-6 overflow-y-auto bg-gray-50/20">
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Entrada de Prueba (JSON)</label>
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="w-full flex-1 min-h-[150px] md:min-h-0 md:h-[220px] p-5 font-mono text-[11px] border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none bg-gray-900 text-blue-300 leading-relaxed transition-all shadow-inner resize-none"
                placeholder="Inserta el objeto JSON..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">System Prompt Configurado</label>
              <div className="w-full max-h-[220px] p-5 font-mono text-[10px] border border-gray-100 rounded-2xl bg-white text-gray-500 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-sm italic">
                {prompt.prompt_text}
              </div>
            </div>

            <button
              onClick={handleTest}
              disabled={testing}
              className="mt-2 w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg active:scale-[0.98]"
            >
              {testing ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  PROCESANDO...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  EJECUTAR DIAGNÓSTICO IA
                </>
              )}
            </button>
          </div>

          {/* Right Side: Output */}
          <div className="w-full md:w-1/2 p-8 flex flex-col gap-6 bg-white overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Respuesta de MedIQ AI</label>
              {usage && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-1 uppercase tracking-tighter">
                    {usage.input_tokens + usage.output_tokens} TOKENS CONSUMIDOS
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="p-5 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex gap-4 animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            {!testResult && !error && !testing && (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 text-center p-10">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 border border-gray-100 shadow-inner">
                  <Bot className="w-10 h-10 stroke-[1.5] text-gray-200" />
                </div>
                <p className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Laboratorio Inactivo</p>
                <p className="text-[11px] mt-2 max-w-[220px] font-medium text-gray-300">Configura la entrada y pulsa ejecutar para validar la respuesta del motor de IA.</p>
              </div>
            )}

            {testing && (
              <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-8">
                <div className="relative">
                  <div className="w-20 h-20 border-[6px] border-blue-50 rounded-full animate-ping absolute"></div>
                  <div className="w-20 h-20 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin shadow-lg"></div>
                </div>
                <div className="space-y-3 text-center">
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Consultando Red Neural MedIQ</p>
                  <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Inferencia en curso...</p>
                </div>
              </div>
            )}

            {testResult && (
              <div className="flex-1">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 min-h-full whitespace-pre-wrap font-sans text-gray-700 text-[13px] leading-relaxed shadow-inner">
                  {testResult}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

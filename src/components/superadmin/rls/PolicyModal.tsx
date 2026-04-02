'use client';

import { useState, useEffect } from 'react';
import { RLSPolicy, RLSOperation } from '@/types/rls';
import { X, Shield, Save, Info, AlertCircle, CheckCircle2, ChevronRight, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  policy: RLSPolicy | null;
  onSave: (data: any) => Promise<void>;
}

const TEMPLATES = [
  {
    name: 'Acceso Total (Solo Propietario)',
    description: 'El usuario solo puede ver/editar sus propios registros basados en doctor_id.',
    command: 'ALL' as RLSOperation,
    roles: ['authenticated'],
    using: "doctor_id = auth.uid()",
    with_check: "doctor_id = auth.uid()"
  },
  {
    name: 'Lectura Pública',
    description: 'Cualquier usuario (incluyendo anónimos) puede leer los datos.',
    command: 'SELECT' as RLSOperation,
    roles: ['public'],
    using: "true",
    with_check: null
  },
  {
    name: 'Solo Lectura Autenticados',
    description: 'Solo usuarios logueados pueden ver los datos.',
    command: 'SELECT' as RLSOperation,
    roles: ['authenticated'],
    using: "true",
    with_check: null
  },
  {
    name: 'Admin Global',
    description: 'Permiso total sin restricciones (Cuidado).',
    command: 'ALL' as RLSOperation,
    roles: ['authenticated'],
    using: "true",
    with_check: "true"
  }
];

export default function PolicyModal({ isOpen, onClose, tableName, policy, onSave }: PolicyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    command: 'SELECT' as RLSOperation,
    roles: ['authenticated'],
    using: 'true',
    withCheck: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (policy) {
      setFormData({
        name: policy.name,
        command: policy.command,
        roles: policy.roles,
        using: policy.qual,
        withCheck: policy.with_check || ''
      });
    } else {
      setFormData({
        name: `policy_${tableName}_${Date.now().toString().slice(-4)}`,
        command: 'SELECT',
        roles: ['authenticated'],
        using: 'true',
        withCheck: ''
      });
    }
  }, [policy, tableName, isOpen]);

  if (!isOpen) return null;

  const validateSQL = (sql: string) => {
    if (!sql || sql.trim() === '') return 'La cláusula no puede estar vacía.';
    
    // Conteo de paréntesis
    const openParen = (sql.match(/\(/g) || []).length;
    const closeParen = (sql.match(/\)/g) || []).length;
    if (openParen !== closeParen) return 'Paréntesis no balanceados.';
    
    // Palabras prohibidas (básico para seguridad en UI)
    const forbidden = [';', 'DROP', 'DELETE FROM', 'UPDATE ', 'INSERT INTO'];
    for (const word of forbidden) {
       if (sql.toUpperCase().includes(word)) return `Palabra reservada '${word}' no permitida en cláusula RLS.`;
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación previa
    const errorUsing = validateSQL(formData.using);
    if (errorUsing) {
       setValidationError(`Error en USING: ${errorUsing}`);
       return;
    }
    
    if (formData.withCheck) {
      const errorCheck = validateSQL(formData.withCheck);
      if (errorCheck) {
         setValidationError(`Error en WITH CHECK: ${errorCheck}`);
         return;
      }
    }

    setValidationError(null);
    setLoading(true);
    
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Error al guardar la política');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setFormData({
      ...formData,
      command: tpl.command,
      roles: tpl.roles,
      using: tpl.using,
      withCheck: tpl.with_check || ''
    });
    toast.success('Plantilla aplicada', { description: tpl.name });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-4xl my-8 overflow-hidden border border-white/20 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                  <Shield className="w-5 h-5 text-white" />
               </div>
               <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none text-[16px]">
                    {policy ? 'Editar Política RLS' : 'Nueva Política de Seguridad'}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-bold mt-1.5 uppercase tracking-wider">
                    Tabla en proceso: <span className="text-blue-500">{tableName}</span>
                  </p>
               </div>
            </div>
          </div>
          <button 
             onClick={onClose} 
             className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 h-full lg:max-h-[70vh]">
          
          {/* Left: Templates / Presets */}
          <div className="lg:col-span-4 bg-slate-50/80 dark:bg-slate-900/80 p-6 border-r border-slate-100 dark:border-slate-800 overflow-y-auto custom-scrollbar">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
               <Copy className="w-3.5 h-3.5" />
               Plantillas de Seguridad
            </h3>
            
            <div className="space-y-3">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => applyTemplate(tpl)}
                  className="w-full group p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left hover:border-blue-500 hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                    {tpl.name}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed italic">
                    {tpl.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Aplicar</span>
                    <ChevronRight className="w-3 h-3 text-blue-500" />
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
               <div className="flex gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                    Las políticas aplicadas tendrán efecto inmediato en todos los canales de Supabase.
                  </p>
               </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-8 p-8 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {validationError && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex gap-3 items-start animate-shake">
                   <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                   <div className="text-xs font-bold text-red-700 dark:text-red-400 leading-normal">
                      Error de Validación: {validationError}
                   </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Nombre Único</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 text-sm font-bold border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
                    placeholder="ej. policy_name"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Operación CRUD</label>
                  <select
                    value={formData.command}
                    onChange={(e) => setFormData({ ...formData, command: e.target.value as RLSOperation })}
                    className="w-full px-4 py-3 text-sm font-bold border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 outline-none dark:text-white cursor-pointer"
                  >
                    <option value="ALL">ALL (COMPLETO)</option>
                    <option value="SELECT">SELECT (LECTURA)</option>
                    <option value="INSERT">INSERT (CREACIÓN)</option>
                    <option value="UPDATE">UPDATE (EDICIÓN)</option>
                    <option value="DELETE">DELETE (ELIMINACIÓN)</option>
                  </select>
                </div>
              </div>

              <div>
                 <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Regla de Acceso (USING Clause)</label>
                 <div className="relative group">
                    <textarea
                      required
                      rows={4}
                      value={formData.using}
                      onChange={(e) => setFormData({ ...formData, using: e.target.value })}
                      className="w-full px-4 py-4 font-mono text-xs border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-900 text-blue-100 leading-relaxed focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-inner"
                      placeholder="v_id = auth.uid()"
                    />
                    <div className="absolute top-3 right-3 opacity-30 group-focus-within:opacity-100 transition-opacity">
                       <CheckCircle2 className={`w-4 h-4 ${validateSQL(formData.using) ? 'text-amber-500' : 'text-emerald-500'}`} />
                    </div>
                 </div>
                 <p className="mt-2 text-[9px] text-slate-400 ml-1 italic">Dato curioso: `auth.uid()` devuelve el UUID del usuario logueado en Supabase.</p>
              </div>

              {['INSERT', 'UPDATE', 'ALL'].includes(formData.command) && (
                <div>
                  <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Validación de Salida (WITH CHECK)</label>
                  <textarea
                    rows={2}
                    value={formData.withCheck}
                    onChange={(e) => setFormData({ ...formData, withCheck: e.target.value })}
                    className="w-full px-4 py-4 font-mono text-xs border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-900/80 text-emerald-100 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-inner"
                    placeholder="Si se deja vacío, aplica la regla USING."
                  />
                </div>
              )}

              <div className="pt-6 flex justify-end gap-4 border-t border-slate-50 dark:border-slate-800/50">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 text-[11px] font-black uppercase tracking-widest text-white bg-blue-600 rounded-2xl hover:bg-blue-700 flex items-center justify-center min-w-[200px] disabled:opacity-70 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 mr-2" />
                      {policy ? 'Actualizar Política' : 'Ejecutar en Postgres'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}

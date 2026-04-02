'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AIPrompt, AIPromptWithAssignments } from '@/types/ai';
import PromptList from './PromptList';
import PromptForm from './PromptForm';
import PromptTester from './PromptTester';
import { PlusCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function PromptManager() {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTesterOpen, setIsTesterOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<AIPromptWithAssignments | null>(null);
  const [testPrompt, setTestPrompt] = useState<AIPrompt | null>(null);

  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Iniciando fetch de prompts...');
      // 1. Obtener prompts
      // Usamos feature_key y prompt_text según el esquema confirmado
      const { data: promptsData, error: promptsError } = await supabase
        .from('ai_prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (promptsError) {
        console.error('Error fetching prompts:', promptsError);
        throw promptsError;
      }
      
      console.log('Prompts cargados:', promptsData?.length || 0);
      setPrompts(promptsData || []);

      // 2. Obtener doctores (perfiles con rol doctor) para las asignaciones
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'doctor')
        .order('id'); // Usamos id para mayor seguridad si no hay name indexado

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }
      
      console.log('Doctores cargados:', profilesData?.length || 0);
      setDoctors(profilesData || []);

    } catch (error: any) {
      console.error('Error detallado en fetchData:', error);
      // Intentamos extraer un mensaje útil del error de Supabase
      const errorMsg = error.message || error.details || 'Error de conexión';
      toast.error('Error al cargar datos', { 
        description: `Detalle: ${errorMsg}` 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateNew = () => {
    setSelectedPrompt(null);
    setIsFormOpen(true);
  };

  const handleEdit = async (prompt: AIPrompt) => {
    // Fetch assignments for this prompt
    const { data: assignments } = await supabase
      .from('ai_prompt_assignments')
      .select('doctor_id')
      .eq('prompt_id', prompt.id);
    
    setSelectedPrompt({
      ...prompt,
      assignments: assignments?.map(a => a.doctor_id) || []
    });
    setIsFormOpen(true);
  };

  const handleTest = (prompt: AIPrompt) => {
    setTestPrompt(prompt);
    setIsTesterOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      const { assignments, ...promptData } = data;
      let promptId = selectedPrompt?.id;

      if (selectedPrompt) {
        // Update existing (implicitly creating a new version logic could be added here)
        const { error: updateError } = await supabase
          .from('ai_prompts')
          .update({
            ...promptData,
            version: (selectedPrompt.version || 1) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedPrompt.id);

        if (updateError) throw updateError;
        toast.success('Prompt actualizado correctamente');
      } else {
        // Create new
        const { data: newPrompt, error: createError } = await supabase
          .from('ai_prompts')
          .insert([promptData])
          .select()
          .single();

        if (createError) throw createError;
        promptId = newPrompt.id;
        toast.success('Prompt creado correctamente');
      }

      // Handle assignments (Sync logic)
      if (promptId) {
        // Simple sync: delete old and insert new
        await supabase.from('ai_prompt_assignments').delete().eq('prompt_id', promptId);
        
        if (assignments && assignments.length > 0) {
          const assignmentRows = assignments.map((docId: string) => ({
            prompt_id: promptId,
            doctor_id: docId
          }));
          await supabase.from('ai_prompt_assignments').insert(assignmentRows);
        }
      }

      fetchData();
    } catch (error: any) {
      console.error('Error saving prompt:', error);
      throw error; // Rethrow to show in form
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-tight">Configuración de Prompts IA</h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Control centralizado de inteligencia artificial</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 animate-pulse" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{prompts.length} Prompts Activos</span>
          </div>
          
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all shadow-sm active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nuevo Prompt</span>
          </button>
        </div>
      </div>

      {/* REFRESH & STATS BAR */}
      <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-dashed border-gray-200">
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-50"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Estado del Sistema</span>
        </div>
        
        <div className="flex gap-4">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500" />
             <span className="text-[10px] font-bold text-gray-500">Conectado a Edge Functions</span>
           </div>
        </div>
      </div>

      <div className="mt-4">
        <PromptList 
          prompts={prompts} 
          loading={loading} 
          onEdit={handleEdit} 
          onTest={handleTest} 
        />
      </div>

      <PromptForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        prompt={selectedPrompt}
        doctors={doctors}
        onSave={handleSave}
      />

      <PromptTester 
        isOpen={isTesterOpen}
        onClose={() => setIsTesterOpen(false)}
        prompt={testPrompt}
      />
    </div>
  );
}

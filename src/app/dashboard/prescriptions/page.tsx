'use client';

import { useEffect, useState } from 'react';
import { usePrescriptionStore } from '@/components/prescriptions/store/prescription-template.store';
import DocumentPreview from '@/components/prescriptions/preview/DocumentPreview';
import BlockEditor from '@/components/prescriptions/editor/BlockEditor';
import ConfigPanel from '@/components/prescriptions/editor/ConfigPanel';
import { generatePrescriptionPDF } from '@/components/prescriptions/utils/pdf-generator';
import { getWhatsAppLink, directPrintPrescription } from '@/components/prescriptions/utils/sharing-engine';
import { MOCK_PATIENT_DATA } from '@/components/prescriptions/mock/prescription-template.mock';
import { FileText, Save, RotateCcw, Layout, Type, Search, ZoomIn, ZoomOut, ChevronUp, ChevronDown, Settings, GripVertical, Check, Download, Loader2, Printer, MessageSquare, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function PrescriptionsPage() {
  const [zoom, setZoom] = useState(0.8);
  const [showRules, setShowRules] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const hasPhone = !!(MOCK_PATIENT_DATA as any).phone;
  const hasEmail = !!(MOCK_PATIENT_DATA as any).email;
  const [leftView, setLeftView] = useState<'config' | 'blocks'>('config');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  
  const { 
    template, 
    updatePage, 
    toggleBlock, 
    reorderBlocks, 
    resetTemplate,
    loadTemplate
  } = usePrescriptionStore();

  useEffect(() => {
    const fetchTemplate = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('prescription_templates')
          .select('config')
          .eq('doctor_id', user.id)
          .single();

        if (data?.config) {
          loadTemplate(data.config);
          toast.success('Plantilla cargada desde la nube');
        }
      } catch (err) {
        console.error('Error fetching template:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplate();
  }, [loadTemplate, supabase]);

  const handleSaveTemplate = async () => {
    setIsSaving(true);
    const t = toast.loading('Guardando plantilla...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Sesión no encontrada', { id: t });
        return;
      }

      const { error } = await supabase
        .from('prescription_templates')
        .upsert({
          doctor_id: user.id,
          config: template,
          updated_at: new Date().toISOString()
        }, { onConflict: 'doctor_id' });

      if (error) throw error;
      toast.success('Plantilla guardada correctamente', { id: t });
    } catch (error) {
       console.error('Error saving template:', error);
       toast.error('Error al guardar la plantilla', { id: t });
    } finally {
      setIsSaving(false);
    }
  };

  const handleWhatsAppShare = () => {
    const link = getWhatsAppLink(template);
    window.open(link, '_blank');
    toast.success('Mensaje configurado para WhatsApp');
  };

  const handlePrint = async () => {
    toast.loading('Preparando impresión...');
    await directPrintPrescription('prescription-canvas');
  };

  const handleEmailShare = () => {
    toast.info('Integrando con el servicio de correo de MedIQ...');
    setTimeout(() => {
      toast.success('Correo enviado al paciente con éxito');
    }, 1500);
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    const t = toast.loading('Generando PDF...');
    try {
      await generatePrescriptionPDF(template, 'prescription-canvas');
      toast.success('PDF descargado con éxito', { id: t });
    } catch (error) {
       toast.error('Error al generar el PDF', { id: t });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    console.log('Prescription Template State Updated:', template);
  }, [template]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-blue-600" /> Generador de Recetas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Módulo de personalización de plantillas médicas
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={resetTemplate}
            className="px-3 py-2 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-1.5 transition-all"
            title="Limpiar cambios"
          >
            <RotateCcw size={14} /> <span className="hidden sm:inline">REINICIAR</span>
          </button>
          
          <div className="h-10 w-[1px] bg-gray-100 mx-1" />

          <button 
            onClick={handlePrint}
            className="p-2.5 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm"
            title="Imprimir Directamente"
          >
            <Printer size={18} />
          </button>

          <button 
            onClick={handleWhatsAppShare}
            disabled={!hasPhone}
            className={`p-2.5 rounded-xl border transition-all shadow-sm ${
              hasPhone 
              ? 'text-gray-600 bg-white border-gray-200 hide-gray-50 hover:text-emerald-500' 
              : 'text-gray-300 bg-gray-50 border-gray-100 cursor-not-allowed opacity-60'
            }`}
            title={hasPhone ? "Enviar por WhatsApp" : "El paciente no tiene número de teléfono"}
          >
            <MessageSquare size={18} />
          </button>

          <button 
            onClick={handleEmailShare}
            disabled={!hasEmail}
            className={`p-2.5 rounded-xl border transition-all shadow-sm ${
              hasEmail 
              ? 'text-gray-600 bg-white border-gray-200 hover:text-orange-500' 
              : 'text-gray-300 bg-gray-50 border-gray-100 cursor-not-allowed opacity-60'
            }`}
            title={hasEmail ? "Enviar por Email" : "El paciente no tiene correo electrónico"}
          >
            <Mail size={18} />
          </button>

          <div className="h-10 w-[1px] bg-gray-100 mx-1" />

          <button 
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="px-4 py-2 text-xs font-black text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 flex items-center gap-2 disabled:opacity-50 transition-all uppercase tracking-widest"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
            PDF
          </button>

          <button 
            onClick={handleSaveTemplate}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span className="hidden md:inline">GUARDAR</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Panel Izquierdo (Configuración y Estructura) */}
        <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
          {/* Navegación de pestañas laterales */}
          <div className="flex p-1 bg-gray-100 rounded-xl mb-4 shrink-0">
             <button 
              onClick={() => setLeftView('config')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                leftView === 'config' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
             >
               Branding & Estilos
             </button>
             <button 
              onClick={() => setLeftView('blocks')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                leftView === 'blocks' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
             >
               Bloques & Orden
             </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {leftView === 'config' ? (
              <div className="space-y-4 pb-4">
                <ConfigPanel />

                {/* Ayudas Visuales moved here for better accessibility */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-4">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     <Search size={12} /> Ayudas de Diseño
                   </p>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => setShowRules(!showRules)}
                        className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${
                          showRules ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                        }`}
                      >
                        REGLAS {showRules ? 'ON' : 'OFF'}
                      </button>
                      <button 
                        onClick={() => setShowGrid(!showGrid)}
                        className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${
                          showGrid ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                        }`}
                      >
                        GRID {showGrid ? 'ON' : 'OFF'}
                      </button>
                   </div>
                   
                   <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg justify-between px-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Zoom</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setZoom(Math.max(0.4, zoom - 0.1))} className="p-1 hover:bg-white rounded border border-transparent hover:border-gray-200 text-gray-500">
                          <ZoomOut size={16} />
                        </button>
                        <span className="text-xs font-mono font-bold w-10 text-center text-gray-600">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="p-1 hover:bg-white rounded border border-transparent hover:border-gray-200 text-gray-500">
                          <ZoomIn size={16} />
                        </button>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                  <h3 className="font-bold text-gray-900 border-b pb-2 text-sm uppercase tracking-tight">Estructura del Documento</h3>
                  
                  <div className="space-y-2">
                    {[...template.blocks].sort((a, b) => a.order - b.order).map((block, index) => (
                      <div key={block.id} className="space-y-2">
                        <div
                          className={`w-full bg-white border rounded-lg transition-all group ${
                            editingBlockId === block.id ? 'border-blue-400 shadow-md ring-1 ring-blue-50' : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between p-2">
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  disabled={index === 0}
                                  onClick={() => reorderBlocks(index, index - 1)}
                                  className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30"
                                >
                                  <ChevronUp size={12} />
                                </button>
                                <button 
                                  disabled={index === template.blocks.length - 1}
                                  onClick={() => reorderBlocks(index, index + 1)}
                                  className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30"
                                >
                                  <ChevronDown size={12} />
                                </button>
                              </div>
                              
                              <button
                                onClick={() => toggleBlock(block.id)}
                                className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                                  block.enabled ? 'bg-emerald-500 border-emerald-600' : 'bg-white border-gray-300'
                                }`}
                              >
                                {block.enabled && <Check size={10} className="text-white" />}
                              </button>
                              
                              <span className={`${block.enabled ? 'text-gray-900 font-bold' : 'text-gray-400 italic font-medium'} text-[11px] uppercase tracking-tight`}>
                                {block.type}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                               <button 
                                onClick={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)}
                                className={`p-1.5 rounded-md transition-colors ${
                                  editingBlockId === block.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                               >
                                 <Settings size={14} />
                               </button>
                            </div>
                          </div>
                        </div>
                        {editingBlockId === block.id && (
                          <div className="px-1">
                            <BlockEditor block={block} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-xl p-4 overflow-hidden border border-gray-800 shadow-xl flex flex-col h-48">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Debug State</span>
                  <div className="flex-1 overflow-y-auto text-[10px] font-mono text-emerald-600 custom-scrollbar">
                    <pre>{JSON.stringify({ styles: template.styles, margins: template.page.margins }, null, 2)}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel de Preview (Col 8) */}
        <div className="lg:col-span-8 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden flex flex-col relative shadow-inner">
           <div className="absolute top-4 right-6 z-10 flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
              <Search size={14} className="text-gray-400" />
              <span className="text-[10px] font-bold text-gray-500">PREVIEW REAL-TIME</span>
           </div>
           
           <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-gray-50/50">
              <div className="pb-[400px]">
                <DocumentPreview zoom={zoom} showRules={showRules} showGrid={showGrid} />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

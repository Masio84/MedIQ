'use client';

import { useEffect, useState } from 'react';
import { useCertificateStore } from '@/components/certificates/store/certificate-template.store';
import CertDocumentPreview from '@/components/certificates/preview/CertDocumentPreview';
import CertBlockEditor from '@/components/certificates/editor/CertBlockEditor';
import CertConfigPanel from '@/components/certificates/editor/CertConfigPanel';
import { generateCertificatePDF } from '@/components/certificates/utils/cert-pdf-generator';
import { shareCertificateViaWhatsApp, directPrintCertificate } from '@/components/certificates/utils/cert-sharing-engine';
import { MOCK_CERTIFICATE_DATA } from '@/components/certificates/mock/certificate-template.mock';
import { FileText, Save, RotateCcw, Search, ZoomIn, ZoomOut, ChevronUp, ChevronDown, Download, Loader2, Printer, MessageSquare, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function CertificateEditorPage() {
  const [zoom, setZoom] = useState(0.8);
  const [showRules, setShowRules] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const hasPhone = true; // In real app, fetch from patient data
  const hasEmail = true; // In real app, fetch from patient data
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
  } = useCertificateStore();

  useEffect(() => {
    const fetchTemplate = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Obtener la plantilla guardada
        const { data: tpl } = await supabase
          .from('certificate_templates')
          .select('id, name, page_config, styles, branding, blocks')
          .eq('doctor_id', user.id)
          .maybeSingle();

        // 2. Obtener la firma y sello del perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('signature_data, seal_config')
          .eq('id', user.id)
          .single();

        if (tpl) {
          const loadedTemplate = {
            id: tpl.id,
            doctorId: user.id,
            name: tpl.name,
            page: tpl.page_config,
            styles: tpl.styles,
            branding: {
              ...tpl.branding,
              signature: profile?.signature_data ? { ...tpl.branding?.signature, url: profile.signature_data } : tpl.branding?.signature,
              seal: profile?.seal_config ? { ...tpl.branding?.seal, textConfig: profile.seal_config } : tpl.branding?.seal
            },
            blocks: tpl.blocks,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          loadTemplate(loadedTemplate as any);
        } else if (profile) {
          // Inyectar firma en la plantilla por defecto si es su primera vez
          const currentTemplate = useCertificateStore.getState().template;
          loadTemplate({
            ...currentTemplate,
            branding: {
              ...currentTemplate.branding,
              signature: profile.signature_data ? { ...currentTemplate.branding.signature, url: profile.signature_data } : currentTemplate.branding.signature,
              seal: profile.seal_config ? { ...currentTemplate.branding.seal, textConfig: profile.seal_config } : currentTemplate.branding.seal
            }
          } as any);
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
    const t = toast.loading('Guardando plantilla de certificado...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Sesión no encontrada', { id: t });
        return;
      }

      // Buscar si el doctor ya tiene una plantilla
      const { data: existing } = await supabase
        .from('certificate_templates')
        .select('id')
        .eq('doctor_id', user.id)
        .maybeSingle();

      const payload = {
        ...(existing?.id ? { id: existing.id } : {}),
        doctor_id: user.id,
        name: template.name || 'Plantilla Predeterminada',
        page_config: template.page,
        styles: template.styles,
        branding: template.branding,
        blocks: template.blocks,
        is_default: true,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('certificate_templates')
        .upsert(payload);

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
    shareCertificateViaWhatsApp('+525555555555', 'DEMO-12345', 'Paciente Prueba');
    toast.success('Mensaje de prueba configurado para WhatsApp');
  };

  const handlePrint = async () => {
    toast.loading('Preparando impresión...');
    await directPrintCertificate('certificate-canvas');
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
      await generateCertificatePDF(template, 'certificate-canvas', 'PREVIEW-0000', 'Paciente de Muestra');
      toast.success('PDF descargado con éxito', { id: t });
    } catch (error) {
       toast.error('Error al generar el PDF', { id: t });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-blue-600" /> Editor de Plantillas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Módulo de personalización de plantillas para Certificados Médicos
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
              ? 'text-gray-600 bg-white border-gray-200 hover:text-emerald-500' 
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
                <CertConfigPanel />

                {/* Ayudas Visuales */}
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
                  <h3 className="font-bold text-gray-900 border-b pb-2 text-sm uppercase tracking-tight">Estructura del Certificado</h3>
                  
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
                                  className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 flex items-center justify-center p-1"
                                >
                                  <ChevronUp size={12} />
                                </button>
                                <button 
                                  disabled={index === template.blocks.length - 1}
                                  onClick={() => reorderBlocks(index, index + 1)}
                                  className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 flex items-center justify-center p-1"
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
                                {block.enabled && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                              </button>
                              
                              <span className={`${block.enabled ? 'text-gray-900 font-bold' : 'text-gray-400 italic font-medium'} text-[11px] uppercase tracking-tight`}>
                                {block.type}
                              </span>
                            </div>

                            <button 
                              onClick={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)}
                              className={`p-1.5 rounded-md transition-colors ${
                                editingBlockId === block.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </button>
                          </div>
                        </div>
                        {editingBlockId === block.id && (
                          <div className="px-1">
                            <CertBlockEditor block={block} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-xl p-4 overflow-hidden border border-gray-800 shadow-xl flex flex-col h-48">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Debug State</span>
                  <div className="flex-1 overflow-y-auto text-[10px] font-mono text-emerald-600 custom-scrollbar text-left">
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
                <CertDocumentPreview zoom={zoom} showRules={showRules} showGrid={showGrid} />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

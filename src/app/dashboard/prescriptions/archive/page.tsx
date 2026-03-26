'use client';

import { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  Hash,
  Loader2,
  ChevronRight,
  X
} from 'lucide-react';
import { toast } from 'sonner';
// Eliminado date-fns para usar formateo nativo y no añadir dependencias
import DocumentPreview from '@/components/prescriptions/preview/DocumentPreview';
import { PreviewTemplateContext, PreviewDataContext } from '@/components/prescriptions/preview/PreviewContext';
import { generatePrescriptionPDF } from '@/components/prescriptions/utils/pdf-generator';

export default function PrescriptionsArchivePage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prescriptions/list');
      const result = await res.json();
      if (result.success) {
        setPrescriptions(result.data);
      } else {
        toast.error('Error al cargar las recetas');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    const patientName = `${p.patients?.name} ${p.patients?.last_name}`.toLowerCase();
    const folio = p.folio.toLowerCase();
    const search = searchTerm.toLowerCase();
    return patientName.includes(search) || folio.includes(search);
  });

  const handleView = (prescription: any) => {
    setSelectedPrescription(prescription);
    setIsPreviewOpen(true);
  };

  const handleDownload = async (prescription: any) => {
    setIsGenerating(true);
    const t = toast.loading('Generando PDF...');
    try {
      await generatePrescriptionPDF(prescription.template_snapshot, 'prescription-archive-canvas');
      toast.success('PDF descargado', { id: t });
    } catch (error) {
      toast.error('Error al generar PDF', { id: t });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-blue-600" /> Archivo de Recetas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Historial inmutable de recetas generadas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Buscar por paciente o folio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full md:w-64 transition-all"
            />
          </div>
          <button className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center text-gray-400">
          <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
          <p className="text-sm font-medium">Cargando archivo médico...</p>
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center text-gray-400 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No se encontraron recetas</h3>
          <p className="text-sm max-w-xs">{searchTerm ? `No hay resultados para "${searchTerm}"` : 'Aún no has generado ninguna receta desde el sistema.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Folio</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Paciente</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha Emisión</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPrescriptions.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <Hash size={14} />
                        </div>
                        <span className="font-mono text-xs font-bold text-gray-700">{p.folio}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-tight">
                            {p.patients?.name} {p.patients?.last_name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">Paciente MedIQ</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <Calendar size={14} className="text-gray-400" />
                        {new Intl.DateTimeFormat('es-MX', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(new Date(p.created_at))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleView(p)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Ver Receta"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleDownload(p)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Descargar PDF"
                        >
                          <Download size={18} />
                        </button>
                        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-all">
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Vista Previa */}
      {isPreviewOpen && selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-white/20">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">Vista Previa: {selectedPrescription.folio}</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Registro Inmutable (Snapshot)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDownload(selectedPrescription)}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  DESCARGAR PDF
                </button>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-gray-100/50 p-8 custom-scrollbar">
              <PreviewTemplateContext.Provider value={selectedPrescription.template_snapshot}>
                <PreviewDataContext.Provider value={selectedPrescription.content_snapshot}>
                  <DocumentPreview zoom={0.7} showRules={false} />
                </PreviewDataContext.Provider>
              </PreviewTemplateContext.Provider>
              
              {/* Canvas oculto para generación de PDF */}
              <div className="hidden">
                <div id="prescription-archive-canvas">
                  <PreviewTemplateContext.Provider value={selectedPrescription.template_snapshot}>
                    <PreviewDataContext.Provider value={selectedPrescription.content_snapshot}>
                      <DocumentPreview zoom={1} showRules={false} />
                    </PreviewDataContext.Provider>
                  </PreviewTemplateContext.Provider>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center shrink-0">
              <p className="text-[10px] text-gray-400 italic">
                Este documento es una copia fiel del original generado el {new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(new Date(selectedPrescription.created_at))}. 
                Cualquier modificación posterior a la plantilla no afecta este registro.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

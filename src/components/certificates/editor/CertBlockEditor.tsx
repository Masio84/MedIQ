'use client';

import { useCertificateStore } from '../store/certificate-template.store';
import { TemplateBlock } from '../types/certificate-template.types';
import { Layout, Check, Users, Stethoscope, ClipboardList, Hash, BadgeCheck, FileText } from 'lucide-react';

const BLOCK_ICONS: Record<string, any> = {
  header: Layout,
  doctor: Stethoscope,
  patient: Users,
  body: FileText,
  signature: Hash,
  footer: BadgeCheck,
};

export default function CertBlockEditor({ block }: { block: TemplateBlock }) {
  const { updateBlockConfig, toggleBlock } = useCertificateStore();
  const Icon = BLOCK_ICONS[block.type] || Layout;

  const handleConfigChange = (key: string, value: any) => {
    updateBlockConfig(block.id, { [key]: value });
  };

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="p-3 bg-white border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Icon size={14} className="text-blue-500" />
           <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">{block.type}</span>
        </div>
        <button 
          onClick={() => toggleBlock(block.id)}
          className={`px-2 py-0.5 rounded text-[9px] font-bold ${block.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}
        >
          {block.enabled ? 'ACTIVO' : 'INACTIVO'}
        </button>
      </div>

      <div className="p-3 space-y-3">
        {block.type === 'header' && (
          <>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-bold ml-1">Título / Nombre</label>
              <input 
                type="text" 
                value={block.contentConfig.title || ''}
                onChange={(e) => handleConfigChange('title', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-100 rounded focus:bg-white bg-gray-100/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-bold ml-1">Subtítulo</label>
              <input 
                type="text" 
                value={block.contentConfig.subtitle || ''}
                onChange={(e) => handleConfigChange('subtitle', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-100 rounded focus:bg-white bg-gray-100/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-bold ml-1">Contacto / Membrete</label>
              <textarea 
                value={block.contentConfig.contactInfo || ''}
                onChange={(e) => handleConfigChange('contactInfo', e.target.value)}
                rows={2}
                className="w-full px-2 py-1.5 text-xs border border-gray-100 rounded focus:bg-white bg-gray-100/50"
              />
            </div>
          </>
        )}

        {block.type === 'doctor' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 uppercase font-bold ml-1">Alineación</label>
              <div className="flex gap-1 p-1 bg-gray-100/50 rounded-lg">
                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    onClick={() => handleConfigChange('alignment', align)}
                    className={`flex-1 py-1 text-[9px] font-bold uppercase rounded transition-all ${
                      (block.contentConfig.alignment || 'right') === align 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
               <span className="text-[10px] text-gray-400 uppercase font-bold">Mostrar Especialidad</span>
               <button 
                onClick={() => handleConfigChange('showSpecialty', !block.contentConfig.showSpecialty)}
                className={`w-8 h-4 rounded-full relative transition-colors ${block.contentConfig.showSpecialty !== false ? 'bg-blue-500' : 'bg-gray-300'}`}
               >
                 <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${block.contentConfig.showSpecialty !== false ? 'translate-x-4' : 'translate-x-0.5'}`} />
               </button>
            </div>
          </div>
        )}

        {block.type === 'patient' && (
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase font-bold ml-1">Campos Visibles</label>
            <div className="grid grid-cols-2 gap-1.5">
              {['name', 'age', 'gender', 'date', 'folio'].map((field) => (
                <button
                  key={field}
                  onClick={() => {
                    const current = block.contentConfig.fields || [];
                    const next = current.includes(field) 
                      ? current.filter((f: string) => f !== field)
                      : [...current, field];
                    handleConfigChange('fields', next);
                  }}
                  className={`px-2 py-1 text-[10px] font-medium border rounded flex items-center justify-between ${
                    block.contentConfig.fields?.includes(field) ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-white border-gray-100 text-gray-400'
                  }`}
                >
                  {field.toUpperCase()}
                  {block.contentConfig.fields?.includes(field) && <Check size={10} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {block.type === 'body' && (
          <>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-bold ml-1">Prefijo de introducción</label>
              <textarea 
                value={block.contentConfig.prefix || ''}
                onChange={(e) => handleConfigChange('prefix', e.target.value)}
                rows={2}
                className="w-full px-2 py-1.5 text-[10px] border border-gray-100 rounded focus:bg-white bg-gray-100/50"
              />
            </div>
            <div className="flex items-center justify-between px-1 mt-3">
               <span className="text-[10px] text-gray-400 uppercase font-bold">Mostrar Motivo / Destino</span>
               <button 
                onClick={() => handleConfigChange('showPurpose', !block.contentConfig.showPurpose)}
                className={`w-8 h-4 rounded-full relative transition-colors ${block.contentConfig.showPurpose !== false ? 'bg-blue-500' : 'bg-gray-300'}`}
               >
                 <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${block.contentConfig.showPurpose !== false ? 'translate-x-4' : 'translate-x-0.5'}`} />
               </button>
            </div>
          </>
        )}

        {block.type === 'signature' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 uppercase font-bold ml-1">Alineación</label>
              <div className="flex gap-1 p-1 bg-gray-100/50 rounded-lg">
                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    onClick={() => handleConfigChange('position', align)}
                    className={`flex-1 py-1 text-[9px] font-bold uppercase rounded transition-all ${
                      (block.contentConfig.position || 'center') === align 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
               <span className="text-[10px] text-gray-400 uppercase font-bold">Mostrar Sello Profesional</span>
               <button 
                onClick={() => handleConfigChange('showSeal', !block.contentConfig.showSeal)}
                className={`w-8 h-4 rounded-full relative transition-colors ${block.contentConfig.showSeal !== false ? 'bg-blue-500' : 'bg-gray-300'}`}
               >
                 <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${block.contentConfig.showSeal !== false ? 'translate-x-4' : 'translate-x-0.5'}`} />
               </button>
            </div>
          </div>
        )}

        {block.type === 'footer' && (
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase font-bold ml-1">Texto Legal / Pie de página</label>
            <textarea 
              value={block.contentConfig.text || ''}
              onChange={(e) => handleConfigChange('text', e.target.value)}
              rows={3}
              className="w-full px-2 py-1.5 text-[10px] border border-gray-100 rounded focus:bg-white bg-gray-100/50"
            />
          </div>
        )}
      </div>
    </div>
  );
}

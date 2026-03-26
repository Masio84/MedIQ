'use client';

import { useState } from 'react';
import { usePrescriptionStore } from '../store/prescription-template.store';
import { 
  Layout, 
  Type, 
  Image as ImageIcon, 
  Palette, 
  ImagePlus, 
  Link2,
  ZoomIn,
  ZoomOut,
  Settings
} from 'lucide-react';
import { PrescriptionPageConfig } from '../types/prescription-template.types';

const FONTS = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'];

export default function ConfigPanel() {
  const [activeTab, setActiveTab] = useState<'general' | 'typo' | 'brand' | 'colors'>('general');
  const { template, updatePage, updateStyles, updateBranding } = usePrescriptionStore();

  const handlePageUpdate = (field: keyof PrescriptionPageConfig, value: any) => {
    updatePage({ ...template.page, [field]: value });
  };

  const handleLogoUpdate = (field: string, value: any) => {
    updateBranding({
      logo: {
        ...(template.branding.logo || { position: 'left', width: 40, height: 40, url: '' }),
        [field]: value
      }
    });
  };

  const handleSignatureUpdate = (field: string, value: any) => {
    updateBranding({
      signature: {
        ...(template.branding.signature || { width: 120, height: 60, url: '' }),
        [field]: value
      }
    });
  };

  const handleSealUpdate = (field: string, value: any) => {
    updateBranding({
      seal: {
        ...(template.branding.seal || { width: 60, height: 60, url: '' }),
        [field]: value
      }
    });
  };

  const handleStyleUpdate = (key: string, value: any) => {
    updateStyles({ [key]: value });
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Tabs Header */}
      <div className="flex border-b border-gray-100 bg-gray-100">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 py-3 px-2 flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'general' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Layout size={18} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Documento</span>
        </button>
        <button
          onClick={() => setActiveTab('typo')}
          className={`flex-1 py-3 px-2 flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'typo' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Type size={18} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Fuentes</span>
        </button>
        <button
          onClick={() => setActiveTab('brand')}
          className={`flex-1 py-3 px-2 flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'brand' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <ImageIcon size={18} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Branding</span>
        </button>
        <button
          onClick={() => setActiveTab('colors')}
          className={`flex-1 py-3 px-2 flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'colors' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Palette size={18} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Colores</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
        {activeTab === 'general' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full" /> Orientación
              </div>
              <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
                 <button
                  onClick={() => handlePageUpdate('orientation', 'PORTRAIT')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                    template.page.orientation === 'PORTRAIT' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}
                 >
                   Vertical
                 </button>
                 <button
                  onClick={() => handlePageUpdate('orientation', 'LANDSCAPE')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                    template.page.orientation === 'LANDSCAPE' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}
                 >
                   Horizontal
                 </button>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full" /> Tamaño de Hoja
              </div>
              <div className="grid grid-cols-1 gap-2">
                 {['LETTER', 'HALF', 'QUARTER'].map((size) => (
                    <button
                      key={size}
                      onClick={() => handlePageUpdate('size', size)}
                      className={`p-3 text-xs font-bold rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        template.page.size === size 
                        ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm' 
                        : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-xs uppercase">{size === 'LETTER' ? 'Carta' : size === 'HALF' ? '1/2 Carta' : '1/4 Carta'}</span>
                      <span className="text-[9px] opacity-60 font-medium">
                        {size === 'LETTER' ? '215.9 x 279.4 mm' : size === 'HALF' ? '139.7 x 215.9 mm' : '107.9 x 139.7 mm'}
                      </span>
                    </button>
                 ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full" /> Márgenes (mm)
              </div>
              <div className="grid grid-cols-2 gap-3">
                 {Object.keys(template.page.margins).map((m) => (
                    <div key={m} className="space-y-1">
                      <label className="text-[9px] text-gray-500 font-bold uppercase ml-1">{m === 'top' ? 'Superior' : m === 'bottom' ? 'Inferior' : m === 'left' ? 'Izquierdo' : 'Derecho'}</label>
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-2 focus-within:bg-white focus-within:border-blue-400 transition-all">
                        <input 
                          type="number" 
                          min={0}
                          max={50}
                          value={template.page.margins[m as keyof typeof template.page.margins]}
                          onChange={(e) => updatePage({ ...template.page, margins: { ...template.page.margins, [m]: Number(e.target.value) } })}
                          className="w-full bg-transparent text-xs font-bold outline-none"
                        />
                        <span className="text-[9px] text-gray-300 font-bold">MM</span>
                      </div>
                    </div>
                 ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'typo' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
             <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Familia Tipográfica</label>
                <select
                  value={template.styles.fontFamily}
                  onChange={(e) => handleStyleUpdate('fontFamily', e.target.value)}
                  className="w-full p-2.5 text-xs font-bold border border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-400 outline-none"
                >
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Tamaño Base</label>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-2">
                    <input 
                      type="number" 
                      min={8}
                      max={24}
                      value={template.styles.fontSize}
                      onChange={(e) => handleStyleUpdate('fontSize', Number(e.target.value))}
                      className="w-full bg-transparent text-xs font-bold outline-none"
                    />
                    <span className="text-[9px] text-gray-300 font-bold">PX</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Interlineado</label>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-2">
                    <input 
                      type="number" 
                      step={0.1}
                      min={1}
                      max={3}
                      value={template.styles.lineHeight}
                      onChange={(e) => handleStyleUpdate('lineHeight', Number(e.target.value))}
                      className="w-full bg-transparent text-xs font-bold outline-none"
                    />
                    <span className="text-[9px] text-gray-300 font-bold">RATIO</span>
                  </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'brand' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300 pb-8">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-4">
               <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <ImagePlus size={20} />
               </div>
               <div>
                  <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest leading-none mb-1">Cisterna de Branding</h4>
                  <p className="text-[10px] text-blue-600 font-medium">Vincula tus activos de marca para la receta.</p>
               </div>
            </div>

            {/* LOGO SECTION */}
            <div className="space-y-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                 LOGO DE LA CLÍNICA
              </div>
              <div className="flex gap-2">
                 <input 
                  type="text" 
                  value={template.branding.logo?.url || ''}
                  onChange={(e) => handleLogoUpdate('url', e.target.value)}
                  placeholder="URL del Logo o Base64"
                  className="flex-1 px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                 />
                 <button 
                  onClick={() => handleLogoUpdate('url', 'https://placehold.co/400x400?text=CLINICA')}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
                  title="Usar Logo de Prueba"
                 >
                   <Link2 size={16} />
                 </button>
              </div>
            </div>

            {/* FIRMA SECTION */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                 FIRMA DEL MÉDICO (DIGITAL)
              </div>
              <div className="flex gap-2">
                 <input 
                  type="text" 
                  value={template.branding.signature?.url || ''}
                  onChange={(e) => handleSignatureUpdate('url', e.target.value)}
                  placeholder="URL de Firma o Base64"
                  className="flex-1 px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                 />
                 <button 
                  onClick={() => handleSignatureUpdate('url', 'https://img.freepik.com/iconos-gratis/firma_318-709796.jpg')}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
                  title="Usar Firma de Prueba"
                 >
                   <Link2 size={16} />
                 </button>
              </div>
              
              <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg">
                <span className="text-[9px] font-bold text-gray-400 uppercase ml-2">Ancho</span>
                <input 
                  type="range" 
                  min="50" max="250" 
                  className="flex-1 accent-blue-600 h-1"
                  value={template.branding.signature?.width || 120}
                  onChange={(e) => handleSignatureUpdate('width', parseInt(e.target.value))}
                />
                <span className="text-[10px] font-mono font-bold text-gray-600 w-12 text-center">{template.branding.signature?.width || 120}mm</span>
              </div>
            </div>

            {/* SELLO SECTION */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                 SELLO PROFESIONAL / CLÍNICA
              </div>
              <div className="flex gap-2">
                 <input 
                  type="text" 
                  value={template.branding.seal?.url || ''}
                  onChange={(e) => handleSealUpdate('url', e.target.value)}
                  placeholder="URL de Sello o Base64"
                  className="flex-1 px-3 py-2 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                 />
                 <button 
                  onClick={() => handleSealUpdate('url', 'https://cdn-icons-png.flaticon.com/512/281/281775.png')}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
                  title="Usar Sello de Prueba"
                 >
                   <Link2 size={16} />
                 </button>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg">
                <span className="text-[9px] font-bold text-gray-400 uppercase ml-2">Tamaño</span>
                <input 
                  type="range" 
                  min="30" max="150" 
                  className="flex-1 accent-blue-600 h-1"
                  value={template.branding.seal?.width || 60}
                  onChange={(e) => {
                    handleSealUpdate('width', parseInt(e.target.value));
                    handleSealUpdate('height', parseInt(e.target.value));
                  }}
                />
                <span className="text-[10px] font-mono font-bold text-gray-600 w-12 text-center">{template.branding.seal?.width || 60}mm</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'colors' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
             <div className="space-y-4">
                {[
                  { label: 'Color Primario', key: 'primaryColor', desc: 'Títulos y acentos' },
                  { label: 'Color Secundario', key: 'secondaryColor', desc: 'Subtítulos y etiquetas' },
                  { label: 'Color de Texto', key: 'textColor', desc: 'Contenido principal' }
                ].map((color) => (
                  <div key={color.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-gray-800 uppercase tracking-tight">{color.label}</p>
                      <p className="text-[9px] text-gray-400 font-medium">{color.desc}</p>
                    </div>
                    <div className="relative">
                      <input 
                        type="color" 
                        value={template.styles[color.key as keyof typeof template.styles] as string}
                        onChange={(e) => handleStyleUpdate(color.key, e.target.value)}
                        className="w-10 h-10 rounded-lg border-2 border-white shadow-sm cursor-pointer overflow-hidden p-0"
                      />
                    </div>
                  </div>
                ))}
             </div>
             
             <div className="pt-2">
                <p className="text-[9px] text-gray-400 italic text-center leading-relaxed">
                  Los colores se aplican a los bloques compatibles como encabezados y etiquetas de paciente.
                </p>
             </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-100 flex items-center justify-center">
         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Settings size={10} /> Panel de Control de Estilo
         </span>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Check, X, Upload, FileSignature, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface DigitalSignatureManagerProps {
  signatureUrl: string;
  sealConfig: any;
  onChangeSignature: (url: string) => void;
  onChangeSeal: (config: any) => void;
  doctorId: string;
}

export default function DigitalSignatureManager({
  signatureUrl,
  sealConfig,
  onChangeSignature,
  onChangeSeal,
  doctorId
}: DigitalSignatureManagerProps) {
  const [activeTab, setActiveTab] = useState<'signature' | 'seal'>('signature');
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'upload'>('draw');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Seal local state
  const [sealTextLocal, setSealTextLocal] = useState({
    line1: sealConfig?.line1 || 'Dr. Médico',
    line2: sealConfig?.line2 || 'Cédula: 123456',
    line3: sealConfig?.line3 || 'Especialidad',
    color: sealConfig?.color || '#1e3a8a'
  });

  const supabase = createClient();

  // Handle Signature Canvas drawing
  useEffect(() => {
    if (signatureMethod === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [signatureMethod, activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.beginPath();
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const uploadSignatureToStorage = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const fileName = `signature_${doctorId}_${Date.now()}.png`;
      const { data, error } = await supabase.storage
        .from('avatars') // Using avatars bucket as we already have it configured for public access in Settings
        .upload(`signatures/${fileName}`, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(`signatures/${fileName}`);

      onChangeSignature(publicData.publicUrl);
    } catch (err) {
      console.error('Error uploading signature:', err);
      alert('Error al subir la firma');
    } finally {
      setIsUploading(false);
    }
  };

  const saveSignatureFromCanvas = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (blob) uploadSignatureToStorage(blob);
    }, 'image/png');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadSignatureToStorage(file);
    }
  };

  const handleClearSignature = () => {
    onChangeSignature('');
  };

  const updateSealConfig = () => {
    onChangeSeal(sealTextLocal);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-50 pb-2">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FileSignature size={20} className="text-blue-600" />
          Firma y Sello Digital
        </h2>
      </div>

      <div className="flex p-1 bg-gray-100 rounded-lg w-full max-w-sm mb-4">
         <button 
           type="button"
           onClick={() => setActiveTab('signature')}
           className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
             activeTab === 'signature' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
           }`}
         >
           Firma Digital
         </button>
         <button 
           type="button"
           onClick={() => setActiveTab('seal')}
           className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
             activeTab === 'seal' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
           }`}
         >
           Sello Virtual
         </button>
      </div>

      {activeTab === 'signature' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {signatureUrl ? (
            <div className="flex flex-col items-center p-4 border rounded-xl bg-gray-50 border-gray-200">
               <img src={signatureUrl} alt="Firma registrada" className="h-32 object-contain bg-white rounded-lg p-2 border shadow-inner mb-4" />
               <button 
                 type="button"
                 onClick={handleClearSignature} 
                 className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
               >
                 <Trash2 size={14} /> Eliminar Firma Actual
               </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button 
                  type="button"
                  onClick={() => setSignatureMethod('draw')} 
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium border ${signatureMethod === 'draw' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-600'}`}
                >
                  Dibujar en pantalla
                </button>
                <button 
                  type="button"
                  onClick={() => setSignatureMethod('upload')} 
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium border ${signatureMethod === 'upload' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-600'}`}
                >
                  Subir Imagen
                </button>
              </div>

              {signatureMethod === 'draw' ? (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white shadow-inner relative">
                    <canvas 
                      ref={canvasRef}
                      width={400}
                      height={200}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseOut={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="cursor-crosshair w-full max-w-[400px] touch-none"
                    />
                    <div className="absolute top-2 left-2 text-[10px] text-gray-400 font-mono tracking-widest uppercase">
                      Pad de firma
                    </div>
                  </div>
                  <div className="flex gap-2 w-full max-w-[400px]">
                    <button 
                      type="button"
                      onClick={clearCanvas}
                      className="flex-1 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
                    >
                      <X size={14} /> Limpiar
                    </button>
                    <button 
                      type="button"
                      onClick={saveSignatureFromCanvas}
                      disabled={isUploading}
                      className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Check size={14} /> {isUploading ? 'Guardando...' : 'Aplicar Firma'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50 flex flex-col items-center justify-center text-center">
                   <Upload size={32} className="text-gray-400 mb-3" />
                   <p className="text-sm font-medium text-gray-700">Sube una foto de tu firma</p>
                   <p className="text-xs text-gray-400 mt-1 mb-4">Recomendado: Fondo transparente, PNG</p>
                   <label className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors shadow-sm">
                     Seleccionar Archivo
                     <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                   </label>
                   {isUploading && <p className="text-xs text-blue-600 mt-3 animate-pulse">Subiendo...</p>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'seal' && (
        <div className="space-y-4 animate-in fade-in duration-300">
           <div className="flex flex-col md:flex-row gap-6">
             <div className="flex-1 space-y-3">
               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Color del sello</label>
                  <div className="flex gap-2">
                    {['#1e3a8a', '#0f172a', '#047857', '#b91c1c'].map(color => (
                      <button 
                        key={color}
                        type="button"
                        onClick={() => {
                          setSealTextLocal(prev => ({ ...prev, color }));
                          onChangeSeal({ ...sealTextLocal, color });
                        }}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${sealTextLocal.color === color ? 'scale-110 border-gray-900 shadow-md ring-2 ring-white' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Línea 1 (Nombre Principal)</label>
                  <input type="text" value={sealTextLocal.line1} onChange={e => { setSealTextLocal(p => ({ ...p, line1: e.target.value })); }} onBlur={updateSealConfig} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none" />
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Línea 2 (Cédula/Colegio)</label>
                  <input type="text" value={sealTextLocal.line2} onChange={e => { setSealTextLocal(p => ({ ...p, line2: e.target.value })); }} onBlur={updateSealConfig} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none" />
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Línea 3 (Especialidad)</label>
                  <input type="text" value={sealTextLocal.line3} onChange={e => { setSealTextLocal(p => ({ ...p, line3: e.target.value })); }} onBlur={updateSealConfig} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none" />
               </div>
             </div>
             
             <div className="flex-1 flex items-center justify-center p-6 border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl relative">
                <div className="absolute top-2 left-2 text-[10px] text-gray-400 font-mono tracking-widest uppercase">
                  Vista Previa del Sello
                </div>
                
                {/* SVG representation of the seal */}
                <div 
                   className="w-48 h-48 rounded-full flex flex-col items-center justify-center p-4 text-center border-4"
                   style={{ 
                     borderColor: sealTextLocal.color,
                     color: sealTextLocal.color,
                     opacity: 0.8
                   }}
                >
                   <div className="w-full h-full rounded-full border border-dashed flex flex-col items-center justify-center p-2" style={{ borderColor: sealTextLocal.color }}>
                      <span className="font-bold text-sm leading-tight mb-1">{sealTextLocal.line1}</span>
                      <span className="text-[10px] border-b border-t py-1 my-1 w-full" style={{ borderColor: sealTextLocal.color }}>{sealTextLocal.line2}</span>
                      <span className="font-medium text-xs leading-tight mt-1">{sealTextLocal.line3}</span>
                   </div>
                </div>
             </div>
           </div>
           <p className="text-xs text-gray-400 italic">El sello se renderizará como gráfico vectorial (SVG) en todos tus documentos exportados.</p>
        </div>
      )}
    </div>
  );
}

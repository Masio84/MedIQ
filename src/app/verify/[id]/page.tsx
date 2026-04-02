import { createClient } from '@supabase/supabase-js';
import { FileText, CheckCircle, AlertTriangle, Calendar, User, Key, Database, Globe } from 'lucide-react';
import Link from 'next/link';

export default async function DocumentVerificationPage({ params }: { params: { id: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: verificationDoc, error } = await supabase
    .from('document_verification')
    .select(`
      *,
      profiles:doctor_id (name, specialty, medical_license, specialty_license, clinic_name, clinic_address, clinic_phone),
      patients:patient_id (name, curp)
    `)
    .eq('id', params.id)
    .single();

  if (error || !verificationDoc) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-100 shadow-xl shadow-red-500/5 text-center">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-red-50">
            <AlertTriangle size={32} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Documento No Encontrado</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            El código de verificación escaneado no existe o el documento ha sido invalidado en nuestro sistema.
          </p>
          <Link href="/" className="inline-block px-6 py-3 bg-gray-900 text-white font-bold rounded-xl text-sm transition-transform hover:scale-105">
            Ir a Inicio
          </Link>
        </div>
      </div>
    );
  }

  const isCertificate = verificationDoc.document_type === 'certificate';
  const dataPayload = verificationDoc.content_snapshot;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-2xl shadow-emerald-500/5">
        
        {/* Etiqueta de Autenticidad */}
        <div className="bg-emerald-600 px-8 py-6 text-white relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
              <CheckCircle size={28} className="text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">Documento Válido</h1>
              <p className="text-emerald-100 text-xs font-medium uppercase tracking-widest mt-0.5">
                Verificación Criptográfica Exitosa
              </p>
            </div>
          </div>
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* Resumen de Verificación */}
        <div className="p-8 space-y-8">
          
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-0.5">Tipo de Documento</p>
              <p className="text-sm font-black text-gray-900">
                {isCertificate 
                  ? 'Certificado Médico - ' + (dataPayload?.certificate_type === 'incapacidad' ? 'Incapacidad' : 'Salud General')
                  : 'Receta Médica'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1"><User size={12} /> Paciente</p>
              <p className="text-sm font-bold text-gray-900">{verificationDoc.patients?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1"><User size={12} /> Médico</p>
              <p className="text-sm font-bold text-gray-900">{verificationDoc.profiles?.name}</p>
              <p className="text-xs text-gray-500">{verificationDoc.profiles?.specialty}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Database size={14} className="text-gray-400" /> Registro Inmutable
            </h3>
            
            <ul className="space-y-3 font-mono text-[10px]">
              <li className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-gray-400 uppercase font-sans font-bold flex items-center gap-1">
                  <Key size={10} /> Hash SHA-256
                </span>
                <span className="text-gray-900 font-bold truncate max-w-[150px]" title={verificationDoc.hash_sha256}>
                  {verificationDoc.hash_sha256.substring(0, 12)}...{verificationDoc.hash_sha256.substring(verificationDoc.hash_sha256.length - 8)}
                </span>
              </li>
              <li className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-gray-400 uppercase font-sans font-bold flex items-center gap-1">
                  <Calendar size={10} /> Emisión
                </span>
                <span className="text-gray-900 font-bold">
                  {new Intl.DateTimeFormat('es-MX', { 
                    dateStyle: 'short', timeStyle: 'short'
                  }).format(new Date(verificationDoc.created_at))}
                </span>
              </li>
              <li className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-gray-400 uppercase font-sans font-bold flex items-center gap-1">
                  <Globe size={10} /> Red / Origen
                </span>
                <span className="text-gray-900 font-bold text-[9px] text-right">
                  MedIQ Node<br/><span className="text-gray-400 font-normal">{verificationDoc.ip_address}</span>
                </span>
              </li>
            </ul>
          </div>

        </div>

        <div className="bg-slate-50 p-6 text-center border-t border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black flex items-center justify-center gap-1">
            Plataforma Validada por <span className="text-blue-500">MedIQ</span>
          </p>
        </div>

      </div>
    </div>
  );
}

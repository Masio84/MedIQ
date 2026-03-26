'use client';

import { Patient } from '../PatientList';
import { Pill, Calendar, Clock, User, Activity, FileText } from 'lucide-react';

interface FullRecordReportProps {
  patient: Patient;
  consultations: any[];
  prescriptions: any[];
  certificates: any[];
  doctorName?: string;
  clinicName?: string;
}

export default function FullRecordReport({ 
  patient, 
  consultations, 
  prescriptions, 
  certificates,
  doctorName = "Dr. MedIQ",
  clinicName = "MedIQ Clinic"
}: FullRecordReportProps) {
  return (
    <div id="full-record-report-content" className="p-12 bg-white text-gray-900 font-sans max-w-[800px] mx-auto border border-gray-100">
      {/* HEADER */}
      <div className="flex justify-between items-start border-b-4 border-black pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Expediente Clínico Digital</h1>
          <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">{clinicName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-black text-gray-900">Fecha de Emisión</p>
          <p className="text-sm font-medium">{new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* PATIENT INFO */}
      <div className="grid grid-cols-2 gap-8 mb-10 bg-gray-50 p-6 rounded-2xl border border-gray-100">
        <div>
          <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <User size={12} /> Datos del Paciente
          </h2>
          <p className="text-xl font-black text-gray-900">{patient.name} {patient.last_name}</p>
          <div className="mt-3 space-y-1">
             <p className="text-xs text-gray-500 font-medium">CURP: <span className="text-gray-900 font-bold">{patient.curp || 'N/A'}</span></p>
             <p className="text-xs text-gray-500 font-medium">Género: <span className="text-gray-900 font-bold">{patient.gender || 'N/A'}</span></p>
             <p className="text-xs text-gray-500 font-medium">Nacimiento: <span className="text-gray-900 font-bold">{patient.birthdate ? new Date(patient.birthdate).toLocaleDateString() : 'N/A'}</span></p>
          </div>
        </div>
        <div className="border-l border-gray-200 pl-8">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Resumen de Actividad</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-xl border border-gray-100 text-center">
              <p className="text-xs font-black text-gray-900">{consultations.length}</p>
              <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5">Consultas</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-100 text-center">
              <p className="text-xs font-black text-gray-900">{prescriptions.length}</p>
              <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5">Recetas</p>
            </div>
          </div>
        </div>
      </div>

      {/* CONSULTATIONS SECTION */}
      <div className="mb-10">
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tighter mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
          <Activity size={16} className="text-blue-600" /> Historial de Consultas Médicas
        </h2>
        
        <div className="space-y-8">
          {consultations.map((cons, idx) => (
            <div key={cons.id} className="relative pl-6 border-l-2 border-gray-100 pb-2">
              <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-blue-600 rounded-full" />
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-black text-gray-900 uppercase">{new Date(cons.created_at).toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">V.{idx + 1}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                <div>
                   <p className="text-[8px] font-bold text-gray-400 uppercase">Peso</p>
                   <p className="text-[10px] font-black">{cons.weight || '--'} kg</p>
                </div>
                <div>
                   <p className="text-[8px] font-bold text-gray-400 uppercase">Temperatura</p>
                   <p className="text-[10px] font-black">{cons.temperature || '--'} °C</p>
                </div>
                <div>
                   <p className="text-[8px] font-bold text-gray-400 uppercase">Presión</p>
                   <p className="text-[10px] font-black">{cons.blood_pressure || '--'}</p>
                </div>
              </div>

              <div className="space-y-3">
                {cons.diagnosis && (
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Diagnóstico (CIE-10)</p>
                    <p className="text-xs font-bold text-gray-900">{cons.diagnosis}</p>
                    {cons.cie10_code && <p className="text-[9px] text-blue-600 font-bold mt-0.5">Cód: {cons.cie10_code}</p>}
                  </div>
                )}
                {cons.treatment && (
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Tratamiento y Manejo</p>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium bg-white p-3 rounded-lg border border-gray-100">{cons.treatment}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PRESCRIPTIONS SUMMARY */}
      <div className="mb-10">
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tighter mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
          <Pill size={16} className="text-green-600" /> Índice de Recetas Emitidas
        </h2>
        <table className="w-full text-left text-[10px]">
          <thead>
            <tr className="bg-gray-50 text-gray-400 font-bold uppercase border-b border-gray-100">
              <th className="py-2 px-4">Fecha</th>
              <th className="py-2 px-4">Folio</th>
              <th className="py-2 px-4">Diagnóstico Asociado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {prescriptions.map(pres => (
              <tr key={pres.id}>
                <td className="py-3 px-4 font-bold">{new Date(pres.created_at).toLocaleDateString()}</td>
                <td className="py-3 px-4 font-black text-blue-600">{pres.folio}</td>
                <td className="py-3 px-4 italic text-gray-500">{pres.diagnosis_snapshot || 'General'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER / LEGAL DISCLAMIER */}
      <div className="mt-20 pt-8 border-t border-gray-100 text-center">
        <div className="flex justify-center mb-6">
           <div className="w-32 h-1 bg-black rounded-full" />
        </div>
        <p className="text-xs font-black text-gray-900 uppercase tracking-widest">{doctorName}</p>
        <p className="text-[8px] text-gray-400 font-bold mt-2 uppercase tracking-[0.2em] max-w-[400px] mx-auto leading-relaxed">
          Este documento es una copia fiel del expediente clínico digital generado por la plataforma MedIQ. 
          Válido para fines informativos y legales bajo la NOM-004-SSA3-2012.
        </p>
      </div>
    </div>
  );
}

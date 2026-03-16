'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Phone, Mail, FolderOpen } from 'lucide-react';

type Patient = {
  id: string;
  name: string;
  birthdate?: string;
  phone?: string;
  email?: string;
  address?: string;
  allergies?: string;
  medical_history?: string;
  created_at: string;
};

export default function PatientList({ role }: { role: 'admin' | 'doctor' | 'assistant' }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const supabase = createClient();

  const fetchPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('name');
    if (!error && data) setPatients(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl border border-gray-100/50 shadow-sm overflow-hidden h-[600px] flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Pacientes Registrados</h3>
        
        {loading && <p className="text-sm text-gray-400">Cargando...</p>}
        {!loading && patients.length === 0 && (
          <p className="text-sm text-gray-400">No hay pacientes registrados.</p>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 mt-2">
          {patients.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPatient(p)}
              className={`w-full text-left p-4 rounded-xl border border-gray-100 transition-colors flex items-center justify-between hover:bg-gray-100/50 ${
                selectedPatient?.id === p.id ? 'bg-gray-100 border-gray-200' : ''
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-400">{p.phone || 'Sin teléfono'}</p>
              </div>
              <FolderOpen size={16} className="text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      <div>
        {selectedPatient ? (
          <div className="bg-white p-6 rounded-xl border border-gray-100/50 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900">{selectedPatient.name}</h3>
              <p className="text-xs text-gray-400 mt-1">ID: {selectedPatient.id}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={16} className="text-gray-400" />
                <span>Fecha de Nac.: {selectedPatient.birthdate || 'No especificado'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={16} className="text-gray-400" />
                <span>Teléfono: {selectedPatient.phone || 'No especificado'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={16} className="text-gray-400" />
                <span>Correo: {selectedPatient.email || 'No especificado'}</span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Dirección</p>
                <p className="text-sm text-gray-900">{selectedPatient.address || 'No especificado'}</p>
              </div>
            </div>

            {(role === 'doctor' || role === 'admin') && (
              <>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium text-gray-500">Alergias</p>
                  <p className="text-sm text-red-600 mt-1 font-medium">{selectedPatient.allergies || 'Ninguna alergia reportada'}</p>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium text-gray-500">Historial Médico</p>
                  <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                    {selectedPatient.medical_history || 'Sin registros previos.'}
                  </div>
                </div>
              </>
            )}

            {role === 'assistant' && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 italic">Datos clínicos y médicos están ocultos para Asistentes.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center border border-dashed border-gray-200 rounded-xl p-8 text-gray-400 text-sm">
            Selecciona un paciente para ver detalles.
          </div>
        )}
      </div>
    </div>
  );
}

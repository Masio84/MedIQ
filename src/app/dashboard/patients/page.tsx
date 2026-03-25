'use client';

import { useState } from 'react';
import { useRole } from '@/context/RoleContext';
import PatientForm from '@/components/PatientForm';
import PatientList from '@/components/PatientList';
import { ChevronDown } from 'lucide-react';

export default function PatientsPage() {
  const { role, isLoading } = useRole();
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (isLoading) return null;

  if (role !== 'doctor' && role !== 'admin') {
    return (
      <div className="p-8 text-center bg-white rounded-xl">
        <p className="text-gray-500">Acceso restringido. Solo Médicos y Administradores tienen acceso a este módulo.</p>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Expediente Digital</h1>
          <p className="text-sm text-gray-500">Registrar y visualizar expedientes médicos de los pacientes</p>
        </div>

        {role === 'doctor' && (
          <div className="bg-white rounded-xl border border-gray-100/50 shadow-sm overflow-hidden">
            <button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="w-full p-6 flex justify-between items-center hover:bg-gray-50/50 transition-colors"
            >
              <h2 className="text-lg font-bold text-gray-900">Registrar Nuevo Paciente</h2>
              <ChevronDown className={`transform transition-transform ${isFormOpen ? 'rotate-180' : ''} text-gray-400`} size={20} />
            </button>
            {isFormOpen && (
              <div className="p-6 border-t border-gray-100 bg-gray-50/20">
                <PatientForm onSuccess={() => setIsFormOpen(false)} />
              </div>
            )}
          </div>
        )}

        <div className="mt-6 border-t border-gray-100 pt-6">
          <PatientList role={role} />
        </div>
      </div>
  );
}

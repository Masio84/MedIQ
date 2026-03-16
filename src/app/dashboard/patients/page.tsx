'use client';

import { useRole } from '@/context/RoleContext';
import PatientForm from '@/components/PatientForm';
import PatientList from '@/components/PatientList';

export default function PatientsPage() {
  const { role, isLoading } = useRole();

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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Módulo de Pacientes</h1>
          <p className="text-sm text-gray-500">Registrar y visualizar expedientes médicos</p>
        </div>

        {role === 'doctor' && (
          <div className="bg-white p-6 rounded-xl border border-gray-100/50 shadow-sm">
            <PatientForm onSuccess={() => {}} />
          </div>
        )}

        <div className="mt-6 border-t border-gray-100 pt-6">
          <PatientList role={role} />
        </div>
      </div>
  );
}

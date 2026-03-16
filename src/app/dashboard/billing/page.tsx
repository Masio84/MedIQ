'use client';

import BillingPanel from '@/components/BillingPanel';
import { useRole } from '@/context/RoleContext';

export default function BillingPage() {
  const { role, isLoading } = useRole();

  if (isLoading) return null;

  if (role !== 'assistant' && role !== 'admin') {
    return (
      <div className="p-8 text-center bg-white rounded-xl">
        <p className="text-gray-500">Acceso restringido. Solo Asistentes y Administradores tienen acceso a este módulo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Módulo de Facturación</h1>
        <p className="text-sm text-gray-500">Cobros y finanzas de consultas médicas</p>
      </div>

      <BillingPanel />
    </div>
  );
}

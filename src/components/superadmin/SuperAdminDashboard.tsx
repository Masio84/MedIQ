'use client';

import { useState, useEffect } from 'react';
import GlobalMetrics from './GlobalMetrics';
import ClinicsTable from './ClinicsTable';
import CreateClinicModal from './CreateClinicModal';
import { PlusCircle, Loader2 } from 'lucide-react';

export default function SuperAdminDashboard({ serverMetrics }: { serverMetrics: any }) {
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/clinics-list');
      if (res.ok) {
        const data = await res.json();
        setClinics(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error cargando clínicas para superadmin:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleRefresh = () => {
    fetchClinics();
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Panel de Super Administrador</h1>
          <p className="text-xs text-gray-400 font-medium">Gestión global de SaaS MedIQ - Jorge</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
        >
          <PlusCircle size={16} />
          Crear Clínica
        </button>
      </div>

      {/* Sección 1: Métricas Globales */}
      <h3 className="text-xxs font-black text-gray-400 uppercase tracking-wider">Metricas del Sistema</h3>
      <GlobalMetrics metrics={serverMetrics} />

      {/* Sección 2: Tabla de Clínicas */}
      <h3 className="text-xxs font-black text-gray-400 uppercase tracking-wider pt-4">Directorio de Clínicas</h3>
      <ClinicsTable clinics={clinics} isLoading={loading} onRefresh={handleRefresh} />

      {/* Sección 3: Modal Creación de Clínica */}
      <CreateClinicModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleRefresh} 
      />
    </div>
  );
}

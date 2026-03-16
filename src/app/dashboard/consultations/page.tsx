'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRole } from '@/context/RoleContext';
import ConsultationForm from '@/components/ConsultationForm';

export default function ConsultationsPage() {
  const { role, isLoading } = useRole();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDoctorId(user.id);
      }
    };

    const fetchHistory = async () => {
      const { data } = await supabase
        .from('consultations')
        .select(`
          id,
          symptoms,
          diagnosis,
          created_at,
          patients ( name )
        `)
        .order('created_at', { ascending: false });
      if (data) setHistory(data);
    };

    fetchUser();
    fetchHistory();
  }, [supabase]);

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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Módulo de Consultas</h1>
          <p className="text-sm text-gray-500">Registrar diagnósticos y tratamientos clínicos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div>
            {doctorId && <ConsultationForm doctorId={doctorId} />}
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100/50 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Historial de Consultas Recientes</h3>
            
            {history.length === 0 && <p className="text-sm text-gray-400">No hay consultas registradas aún.</p>}
            
            <div className="space-y-2 overflow-y-auto max-h-[600px]">
              {history.map((c) => (
                <div key={c.id} className="p-4 bg-gray-100 rounded-lg border border-gray-100/20 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">{(c.patients as any).name}</span>
                    <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1"><b className="text-gray-900">Síntoma:</b> {c.symptoms || '-'}</p>
                  <p className="text-xs text-gray-600"><b className="text-gray-900">Diag:</b> {c.diagnosis || '-'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
}

"use client";

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RefreshCcw, Filter, Loader2, FileText, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterTable, setFilterTable] = useState<string>('all');
  const logEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchLogs = async () => {
    setRefreshing(true);
    try {
      let query = supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filterAction !== 'all') {
        query = query.eq('action_type', filterAction);
      }
      if (filterTable !== 'all') {
        query = query.eq('table_name', filterTable);
      }

      const { data, error } = await query;

      if (!error && data) {
        setLogs(data); // Dejar orden descendente (el más reciente arriba) para diseño de tarjetas
      }
    } catch (error) {
      console.error('Error cargando logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); 
    return () => clearInterval(interval);
  }, [filterAction, filterTable]);

  const formatLogEntry = (log: any) => {
    const timestamp = new Date(log.created_at).toLocaleString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    let changes: string[] = [];

    const isInsert = log.action_type === 'INSERT';
    const isUpdate = log.action_type === 'UPDATE';
    const isDelete = log.action_type === 'DELETE' || log.action_type === 'SOFT_DELETE';

    const Icon = isInsert ? CheckCircle : isUpdate ? FileText : Trash2;
    const badgeColor = isInsert ? 'bg-green-50 text-green-700 border-green-100' : isUpdate ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-700 border-red-100';

    if (log.action_type === 'INSERT' && (log.table_name === 'profiles' || log.table_name === 'clinics' || log.table_name === 'patients')) {
        const name = log.new_data?.name || log.new_data?.email || 'N/A';
        changes.push(`+ ${log.table_name === 'profiles' ? 'Usuario' : log.table_name === 'clinics' ? 'Clínica' : 'Paciente'} dado de alta: "${name}"`);
    }

    if (log.table_name === 'consultations' && log.new_data?.treatment) {
        changes.push(`💊 Tratamiento/Receta: ${log.new_data.treatment.substring(0, 100)}${log.new_data.treatment.length > 100 ? '...' : ''}`);
    }

    if (isUpdate && log.action_type !== 'SOFT_DELETE' && log.old_data && log.new_data) {
      for (const key in log.new_data) {
        if (['id', 'created_at', 'clinic_id', 'doctor_id'].includes(key)) continue;

        const oldVal = log.old_data[key];
        const newVal = log.new_data[key];

        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changes.push(`• ${key}: "${oldVal ?? 'vacio'}" ➔ "${newVal}"`);
        }
      }
    } else if (isInsert && log.new_data) {
         const clave = log.new_data.name || log.new_data.symptoms || log.new_data.id;
         changes.push(`+ Registro creado: "${clave}"`);
    } else if (isDelete && log.old_data) {
         changes.push(`- Registro eliminado ${log.action_type === 'SOFT_DELETE' ? '(Desactivado)' : 'permanentemente'}`);
    }

    return (
      <div key={log.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-3">
        {/* Cabecera de la Tarjeta */}
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isInsert ? 'bg-green-50 text-green-600' : isUpdate ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                    <Icon size={18} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-900 capitalize">{log.table_name.replace('_', ' ')}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                            {log.action_type}
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">🕒 {timestamp}</p>
                </div>
            </div>
            
            {log.clinic_id && (
                <div className="bg-gray-50 px-2 py-1 rounded-md border border-gray-100 text-xxs font-bold text-gray-500">
                    Clínica: {log.clinic_id.split('-')[0].toUpperCase()}...
                </div>
            )}
        </div>

        {/* Detalles Técnicos */}
        <div className="text-gray-400 text-[10px] font-mono bg-gray-50/50 p-1.5 rounded-lg border border-gray-100 flex justify-between">
            <span>RECORD: {log.record_id}</span>
            {log.user_id && <span className="hidden md:inline">USER: {log.user_id.split('-')[0]}</span>}
        </div>

        {/* Cambios Visuales Legibles */}
        {changes.length > 0 && (
          <div className="p-3 bg-blue-50/20 rounded-xl border border-blue-100/30 space-y-1">
             <div className="text-xxs font-black text-gray-500 uppercase tracking-wider mb-1">Modificaciones:</div>
             <div className="space-y-1">
                 {changes.map((c, i) => (
                    <div key={i} className="text-xs text-gray-700 font-medium font-sans">
                        {c}
                    </div>
                 ))}
             </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Barra de Filtros y Control */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-2">
           <FileText size={18} className="text-blue-600" />
           <span className="text-xs font-black text-gray-900 uppercase">Filtros de Auditoría</span>
        </div>
        <div className="flex items-center gap-2">
            <select 
              value={filterAction} 
              onChange={(e) => setFilterAction(e.target.value)} 
              className="bg-gray-50 text-gray-700 text-xxs font-bold px-3 py-2 rounded-xl border border-gray-100 focus:outline-none focus:border-blue-500"
            >
                <option value="all">Todas las Acciones</option>
                <option value="INSERT">Insertar</option>
                <option value="UPDATE">Actualizar</option>
                <option value="DELETE">Eliminar</option>
                <option value="SOFT_DELETE">Baja (Soft Delete)</option>
            </select>
            <select 
              value={filterTable} 
              onChange={(e) => setFilterTable(e.target.value)} 
              className="bg-gray-50 text-gray-700 text-xxs font-bold px-3 py-2 rounded-xl border border-gray-100 focus:outline-none focus:border-blue-500"
            >
                <option value="all">Todas las Tablas</option>
                <option value="profiles">Usuarios (Profiles)</option>
                <option value="clinics">Clínicas</option>
                <option value="patients">Pacientes</option>
                <option value="consultations">Consultas y Recetas</option>
                <option value="appointments">Citas (Agenda)</option>
                <option value="billing">Facturación</option>
                <option value="medical_certificates">Certificados</option>
            </select>
            <button 
              onClick={fetchLogs} 
              className={`p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-colors ${refreshing ? 'animate-spin' : ''}`}
            >
                <RefreshCcw size={14} className="text-blue-500" />
            </button>
        </div>
      </div>

      {/* Visor de Logs en Tarjetas */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
         {logs.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center space-y-2 shadow-sm">
                <AlertTriangle className="mx-auto text-gray-400" size={32} />
                <p className="text-xs font-bold text-gray-800">No hay registros de auditoría disponibles aún.</p>
                <p className="text-[11px] text-gray-400 font-medium">Las acciones del sistema aparecerán aquí automáticamente.</p>
            </div>
         ) : (
            logs.map((l) => formatLogEntry(l))
         )}
         <div ref={logEndRef} />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RefreshCcw, Loader2, FileText, AlertTriangle, Trash2, ShieldCheck, History, User, CheckCircle } from 'lucide-react';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterTable, setFilterTable] = useState<string>('all');
  const [userNames, setUserNames] = useState<Record<string, string>>({});
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
        setLogs(data);

        // Fetch user names
        const userIds = Array.from(new Set(data.map((log: any) => log.user_id).filter(Boolean)));
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', userIds);
          
          if (profiles) {
            const names: Record<string, string> = {};
            profiles.forEach((p: any) => {
              names[p.id] = p.name;
            });
            setUserNames(prev => ({ ...prev, ...names }));
          }
        }
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
    const interval = setInterval(fetchLogs, 10000); 
    return () => clearInterval(interval);
  }, [filterAction, filterTable]);

  const formatLogEntry = (log: any) => {
    const timestamp = new Date(log.created_at).toLocaleString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    
    const isInsert = log.action_type === 'INSERT';
    const isUpdate = log.action_type === 'UPDATE';
    const isDelete = log.action_type === 'DELETE' || log.action_type === 'SOFT_DELETE';
    const isSecurity = log.action_type === 'SECURITY_RLS';

    // Mapeo de términos técnicos a español
    const actionMap: Record<string, string> = {
        'INSERT': 'INSERCIÓN',
        'UPDATE': 'ACTUALIZACIÓN',
        'DELETE': 'ELIMINACIÓN',
        'SOFT_DELETE': 'ELIMINACIÓN SUAVE',
        'SECURITY_RLS': 'SEGURIDAD RLS'
    };

    const tableMap: Record<string, string> = {
        'profiles': 'Usuarios',
        'clinics': 'Clínicas',
        'patients': 'Pacientes',
        'consultations': 'Consultas',
        'appointments': 'Agenda',
        'billing': 'Facturación',
        'ai_prompts': 'Prompts IA',
        'logs': 'Bitácora',
        'database': 'Base de Datos'
    };

    const fieldMap: Record<string, string> = {
        'name': 'Nombre',
        'email': 'Email',
        'role': 'Rol',
        'is_active': 'Activo',
        'normal_fee': 'Tarifa Base',
        'discount': 'Descuento',
        'extra_charge': 'Cargo Extra',
        'paid': 'Estado Pago',
        'diagnosis': 'Diagnóstico',
        'treatment': 'Tratamiento',
        'symptoms': 'Síntomas',
        'weight': 'Peso',
        'blood_pressure': 'Presión',
        'temperature': 'Temperatura',
        'doctor_id': 'Médico Asignado',
        'clinic_id': 'Clínica Asignada',
        'rfc_receptor': 'RFC Receptor',
        'cfdi_status': 'Estado CFDI'
    };

    // Premium Color Palette
    const theme = isSecurity 
        ? { icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', badge: 'bg-indigo-100 text-indigo-700' }
        : isInsert 
        ? { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', badge: 'bg-emerald-100 text-emerald-700' }
        : isUpdate 
        ? { icon: FileText, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100', badge: 'bg-sky-100 text-sky-700' }
        : { icon: Trash2, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', badge: 'bg-rose-100 text-rose-700' };

    const Icon = theme.icon;

    let changes: string[] = [];
    if (isSecurity) {
        changes.push(log.new_data?.summary || 'Cambio en políticas de seguridad');
    } else if (isUpdate && log.old_data && log.new_data) {
        for (const key in log.new_data) {
            // Ignorar campos muy técnicos e invariables
            if (['id', 'created_at', 'updated_at'].includes(key)) continue;
            
            const oldVal = log.old_data[key];
            const newVal = log.new_data[key];
            
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                const label = fieldMap[key] || key.replace('_', ' ');
                let displayOld = oldVal ?? 'vacio';
                let displayNew = newVal ?? 'vacio';

                // Formatear booleanos
                if (typeof oldVal === 'boolean') displayOld = oldVal ? 'SÍ' : 'NO';
                if (typeof newVal === 'boolean') displayNew = newVal ? 'SÍ' : 'NO';

                changes.push(`${label}: de "${displayOld}" a "${displayNew}"`);
            }
        }
    } else if (isInsert) {
        const tableNameEs = tableMap[log.table_name] || log.table_name.replace('_', ' ');
        let descriptor = "";
        
        if (log.table_name === 'billing') {
            const amount = log.new_data?.normal_fee || 0;
            const patient = log.new_data?.patientName || "Paciente";
            descriptor = `por $${amount} (${patient})`;
        } else {
            descriptor = log.new_data?.name || log.new_data?.email || log.record_id || '';
        }
        
        changes.push(`Nuevo registro en ${tableNameEs}${descriptor ? `: ${descriptor}` : ''}`);
    } else if (isDelete) {
        const tableNameEs = tableMap[log.table_name] || log.table_name.replace('_', ' ');
        changes.push(`Registro eliminado de ${tableNameEs}`);
    }

    return (
      <div key={log.id} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${theme.bg} ${theme.color} transition-transform group-hover:scale-110 duration-300`}>
                    <Icon size={22} strokeWidth={2.5} />
                </div>
                <div>
                    <h4 className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                        {tableMap[log.table_name] || log.table_name.replace('_', ' ')}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${theme.badge}`}>
                            {actionMap[log.action_type] || log.action_type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">{timestamp}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                    <User size={12} className="text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-600">
                        {userNames[log.user_id] || 'Sistema / Anon'}
                    </span>
                </div>
            </div>
        </div>

        {/* Detalle de Cambios */}
        <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50">
            {changes.length > 0 ? (
                <div className="space-y-2">
                    {changes.map((c, i) => (
                        <div key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
                            <span className={theme.color}>•</span>
                            <span className="font-medium capitalize-first">{c}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-gray-400 italic">Actualización técnica de sistema (campos de auditoría interna).</p>
            )}
        </div>

        {/* Footer Técnico */}
        <div className="mt-4 flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">ID: {log.record_id || 'N/A'}</span>
            <div className="flex gap-2">
                {log.clinic_id && (
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase">Clinic Ref</span>
                )}
            </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-blue-50 border-t-blue-500 animate-spin" />
            <History className="absolute inset-0 m-auto text-blue-500" size={20} />
        </div>
        <p className="text-sm font-bold text-gray-400 animate-pulse">Cargando bitácora de auditoría...</p>
    </div>
  );

  return (
    <div className="space-y-6 flex flex-col h-full bg-gray-50/30 p-2 rounded-3xl">
      {/* Barra de Filtros Premium */}
      <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-white shadow-xl shadow-blue-900/5 flex flex-wrap justify-between items-center gap-6 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <FileText size={20} className="text-white" />
           </div>
           <div>
               <h2 className="text-sm font-black text-gray-900 leading-none">BITÁCORA FEDERAL</h2>
               <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-1">NOM-024-SSA3-2012</p>
           </div>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end max-w-2xl">
            <select 
              value={filterAction} 
              onChange={(e) => setFilterAction(e.target.value)} 
              className="bg-gray-100/50 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            >
                <option value="all">Todas las Acciones</option>
                <option value="SECURITY_RLS">Seguridad RLS</option>
                <option value="INSERT">Inserciones</option>
                <option value="UPDATE">Actualizaciones</option>
                <option value="DELETE">Eliminaciones</option>
            </select>
            <select 
              value={filterTable} 
              onChange={(e) => setFilterTable(e.target.value)} 
              className="bg-gray-100/50 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            >
                <option value="all">Todo el Sistema</option>
                <optgroup label="Core">
                    <option value="profiles">Usuarios</option>
                    <option value="clinics">Clínicas</option>
                </optgroup>
                <optgroup label="Clínica">
                    <option value="patients">Pacientes</option>
                    <option value="consultations">Consultas</option>
                    <option value="appointments">Agenda</option>
                </optgroup>
                <optgroup label="Configuración">
                    <option value="ai_prompts">AI Prompts</option>
                    <option value="database">Seguridad DB</option>
                </optgroup>
            </select>
            <button 
              onClick={fetchLogs} 
              className={`p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all ${refreshing ? 'animate-spin' : 'hover:scale-105 active:scale-95'}`}
              title="Refrescar logs"
            >
                <RefreshCcw size={18} />
            </button>
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 px-1 custom-scrollbar">
         {logs.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-12 text-center space-y-4 shadow-sm my-10">
                <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="text-gray-300" size={40} />
                </div>
                <div>
                    <p className="text-sm font-black text-gray-800">Sin movimientos registrados</p>
                    <p className="text-xs text-gray-400 font-medium mt-1">Aplica los filtros para ver acciones específicas del sistema.</p>
                </div>
                <button 
                    onClick={() => {setFilterAction('all'); setFilterTable('all');}}
                    className="text-xs font-black text-blue-600 hover:text-blue-700 underline underline-offset-4"
                >
                    Limpiar todos los filtros
                </button>
            </div>
         ) : (
            <div className="grid grid-cols-1 gap-4 pb-10">
                {logs.map((l) => formatLogEntry(l))}
            </div>
         )}
         <div ref={logEndRef} />
      </div>
      
      <style jsx>{`
        .capitalize-first::first-letter {
            text-transform: uppercase;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #e5e7eb;
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #d1d5db;
        }
      `}</style>
    </div>
  );
}

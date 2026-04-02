'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, ShieldAlert, Table as TableIcon, Layers, Search, Filter, RefreshCw, Plus, ShieldCheck, ShieldX } from 'lucide-react';
import RLSVisualizer from './RLSVisualizer';
import PolicyModal from './PolicyModal';
import { RLSPolicy, RLSTable } from '@/types/rls';
import { toast } from 'sonner';

export default function RLSManager() {
  const [data, setData] = useState<{ tables: any[]; policies: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // States for Modal/Editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<RLSPolicy | null>(null);

  const fetchMetadata = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/superadmin/rls/metadata');
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error || 'Error al obtener metadatos');
      
      setData(result);
    } catch (err: any) {
      console.error('Metadata Fetch Error:', err);
      setError(err.message);
      toast.error('Error de Metadatos', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  const handleNodeClick = useCallback((type: 'table' | 'policy', nodeData: any) => {
    if (type === 'table') {
      setSelectedTable(nodeData.label);
      setSelectedPolicy(null);
      setIsModalOpen(true);
    } else {
      setSelectedTable(nodeData.table);
      setSelectedPolicy(nodeData as RLSPolicy);
      setIsModalOpen(true);
    }
  }, []);

  const handleSavePolicy = async (policyData: any) => {
    if (!selectedTable) return;

    try {
      const res = await fetch('/api/superadmin/rls/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_POLICY',
          tableName: selectedTable,
          policyName: policyData.name,
          definition: policyData
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || result.details || 'Error al aplicar política');

      toast.success('Política aplicada correctamente');
      fetchMetadata();
    } catch (err: any) {
      console.error('Save Policy Error:', err);
      toast.error('Error al aplicar política', { description: err.message });
      throw err; // Re-throw for modal error handling
    }
  };

  const handleToggleRLS = async (tableName: string, currentState: boolean) => {
    const action = currentState ? 'DISABLE_RLS' : 'ENABLE_RLS';
    
    // Optimistic UI could be added here, but toast is enough for now
    const toastId = toast.loading(`${currentState ? 'Desactivando' : 'Activando'} RLS en ${tableName}...`);

    try {
      const res = await fetch('/api/superadmin/rls/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, tableName })
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Error en la operación');
      }

      toast.success(`RLS ${currentState ? 'desactivado' : 'activado'} en ${tableName}`, { id: toastId });
      fetchMetadata();
    } catch (err: any) {
      toast.error('Error al cambiar RLS', { id: toastId, description: err.message });
    }
  };

  const filteredTables = data?.tables.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-pulse">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium tracking-tight">Analizando estructura de base de datos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Error de Conexión</h3>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <button 
          onClick={fetchMetadata}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
        >
          Reintentar Carga
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full border-t border-slate-200 dark:border-slate-800">
      {/* Sidebar de Tablas */}
      <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shadow-sm z-10">
        <div className="p-4 space-y-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar tabla..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Esquema Public</span>
            <button 
              onClick={fetchMetadata}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              title="Refrescar"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {filteredTables.map((table) => (
              <div
                key={table.name}
                className="group flex items-center justify-between p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
              >
                <div 
                  className="flex-1 flex items-center gap-3 p-2 cursor-pointer"
                  onClick={() => {
                    setSelectedTable(table.name);
                    setSelectedPolicy(null);
                    setIsModalOpen(true);
                  }}
                >
                  <TableIcon className={`w-4 h-4 ${table.has_rls ? 'text-blue-500' : 'text-slate-300'}`} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors truncate">
                    {table.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button
                     onClick={() => handleToggleRLS(table.name, table.has_rls)}
                     className={`p-1.5 rounded-lg transition-all ${
                       table.has_rls 
                        ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30' 
                        : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                     }`}
                     title={table.has_rls ? 'Desactivar RLS' : 'Activar RLS'}
                   >
                     {table.has_rls ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldX className="w-3.5 h-3.5" />}
                   </button>
                   <button
                     onClick={() => {
                        setSelectedTable(table.name);
                        setSelectedPolicy(null);
                        setIsModalOpen(true);
                     }}
                     className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg"
                     title="Nueva Política"
                   >
                     <Plus className="w-3.5 h-3.5" />
                   </button>
                </div>
              </div>
            ))}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
           <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <div className="flex items-center gap-2">
                 <Layers className="w-3.5 h-3.5" />
                 <span>TABLAS: {data?.tables.length}</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-500">
                 <ShieldCheck className="w-3 h-3" />
                 <span>PROTEGIDAS: {data?.tables.filter(t => t.has_rls).length}</span>
              </div>
           </div>
        </div>
      </aside>

      {/* Visualizador ReactFlow */}
      <main className="flex-1 min-w-0 bg-slate-50 relative">
        {data && (
          <RLSVisualizer 
            tables={data.tables} 
            policies={data.policies} 
            onNodeClick={handleNodeClick}
          />
        )}
      </main>

      {/* Modal de Editor de Políticas */}
      {selectedTable && (
        <PolicyModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tableName={selectedTable}
          policy={selectedPolicy}
          onSave={handleSavePolicy}
        />
      )}
    </div>
  );
}

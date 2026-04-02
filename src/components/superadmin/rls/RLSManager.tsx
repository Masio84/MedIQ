'use client';

import { useState, useEffect } from 'react';
import { Loader2, ShieldAlert, Table as TableIcon, Layers, Search, Filter, RefreshCw } from 'lucide-react';
import RLSVisualizer from './RLSVisualizer';
import { toast } from 'sonner';

export default function RLSManager() {
  const [data, setData] = useState<{ tables: any[]; policies: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
      <aside className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
        <div className="p-4 space-y-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filtrar tablas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800 outline-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Esquema Public</span>
            <button 
              onClick={fetchMetadata}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              title="Refrescar"
            >
              <RefreshCw className={`w-3 h-3 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          <div className="space-y-0.5">
            {filteredTables.map((table) => (
              <button
                key={table.name}
                className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10 group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${table.has_rls ? 'bg-green-500' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 truncate">
                    {table.name}
                  </span>
                </div>
                <TableIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400" />
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
           <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
              <Layers className="w-3.5 h-3.5" />
              <span>Total Tablas: <b>{data?.tables.length}</b></span>
           </div>
        </div>
      </aside>

      {/* Visualizador ReactFlow */}
      <main className="flex-1 min-w-0 bg-slate-50 relative">
        {data && (
          <RLSVisualizer 
            tables={data.tables} 
            policies={data.policies} 
          />
        )}
      </main>
    </div>
  );
}

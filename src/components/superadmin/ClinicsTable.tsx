import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, PlusCircle, AlertTriangle } from 'lucide-react';

export default function ClinicsTable({ clinics = [], isLoading, onRefresh }: { clinics: any[]; isLoading: boolean; onRefresh: () => void }) {
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [customLimits, setCustomLimits] = useState<string>('');
  
  const [pendingUpgrades, setPendingUpgrades] = useState<Record<string, number>>({});

  const supabase = createClient();

  useEffect(() => {
     fetchPendingUpgrades();
  }, []);

  const fetchPendingUpgrades = async () => {
     const { data } = await supabase
       .from('notifications')
       .select('clinic_id')
       .eq('type', 'upgrade_request')
       .eq('acted', false);
       
     if (data) {
        const counts: Record<string, number> = {};
        data.forEach((n: any) => {
           if (n.clinic_id) counts[n.clinic_id] = (counts[n.clinic_id] || 0) + 1;
        });
        setPendingUpgrades(counts);
     }
  };

  const handleResolveUpgrade = async (id: string, clinicObj: any) => {
      await supabase
        .from('notifications')
        .update({ acted: true })
        .eq('clinic_id', id)
        .eq('type', 'upgrade_request');

      setPendingUpgrades(prev => {
         const dummy = { ...prev };
         delete dummy[id];
         return dummy;
      });

      setSelectedClinic(clinicObj);
      setCustomLimits(JSON.stringify(clinicObj.custom_limits || {}, null, 2));
      setIsDrawerOpen(true);
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    setIsUpdating(true);
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';

    try {
      const res = await fetch('/api/superadmin/update-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clinic_id: id, status: nextStatus })
      });
      if (!res.ok) throw new Error('Error al actualizar status');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePlanChange = async (id: string, newPlan: string) => {
    setIsUpdating(true);

    try {
      const res = await fetch('/api/superadmin/update-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clinic_id: id, plan_slug: newPlan })
      });
      if (!res.ok) throw new Error('Error al cambiar plan');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateCustomLimits = async () => {
    if (!selectedClinic) return;
    setIsUpdating(true);

    try {
      const parsed = JSON.parse(customLimits);
      const { error } = await supabase
        .from('clinic_subscriptions')
        .update({ custom_limits: parsed })
        .eq('clinic_id', selectedClinic.id);

      if (error) alert('Error: ' + error.message);
      else {
        onRefresh();
        setIsDrawerOpen(false);
      }
    } catch (e) {
      alert('JSON Inválido: Asegúrate de que los límites estén bien estructurados.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase">
              <th className="px-6 py-4">Clínica</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Uso Métricas</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8"><Loader2 className="animate-spin inline-block mr-2" /> Cargando Clínicas...</td></tr>
            ) : !Array.isArray(clinics) || clinics.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin registros de clínicas activas</td></tr>
            ) : (
              clinics.map((c: any) => {
                const isActive = c.status === 'active';
                const hasUpgrade = (pendingUpgrades[c.id] || 0) > 0;

                return (
                  <tr key={c.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                         <p className="text-sm font-bold text-gray-900">{c.name}</p>
                         {hasUpgrade && (
                            <button 
                              onClick={() => handleResolveUpgrade(c.id, c)}
                              className="bg-orange-100 border border-orange-200 text-orange-700 text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse shadow-sm"
                            >
                              <AlertTriangle size={10} /> Upgrade
                            </button>
                         )}
                      </div>
                      <p className="text-xxs text-gray-400">
                        Alta: {new Date(c.created_at || Date.now()).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: '2-digit', 
                          day: '2-digit',
                          timeZone: 'America/Mexico_City'
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={c.plan_slug} 
                        onChange={(e) => handlePlanChange(c.id, e.target.value)}
                        className="bg-transparent text-xs font-bold text-gray-700 capitalize border border-gray-100 rounded-lg p-1"
                      >
                        <option value="esencial">Esencial</option>
                        <option value="consultorio">Consultorio</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleStatusToggle(c.id, c.status)}
                        className={`text-xxs font-black px-2.5 py-1 rounded-full ${
                          isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {isActive ? 'Activa' : 'Suspendida'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-xxs font-medium text-gray-600 space-y-0.5">
                      <p>🩺 <strong className="text-gray-900">{c.doctors_count}</strong> Médico{c.doctors_count !== 1 && 's'}</p>
                      <p>📋 <strong className="text-gray-900">{c.consultations_count}</strong> Consulta{c.consultations_count !== 1 && 's'}</p>
                    </td>
                    <td className="px-6 py-4 flex gap-2 justify-center items-center">
                      <button 
                        onClick={() => {
                          setSelectedClinic(c);
                          setCustomLimits(JSON.stringify(c.custom_limits || {}, null, 2));
                          setIsDrawerOpen(true);
                        }}
                        className="text-xxs font-bold text-blue-600 hover:underline"
                      >
                        Detalle / Límites
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer Lateral para Editar Límites (Modo Enterprise) */}
      {isDrawerOpen && selectedClinic && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xxs" onClick={() => setIsDrawerOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl p-6 flex flex-col space-y-4">
            <h3 className="text-md font-bold text-gray-900 border-b pb-2 flex justify-between items-center">
              <span>Límites Personalizados</span>
              <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400">&times;</button>
            </h3>
            
            <p className="text-xxs font-bold text-gray-400">CLÍNICA</p>
            <p className="text-sm font-black text-gray-900">{selectedClinic.name}</p>

            {selectedClinic.plan_slug !== 'enterprise' && (
              <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl text-amber-700 text-xxs font-bold flex gap-2">
                <AlertTriangle size={16} /> 
                <span>Los límites personalizados solo aplican para cuentas Enterprise. Cambia el plan primero si deseas editar.</span>
              </div>
            )}

            <div className="flex-1 flex flex-col pt-2">
              <label className="text-xxs font-black text-gray-500 uppercase">Configuración JSON</label>
              <textarea 
                value={customLimits}
                disabled={selectedClinic.plan_slug !== 'enterprise' || isUpdating}
                onChange={(e) => setCustomLimits(e.target.value)}
                rows={10}
                className="w-full bg-gray-50 font-mono text-xs p-3 border border-gray-100 rounded-xl flex-1 focus:outline-none focus:border-blue-500 disabled:opacity-50 mt-1"
                placeholder={`{\n  "max_doctors": 5,\n  "ai_recommendations": true\n}`}
              />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setIsDrawerOpen(false)} 
                className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold"
              >
                Cerrar
              </button>
              {selectedClinic.plan_slug === 'enterprise' && (
                <button 
                  onClick={updateCustomLimits}
                  disabled={isUpdating}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex justify-center items-center gap-1"
                >
                  {isUpdating && <Loader2 size={12} className="animate-spin" />}
                  Guardar Cambios
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

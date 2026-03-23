import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, FileText, Activity, ShieldCheck, UserPlus, AlertTriangle, Loader2, CheckCircle, Mail, HelpCircle, Server } from 'lucide-react';

interface AdminDashboardProps {
  profile: any;
  plan: any; // Se pasa desde el servidor
  stats: {
    doctorsCount: number;
    assistantsCount: number;
    consultationsCount: number;
    usersCount: number;
  };
}

export default function AdminDashboard({ profile, plan, stats }: AdminDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  
  // Límites
  const [limits, setLimits ] = useState({
     max_doctors: plan?.limits?.max_doctors as number | null,
     max_assistants: plan?.limits?.max_assistants as number | null,
     max_consultations: plan?.limits?.max_consultations as number | null,
     max_patients: plan?.limits?.max_patients as number | null,
     storage_mb: plan?.limits?.storage_mb as number | null
  });

  // Conteo de registros reales para comparación
  const [counts, setCounts] = useState({
     doctors: 0,
     assistants: 0,
     consultations: 0,
     patients: 0,
     storage_mb: 0
  });

  // Modales
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'doctor' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [errorInvite, setErrorInvite] = useState<string | null>(null);

  const supabase = createClient();

'use client';

  useEffect(() => {
    if (profile?.clinic_id) {
       loadDashboardData();
    }
  }, [profile?.clinic_id]);

  const loadDashboardData = async () => {
     setLoading(true);
     await Promise.all([
         fetchProfiles(),
         fetchRealtimeUsages()
     ]);
     setLoading(false);
  };

  const fetchProfiles = async () => {
     const { data } = await supabase
       .from('profiles')
       .select('*')
       .eq('clinic_id', profile.clinic_id)
       .order('created_at', { ascending: false });
       
     if (data) setProfiles(data);
  };

  const fetchRealtimeUsages = async () => {
    try {
      const res = await fetch(`/api/clinic/usage?clinic_id=${profile.clinic_id}`);
      if (res.ok) {
         const data = await res.json();
         setCounts({
            consultations: data.usage.max_consultations_mo || 0,
            patients: data.usage.max_patients || 0,
            doctors: data.usage.max_doctors || 0,
            assistants: data.usage.max_assistants || 0,
            storage_mb: data.usage.storage_mb || 0
         });
      }
    } catch (err) {
      console.error('Error cargando consumos:', err);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean | undefined) => {
      const nextStatus = currentStatus === false; // toggle invertido
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: nextStatus })
        .eq('id', userId);
        
      if (!error) fetchProfiles();
  };

  const handleInviteUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setInviteLoading(true);
      setErrorInvite(null);

      try {
          const res = await fetch('/api/admin/invite-user', { // API que hereda Auth Admin de Supabase
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  ...inviteData,
                  clinic_id: profile.clinic_id
              })
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error || 'Error al invitar usuario');

          setIsInviteModalOpen(false);
          setInviteData({ name: '', email: '', role: 'doctor' });
          fetchProfiles();
      } catch (err: any) {
          setErrorInvite(err.message);
      } finally {
          setInviteLoading(false);
      }
  };

  const handleRequestUpgrade = async () => {
      await supabase.from('notifications').insert([{
           type: 'upgrade_request',
           clinic_id: profile.clinic_id,
           message: `La clínica ${profile.clinic_name || 'tu clínica'} solicita una actualización de plan.`
      }]);
      alert('Solicitud enviada al Super Administrador.');
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-gray-400" /></div>;

  const renderProgressBar = (current: number, limit: number | null, label: string) => {
      if (limit === null) return null;
      const percentage = limit > 0 ? Math.min(100, (current / limit) * 100) : 0;
      let color = 'bg-blue-600';
      if (percentage >= 80) color = 'bg-yellow-500';
      if (percentage >= 90) color = 'bg-red-500';

      return (
         <div className="space-y-1">
            <div className="flex justify-between items-center text-xxs font-bold text-gray-500">
                <span>{label}</span>
                <span>{current} / {limit}</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
            </div>
         </div>
      );
  };

  const doctorsFull = limits.max_doctors !== null && counts.doctors >= limits.max_doctors;
  const assistantsFull = limits.max_assistants !== null && counts.assistants >= limits.max_assistants;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Panel de Administrador</h1>
          <p className="text-xs text-gray-400 font-medium">Gestión local de tu clínica</p>
        </div>
        
        <div className="flex items-center gap-2">
            <span className="bg-blue-50 text-blue-700 text-xxs font-black px-3 py-1.5 rounded-full capitalize">Plan: {plan?.slug || 'Esencial'}</span>
            <button 
              onClick={() => setIsInviteModalOpen(true)}
              className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <UserPlus size={16} />
              Invitar Usuario
            </button>
        </div>
      </div>

      {/* SECCIÓN 1: Métricas y Consumo */}
      <h3 className="text-xxs font-black text-gray-400 uppercase tracking-wider">Consumo del Mes</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><FileText size={18} /></div>
                  <span className="text-xs font-bold text-gray-700">Consultas</span>
              </div>
              {renderProgressBar(counts.consultations, limits.max_consultations, "Consultas este mes")}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
                  <span className="text-xs font-bold text-gray-700">Pacientes</span>
              </div>
              {renderProgressBar(counts.patients, limits.max_patients, "Pacientes registrados")}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><ShieldCheck size={18} /></div>
                  <span className="text-xs font-bold text-gray-700">Personal Médico</span>
              </div>
              {renderProgressBar(counts.doctors, limits.max_doctors, "Médicos")}
          </div>
      </div>

      {/* SECCIÓN 2: Gestión de Usuarios */}
      <h3 className="text-xxs font-black text-gray-400 uppercase tracking-wider pt-4">Personal de la Clínica</h3>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase">
                          <th className="px-6 py-4">Usuario</th>
                          <th className="px-6 py-4">Rol</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Estado</th>
                          <th className="px-6 py-4 text-center">Acciones</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {profiles.map((p) => {
                          const isUserActive = p.is_active !== false;
                          return (
                              <tr key={p.id} className="hover:bg-gray-50/40 transition-colors">
                                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{p.name || 'Sin nombre'}</td>
                                  <td className="px-6 py-4">
                                      <span className={`capitalize text-xxs font-bold px-2 py-0.5 rounded-full ${p.role === 'doctor' ? 'bg-blue-50 text-blue-700' : p.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-600'}`}>
                                          {p.role}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-xs font-medium text-gray-500">{p.email || 'N/A'}</td>
                                  <td className="px-6 py-4">
                                      <span className={`inline-flex items-center text-xxs font-black ${isUserActive ? 'text-green-600' : 'text-red-500'}`}>
                                          {isUserActive ? 'Activo' : 'Inactivo'}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      <button 
                                          onClick={() => handleToggleUserStatus(p.id, p.is_active)}
                                          className={`text-xxs font-bold px-2.5 py-1 rounded-lg border ${
                                              isUserActive ? 'border-red-100 text-red-600 hover:bg-red-50' : 'border-green-100 text-green-600 hover:bg-green-50'
                                          }`}
                                      >
                                          {isUserActive ? 'Desactivar' : 'Activar'}
                                      </button>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>

      {/* SECCIÓN 3: Estado del Plan y Alertas de mejora */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-black text-gray-900 border-b pb-2 flex items-center justify-between">
                  <span>Estatus de Suscripción</span>
                  <button onClick={handleRequestUpgrade} className="text-xxs font-bold text-blue-600 hover:underline">Solicitar Upgrade</button>
              </h4>
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                  <div>
                      <p className="text-xxs font-black text-gray-400">PLAN ACTUAL</p>
                      <p className="text-md font-black text-gray-900 capitalize">{plan?.slug || 'Esencial'}</p>
                  </div>
                  <CheckCircle className="text-green-600" size={24} />
              </div>
          </div>

          {/* Sección 4: Módulos habilitados */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h4 className="text-sm font-black text-gray-900 border-b pb-2 mb-4">Módulos habilitados en plan</h4>
              <div className="grid grid-cols-2 gap-2">
                  {plan?.features && Object.keys(plan.features).map((feat) => {
                      const isEnabled = plan.features[feat];
                      return (
                          <div key={feat} className={`flex items-center gap-2 p-2 rounded-lg ${isEnabled ? 'bg-green-50/50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
                              <CheckCircle size={14} className={isEnabled ? 'text-green-600' : 'text-gray-300'} />
                              <span className="text-xxs font-bold capitalize">{feat.replace('_', ' ')}</span>
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>

      {/* Modal Agregar Usuario */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleInviteUser} className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl relative">
            <button type="button" onClick={() => setIsInviteModalOpen(false)} className="absolute top-4 right-4 text-gray-400 font-bold">&times;</button>
            <h3 className="text-md font-black text-gray-900 border-b pb-2 flex items-center gap-1.5"><UserPlus size={18}/> Invitar Nuevo Usuario</h3>
            
            {errorInvite && <p className="bg-red-50 text-red-600 p-2 text-xxs border border-red-100 rounded-lg">{errorInvite}</p>}

            <div className="space-y-2">
               <div>
                  <label className="block text-xxs font-bold text-gray-500">Nombre</label>
                  <input type="text" required value={inviteData.name} onChange={(e) => setInviteData({...inviteData, name: e.target.value})} className="w-full bg-gray-50 px-2.5 py-2 text-sm border rounded-md focus:outline-none focus:border-blue-500 font-medium"/>
               </div>
               <div>
                  <label className="block text-xxs font-bold text-gray-500">Email</label>
                  <input type="email" required value={inviteData.email} onChange={(e) => setInviteData({...inviteData, email: e.target.value})} className="w-full bg-gray-50 px-2.5 py-2 text-sm border rounded-md focus:outline-none focus:border-blue-500 font-medium"/>
               </div>
               <div>
                  <label className="block text-xxs font-bold text-gray-500">Rol</label>
                  <select value={inviteData.role} onChange={(e) => setInviteData({...inviteData, role: e.target.value})} className="w-full bg-gray-50 px-2.5 py-2 text-sm border rounded-md focus:outline-none focus:border-blue-500 font-black">
                      <option value="doctor" disabled={doctorsFull}>Médico {doctorsFull && '(Límite Alcanzado)'}</option>
                      <option value="assistant" disabled={assistantsFull}>Asistente {assistantsFull && '(Límite Alcanzado)'}</option>
                  </select>
               </div>
            </div>

            <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="w-full py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold">Cancelar</button>
                <button type="submit" disabled={inviteLoading || (inviteData.role === 'doctor' && doctorsFull) || (inviteData.role === 'assistant' && assistantsFull)} className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50">
                    {inviteLoading ? 'Enviando...' : 'Invitar'}
                </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

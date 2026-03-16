'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, FileText, Activity, ShieldCheck, UserPlus, CreditCard, ChevronRight, X } from 'lucide-react';

interface AdminDashboardProps {
  stats: {
    doctorsCount: number;
    assistantsCount: number;
    consultationsCount: number;
    usersCount: number;
  };
}

export default function AdminDashboard({ stats }: AdminDashboardProps) {
  const [activeTab, setActiveTab ] = useState<'metrics' | 'clinics' | 'users' | 'usage' | 'plans' | 'subscriptions'>('metrics');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [clinicFilter, setClinicFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // SaaS Multi-clinic states
  const [clinics, setClinics] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);
  const [newClinicData, setNewClinicData] = useState({ name: '', address: '', phone: '', email: '' });
  
  // User creation state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '', role: 'doctor', clinic_id: '' });

  // Linking state
  const [linkingAssistant, setLinkingAssistant] = useState('');

  // Feedback State
  const [feedback, setFeedback] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' }>({ isOpen: false, title: '', message: '', type: 'success' });

  const supabase = createClient();

  useEffect(() => {
    fetchAll();
  }, [supabase]);

  const fetchAll = async () => {
     setLoading(true);
     await Promise.all([
        fetchProfiles(),
        fetchClinics(),
        fetchSubscriptions()
     ]);
     setLoading(false);
  };

  const fetchProfiles = async () => {
    let profs: any[] = [];
    try {
      const res = await fetch('/api/admin/list-users');
      const result = await res.json();
      if (result.success) profs = result.data;
    } catch (err) {
      console.error('Error fetching profiles API:', err);
    }

    const { data: consults } = await supabase
      .from('consultations')
      .select('doctor_id');

    const { data: appoints } = await supabase
      .from('appointments')
      .select('doctor_id, date')
      .order('date', { ascending: false });

    if (profs) {
       const mapped = profs.map(p => {
          const count = consults?.filter(c => c.doctor_id === p.id).length || 0;
          const lastAp = appoints?.find(a => a.doctor_id === p.id);
          const lastAct = lastAp ? new Date(lastAp.date).toLocaleDateString() : 'Sin Actividad';

          return {
             ...p,
             consultations_count: count,
             last_activity: lastAct
          };
       });
       setProfiles(mapped);
    }
  };

  const fetchClinics = async () => {
    try {
      const res = await fetch('/api/admin/list-clinics');
      const result = await res.json();
      if (result.success) setClinics(result.data);
    } catch (err) {
      console.error('Error fetching clinics API:', err);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/admin/list-subscriptions');
      const result = await res.json();
      if (result.success) setSubscriptions(result.data);
    } catch (err) {
      console.error('Error fetching subscriptions API:', err);
    }
  };

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('clinics').insert([newClinicData]);
    if (error) {
       setFeedback({ isOpen: true, title: 'Error', message: 'No se pudo crear la clínica: ' + error.message, type: 'error' });
    } else {
       setFeedback({ isOpen: true, title: '¡Éxito!', message: 'Clínica creada', type: 'success' });
       setIsClinicModalOpen(false);
       setNewClinicData({ name: '', address: '', phone: '', email: '' });
       fetchClinics();
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData),
      });

      const result = await res.json();

      if (result.success) {
        setFeedback({ isOpen: true, title: '¡Éxito!', message: 'Usuario creado exitosamente', type: 'success' });
        setIsModalOpen(false);
        setNewUserData({ name: '', email: '', password: '', role: 'doctor', clinic_id: '' });
        fetchProfiles();
      } else {
        setFeedback({ isOpen: true, title: 'Error', message: result.error || 'No se pudo crear el usuario', type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ isOpen: true, title: 'Error de Red', message: 'No se pudo conectar con el servidor', type: 'error' });
    } finally {
      setLoading(false);
    }
  };  const handleLinkAssistant = async (doctorId: string) => {
    if (!linkingAssistant) return;

    // Validate Limit matching Plan
    const docAssistantsCount = profiles.filter(a => a.doctor_id === doctorId).length;
    let limit = 1; // Beta
    const docPlan = profiles.find(p => p.id === doctorId)?.plan_assigned || 'Beta';
    if (docPlan === 'Basico') limit = 2;
    if (docPlan === 'Premium') limit = 5;

    if (docAssistantsCount >= limit) {
       setFeedback({ isOpen: true, title: 'Límite alcanzado', message: `El plan ${docPlan} solo permite ${limit} asistente(s).`, type: 'error' });
       return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ doctor_id: doctorId })
      .eq('id', linkingAssistant);
    
    if (error) {
      setFeedback({ isOpen: true, title: 'Error', message: 'No se pudo vincular: ' + error.message, type: 'error' });
    } else {
      setFeedback({ isOpen: true, title: '¡Éxito!', message: 'Asistente vinculado exitosamente', type: 'success' });
      fetchProfiles();
      setLinkingAssistant('');
      if (selectedUser) {
        setSelectedUser({ ...selectedUser, doctor_id: linkingAssistant }); // Keep in sync
      }
    }
  };

  const handlePlanChange = async (userId: string, newPlan: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ plan_assigned: newPlan })
      .eq('id', userId);

    if (error) {
       setFeedback({ isOpen: true, title: 'Error', message: 'No se pudo cambiar el plan: ' + error.message, type: 'error' });
    } else {
       setFeedback({ isOpen: true, title: '¡Éxito!', message: 'Plan actualizado a ' + newPlan, type: 'success' });
       setProfiles(prev => prev.map(p => p.id === userId ? { ...p, plan_assigned: newPlan } : p));
       if (selectedUser && selectedUser.id === userId) {
          setSelectedUser({ ...selectedUser, plan_assigned: newPlan });
       }
    }
  };

  const handleValidatePayment = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/validate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      });
      const result = await res.json();

      if (result.success) {
        setFeedback({ isOpen: true, title: '¡Éxito!', message: 'Mensualidad validada', type: 'success' });
        setProfiles(prev => prev.map(p => p.id === userId ? { ...p, last_payment_date: new Date().toISOString(), pending_payment: 0 } : p));
      } else {
        setFeedback({ isOpen: true, title: 'Error', message: result.error, type: 'error' });
      }
    } catch (err) {
      console.error('Error validating payment:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Panel de Administrador</h1>
          <p className="text-sm text-gray-500">Supervisa las métricas y SaaS analytics del sistema.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'users' && (
            <div className="flex gap-2">
              <select 
                value={clinicFilter} 
                onChange={(e) => setClinicFilter(e.target.value)} 
                className="text-xs border rounded-lg p-1.5 bg-white font-medium"
              >
                <option value="">Todas las Clínicas</option>
                {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
              >
                <UserPlus size={16} />
                Crear Usuario
              </button>
            </div>
          )}
          {activeTab === 'clinics' && (
            <button
              onClick={() => setIsClinicModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              <Users size={16} />
              Crear Clínica
            </button>
          )}
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex gap-1 border-b border-gray-100 pb-px overflow-x-auto text-sm">
        <button onClick={() => setActiveTab('metrics')} className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'metrics' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-900'}`}>Métricas</button>
        <button onClick={() => setActiveTab('clinics')} className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'clinics' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-900'}`}>Clínicas</button>
        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'users' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-900'}`}>Usuarios</button>
        <button onClick={() => setActiveTab('usage')} className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'usage' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-900'}`}>Uso de Médicos</button>
        <button onClick={() => setActiveTab('plans')} className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'plans' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-900'}`}>Planes</button>
        <button onClick={() => setActiveTab('subscriptions')} className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'subscriptions' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-900'}`}>Suscripciones</button>
      </div>

      {/* TAB 1: METRICS */}
      {activeTab === 'metrics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card icon={<Users size={20} className="text-blue-600" />} bg="bg-blue-50" label="Médicos" value={stats.doctorsCount} />
          <Card icon={<ShieldCheck size={20} className="text-yellow-600" />} bg="bg-yellow-50" label="Asistentes" value={stats.assistantsCount} />
          <Card icon={<FileText size={20} className="text-purple-600" />} bg="bg-purple-50" label="Consultas" value={stats.consultationsCount} />
          <Card icon={<Activity size={20} className="text-green-600" />} bg="bg-green-50" label="Usuarios Totales" value={stats.usersCount} />
          <Card icon={<Users size={20} className="text-orange-600" />} bg="bg-orange-50" label="Clínicas Activas" value={clinics.length} />
          <Card icon={<CreditCard size={20} className="text-indigo-600" />} bg="bg-indigo-50" label="MRR Estimado" value={`$${subscriptions.reduce((acc, s) => acc + (s.monthly_price || 0), 0).toLocaleString()}`} />
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Rol</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {profiles.filter(p => !clinicFilter || p.clinic_id === clinicFilter).map((p) => (
                  <tr key={p.id} onClick={() => setSelectedUser(p)} className={`hover:bg-gray-50/50 cursor-pointer transition-colors ${selectedUser?.id === p.id ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center justify-between">
                      <div>
                         <p>{p.name || 'Sin Nombre'}</p>
                         {p.role === 'doctor' && (
                            <p className="text-xxs text-gray-400 font-normal">Asistente: {profiles.find(a => a.doctor_id === p.id)?.name || 'Sin asignar'}</p>
                         )}
                         {p.role === 'assistant' && p.doctor_id && (
                            <p className="text-xxs text-gray-400 font-normal">Médico: {profiles.find(d => d.id === p.doctor_id)?.name || p.doctor_id.substring(0,8)}</p>
                         )}
                      </div>
                      <ChevronRight size={16} className="text-gray-300" />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.role === 'admin' ? 'bg-purple-50 text-purple-700' : p.role === 'doctor' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'}`}>
                        {p.role === 'admin' ? 'Administrador' : p.role === 'doctor' ? 'Doctor' : 'Asistente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Details Sidebar overlay or flex */}
          {selectedUser && (
            <div className="w-full md:w-80 p-6 space-y-6 bg-white shrink-0">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold text-gray-900">Detalles de Usuario</h3>
                <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>

              {/* Personal info */}
              <div className="space-y-2">
                <span className="text-xs text-gray-400 font-semibold uppercase">Datos Personales</span>
                <p className="text-sm font-medium text-gray-900">{selectedUser.name}</p>
                <p className="text-xs text-gray-500">{selectedUser.role === 'admin' ? 'Administrador' : selectedUser.role === 'doctor' ? 'Doctor' : 'Asistente'}</p>
                <p className="text-xs text-gray-500">Creado: {new Date(selectedUser.created_at).toLocaleDateString()}</p>
              </div>

              {/* Activity Info */}
              <div className="space-y-2 pt-4 border-t border-gray-50">
                <span className="text-xs text-gray-400 font-semibold uppercase">Información de Actividad</span>
                <p className="text-xs text-gray-600">Historial: Acceso estándar registrado.</p>
                {selectedUser.role === 'doctor' && (
                  <div>
                    <p className="text-xs text-gray-600">Consultas Creadas: {stats.consultationsCount} (En revisión)</p>
                    
                    {/* Link Assistant panel */}
                    <div className="mt-2 space-y-1">
                      {profiles.filter(a => a.doctor_id === selectedUser.id).length > 0 && (
                          <div className="bg-blue-50/50 p-2 rounded-xl text-xxs font-bold text-blue-700 flex items-center justify-between border border-blue-100/30 mb-1">
                             <span>Asistente Vinculado:</span>
                             <span className="font-black text-blue-900">{profiles.find(a => a.doctor_id === selectedUser.id)?.name}</span>
                          </div>
                      )}
                      
                      <label className="text-xs text-gray-500">Vincular / Cambiar Asistente:</label>
                      <select 
                        value={linkingAssistant}
                        onChange={(e) => setLinkingAssistant(e.target.value)}
                        className="w-full text-xs border rounded p-1 bg-white"
                      >
                        <option value="">Seleccionar...</option>
                        {profiles.filter(p => p.role === 'assistant').map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                      <button onClick={() => handleLinkAssistant(selectedUser.id)} className="w-full mt-1 bg-gray-100 hover:bg-gray-200 text-xxs py-1 rounded">Vincular</button>
                    </div>
                  </div>
                )}
                     {selectedUser.role === 'assistant' && selectedUser.doctor_id && (
                  <p className="text-xs text-blue-600 font-bold">Vinculado a: {profiles.find(d => d.id === selectedUser.doctor_id)?.name || 'Médico'}</p>
                )}
              </div>

              {/* Billing Info */}
              <div className="space-y-2 pt-4 border-t border-gray-50">
                <span className="text-xs text-gray-400 font-semibold uppercase">Facturación SaaS</span>
                <div>
                  <p className="text-xs text-gray-600">
                    Plan Asignado: <span className="font-bold text-blue-600">
                      {selectedUser.role === 'assistant' && selectedUser.doctor_id 
                         ? (profiles.find(co => co.id === selectedUser.doctor_id)?.plan_assigned || 'Beta') 
                         : (selectedUser.plan_assigned || 'Beta')
                      }
                    </span>
                  </p>
                  {selectedUser.role === 'doctor' && (
                     <div className="mt-1">
                        <label className="text-xxs text-gray-400">Modificar Plan:</label>
                        <select 
                           value={selectedUser.plan_assigned || 'Beta'}
                           onChange={(e) => handlePlanChange(selectedUser.id, e.target.value)}
                           className="w-full text-xs border rounded p-1 bg-white mt-0.5 focus:outline-none focus:border-blue-500"
                        >
                           <option value="Beta">Beta (Gratuito)</option>
                           <option value="Basico">Básico</option>
                           <option value="Premium">Premium</option>
                        </select>
                     </div>
                  )}
                </div>
                <p className="text-xs text-gray-600">Deuda Pendiente: <span className="font-bold flex items-center gap-1"><CreditCard size={12}/> ${selectedUser.pending_payment || '0.00'} MXN</span></p>
                <p className="text-xs text-gray-600">Último Pago: {selectedUser.last_payment_date ? new Date(selectedUser.last_payment_date).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DOCTOR USAGE */}
      {activeTab === 'usage' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50"><h3 className="font-bold">Uso del Sistema por Doctores</h3></div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Médico</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Consultas</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Última Actividad</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {profiles.filter(p => p.role === 'doctor').map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-bold">{p.consultations_count || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.last_activity || 'Sin Actividad'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">{p.plan_assigned || 'Beta'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: PRICING PLANS */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="text-center max-w-md mx-auto py-2">
             <h2 className="text-2xl font-black text-gray-900">Mejora tu plan</h2>
             <p className="text-xs text-gray-500 mt-1">Selecciona el plan que se adapte mejor a tu consultorio</p>
          </div>

          <div className="flex justify-center mt-2">
             <div className="bg-gray-100/80 p-1 rounded-full flex gap-1 text-xxs font-bold border border-gray-100">
                <button className="bg-white px-3 py-1.5 rounded-full shadow-sm text-gray-900 border border-gray-100/40">Mensual</button>
                <button className="px-3 py-1.5 text-gray-400 cursor-not-allowed">Anual (-20%)</button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
             {/* Card 1: Beta */}
             <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                   <span className="text-xxs font-black text-gray-400 uppercase tracking-widest">Fase Inicial</span>
                   <h3 className="text-xl font-black text-gray-900 mt-1">Plan Beta</h3>
                   <div className="mt-3">
                      <span className="text-3xl font-black text-gray-900">$1,600</span>
                      <span className="text-xs text-gray-400 font-medium"> MXN/mes</span>
                   </div>
                   <p className="text-xs text-gray-500 mt-1 leading-snug">Ideal para médicos en fase de adopción reducida.</p>
                   
                   <button className="w-full mt-5 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 bg-gray-50 cursor-default">Plan Actual</button>

                   <div className="border-t border-gray-50 my-5" />

                   <ul className="space-y-3 text-sm text-gray-600">
                      <li className="flex items-center gap-2"><div className="bg-gray-50 p-1 rounded-md"><Users size={14} className="text-gray-500"/></div> Registro de Pacientes</li>
                      <li className="flex items-center gap-2"><div className="bg-gray-50 p-1 rounded-md"><FileText size={14} className="text-gray-500"/></div> Seguimiento de Consultas</li>
                      <li className="flex items-center gap-2"><div className="bg-gray-50 p-1 rounded-md"><Activity size={14} className="text-gray-500"/></div> Reportes Básicos</li>
                   </ul>
                </div>
             </div>

             {/* Card 2: Básico - DESTACADO */}
             <div className="bg-white border-2 border-blue-600 shadow-xl rounded-2xl p-6 flex flex-col justify-between relative transform md:scale-105">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xxs font-black px-3 py-0.5 rounded-full shadow-md uppercase tracking-wide">MÁS POPULAR</span>
                <div>
                   <span className="text-xxs font-black text-blue-600 uppercase tracking-widest">Profesional</span>
                   <h3 className="text-xl font-black text-gray-900 mt-1">Plan Básico</h3>
                   <div className="mt-3">
                      <span className="text-3xl font-black text-gray-900">$2,500</span>
                      <span className="text-xs text-gray-400 font-medium"> MXN/mes</span>
                   </div>
                   <p className="text-xs text-gray-500 mt-1 leading-snug">Expedientes clínicos y reportes avanzados.</p>
                   
                   <button className="w-full mt-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-not-allowed">Cambiar a Básico</button>

                   <div className="border-t border-gray-100 my-5" />

                   <ul className="space-y-3 text-sm text-gray-600">
                      <li className="flex items-center gap-2"><div className="bg-blue-50 p-1 rounded-md"><FileText size={14} className="text-blue-600"/></div> Expedientes completos</li>
                      <li className="flex items-center gap-2"><div className="bg-blue-50 p-1 rounded-md"><ShieldCheck size={14} className="text-blue-600"/></div> Historial Clínico</li>
                      <li className="flex items-center gap-2"><div className="bg-blue-50 p-1 rounded-md"><Activity size={14} className="text-blue-600"/></div> Reportes Avanzados</li>
                      <li className="flex items-center gap-2"><div className="bg-blue-50 p-1 rounded-md"><Users size={14} className="text-blue-600"/></div> Soporte de Asistentes</li>
                   </ul>
                </div>
             </div>

             {/* Card 3: Premium */}
             <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                   <span className="text-xxs font-black text-purple-600 uppercase tracking-widest">Avanzado</span>
                   <h3 className="text-xl font-black text-gray-900 mt-1">Plan Premium</h3>
                   <div className="mt-3">
                      <span className="text-3xl font-black text-gray-900">$3,999</span>
                      <span className="text-xs text-gray-400 font-medium"> MXN/mes</span>
                   </div>
                   <p className="text-xs text-gray-500 mt-1 leading-snug">IA Médica y Automatización total de agenda.</p>
                   
                   <button className="w-full mt-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors cursor-not-allowed">Cambiar a Premium</button>

                   <div className="border-t border-gray-50 my-5" />

                   <ul className="space-y-3 text-sm text-gray-600">
                      <li className="flex items-center gap-2"><div className="bg-purple-50 p-1 rounded-md"><FileText size={14} className="text-purple-600"/></div> Todo lo del Plan Básico</li>
                      <li className="flex items-center gap-2"><div className="bg-purple-50 p-1 rounded-md"><Users size={14} className="text-purple-600"/></div> Asistencia de IA en Consulta</li>
                      <li className="flex items-center gap-2"><div className="bg-purple-50 p-1 rounded-md"><ShieldCheck size={14} className="text-purple-600"/></div> Recetas Inteligentes</li>
                   </ul>
                </div>
             </div>
          </div>

          {/* Onboarding Fee Analysis */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 hover:shadow-md transition-shadow flex flex-col md:flex-row items-center justify-between gap-6 mt-8">
             <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
                <div className="bg-blue-50 p-3 rounded-2xl flex items-center justify-center shrink-0">
                   <CreditCard size={24} className="text-blue-600" />
                </div>
                <div>
                   <span className="text-xxs font-black text-blue-600 uppercase tracking-widest">Pago Único</span>
                   <h3 className="text-lg font-black text-gray-900 mt-1">Cuota de Instalación y Onboarding</h3>
                   <p className="text-xs text-gray-500 mt-1 leading-snug">Cubre costes de instalación, configuración inicial, capacitación del personal y personalización del consultorio.</p>
                </div>
             </div>
             <div className="text-center md:text-right shrink-0">
                <div className="text-3xl font-black text-gray-900">$3,000</div>
                <span className="text-xs text-gray-400 font-medium"> MXN (Cargo único)</span>
             </div>
          </div>
        </div>
      )}

      {/* TAB: CLINICS */}
      {activeTab === 'clinics' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center"><h3 className="font-bold">Gestión de Clínicas</h3></div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Nombre</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Contacto</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Personal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clinics.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                     <p>{c.email || 'Sin email'}</p>
                     <p>{c.phone || 'Sin teléfono'}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600">
                     Doctores: {profiles.filter(p => p.clinic_id === c.id && p.role === 'doctor').length} 
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: SUBSCRIPTIONS */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50"><h3 className="font-bold">Suscripciones SaaS (Clínicas)</h3></div>
            {subscriptions.length === 0 ? (
               <div className="p-6 text-center text-gray-400 text-xs">No hay suscripciones registradas para clínicas.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Clínica</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Plan</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Precio</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {subscriptions.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.clinic_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{s.plan_name}</td>
                      <td className="px-6 py-4 text-sm font-bold">${s.monthly_price}</td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-0.5 rounded-full text-xxs font-bold ${s.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {s.status}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50"><h3 className="font-bold">Planes de Médicos</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Médico</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Plan</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Último Pago</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Días Restantes</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {profiles.filter(p => p.role === 'doctor').map(p => {
                    const getDaysRemaining = (str: string | null) => {
                      if (!str) return { text: 'Pendiente', days: 0 };
                      const diff = new Date(str).getTime() + 30 * 24 * 60 * 60 * 1000 - new Date().getTime();
                      const days = Math.ceil(diff / (1000 * 3600 * 24));
                      return { text: days > 0 ? `${days} días` : 'Vencido', days };
                    };
                    const daysInfo = getDaysRemaining(p.last_payment_date);

                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.name || 'Médico'}</td>
                        <td className="px-6 py-4"><span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{p.plan_assigned || 'Beta'}</span></td>
                        <td className="px-6 py-4 text-xs text-gray-500">{p.last_payment_date ? new Date(p.last_payment_date).toLocaleDateString() : 'Pendiente'}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-black ${daysInfo.text === 'Vencido' ? 'text-red-600' : daysInfo.text === 'Pendiente' ? 'text-amber-600' : 'text-emerald-600'}`}>
                             {daysInfo.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleValidatePayment(p.id)} 
                            disabled={daysInfo.days > 10}
                            className={`font-bold py-1 px-3 rounded-lg text-xxs shadow-sm transition-all ${daysInfo.days > 10 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:-translate-y-0.5'}`}
                          >
                            Validar Pago
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* User Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateUser} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-gray-900 border-b pb-2">Crear Usuario</h3>
            <div>
              <label className="text-xs text-gray-500">Nombre</label>
              <input 
                type="text" 
                required 
                value={newUserData.name}
                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                className="w-full text-sm border rounded p-2 mt-1" 
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Email</label>
              <input 
                type="email" 
                required 
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                className="w-full text-sm border rounded p-2 mt-1" 
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Contraseña temporal</label>
              <input 
                type="password" 
                required 
                placeholder="Mínimo 6 caracteres"
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                className="w-full text-sm border rounded p-2 mt-1" 
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Rol</label>
              <select 
                value={newUserData.role}
                onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                className="w-full text-sm border rounded p-2 mt-1 bg-white"
              >
                <option value="doctor">Doctor</option>
                <option value="assistant">Asistente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Clínica</label>
              <select 
                value={newUserData.clinic_id}
                onChange={(e) => setNewUserData({ ...newUserData, clinic_id: e.target.value })}
                className="w-full text-sm border rounded p-2 mt-1 bg-white"
              >
                <option value="">Ninguna</option>
                {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                disabled={loading}
                className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                >
                  Cancelar
                </button>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded text-sm transition-colors flex justify-center items-center"
              >
                {loading ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clinic Creation Modal */}
      {isClinicModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateClinic} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-gray-900 border-b pb-2">Crear Clínica</h3>
            <div>
              <label className="text-xs text-gray-500">Nombre de la Clínica</label>
              <input type="text" required value={newClinicData.name} onChange={(e) => setNewClinicData({ ...newClinicData, name: e.target.value })} className="w-full text-sm border rounded p-2 mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Dirección</label>
              <input type="text" value={newClinicData.address} onChange={(e) => setNewClinicData({ ...newClinicData, address: e.target.value })} className="w-full text-sm border rounded p-2 mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Teléfono</label>
              <input type="text" value={newClinicData.phone} onChange={(e) => setNewClinicData({ ...newClinicData, phone: e.target.value })} className="w-full text-sm border rounded p-2 mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Email</label>
              <input type="email" value={newClinicData.email} onChange={(e) => setNewClinicData({ ...newClinicData, email: e.target.value })} className="w-full text-sm border rounded p-2 mt-1" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setIsClinicModalOpen(false)} className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors">Cancelar</button>
              <button type="submit" className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors">Crear</button>
            </div>
          </form>
        </div>
      )}

      {/* Feedback Modal Overlay */}
      {feedback.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 text-center">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${feedback.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {feedback.type === 'success' ? <ShieldCheck size={24} /> : <X size={24} />}
            </div>
            <h3 className="font-bold text-lg text-gray-900">{feedback.title}</h3>
            <p className="text-sm text-gray-500">{feedback.message}</p>
            <div>
              <button 
                onClick={() => setFeedback({ ...feedback, isOpen: false })} 
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${feedback.type === 'success' ? 'bg-gray-900 hover:bg-gray-800 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ icon, bg, label, value }: { icon: React.ReactNode; bg: string; label: string; value: string | number }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100/50 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-400">{label}</span>
        <span className={`p-2 ${bg} rounded-lg`}>{icon}</span>
      </div>
      <div className="mt-4"><span className="text-3xl font-bold text-gray-900">{value}</span></div>
    </div>
  );
}


'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, UserPlus, Users, Calendar, DollarSign, Loader2 } from 'lucide-react';
import PatientForm from '@/components/PatientForm';

export default function DoctorDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [todayPatients, setTodayPatients] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [activePatients, setActivePatients] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [filter, setFilter] = useState<'today' | 'weekly' | 'range'>('today');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const supabase = useMemo(() => createClient(), []);

  // Search autocomplete
  useEffect(() => {
    const searchPatients = async () => {
      if (searchTerm.trim() === '') {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      const { data } = await supabase
        .from('patients')
        .select('id, name')
        .or(`name.ilike.%${searchTerm}%`);
      if (data) setSearchResults(data);
      setSearching(false);
    };

    const timeoutId = setTimeout(searchPatients, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, supabase]);

  // Fetch data
  const fetchData = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];

    // 2. Fetch Billing according to filter (Only paid ones)
    let query = supabase.from('billing').select('normal_fee, discount, extra_charge, created_at').eq('paid', true);
    
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);

    if (filter === 'today') {
      query = query.gte('created_at', startOfToday.toISOString());
    } else if (filter === 'weekly') {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      query = query.gte('created_at', lastWeek.toISOString());
    } else if (filter === 'range' && dateRange.start && dateRange.end) {
      query = query.gte('created_at', dateRange.start).lte('created_at', dateRange.end);
    }

    const [todayResult, pCountResult, bCountResult, billingsResult] = await Promise.all([
      supabase.from('consultations').select('id, patient_id, created_at, status, patients(name)').gte('created_at', today),
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('billing').select('*', { count: 'exact', head: true }).eq('paid', false),
      query
    ]);

    if (todayResult.data) setTodayPatients(todayResult.data);
    if (pCountResult.count !== null) setActivePatients(pCountResult.count);
    if (bCountResult.count !== null) setPendingPayments(bCountResult.count);
    
    if (billingsResult.data) {
      const total = billingsResult.data.reduce(
        (acc: number, b: any) => acc + (Number(b.normal_fee) + Number(b.extra_charge) - Number(b.discount)),
        0
      );
      setTotalEarned(total);
      setConsultations(billingsResult.data);
    }
  }, [filter, dateRange, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Top Search Bar (Removed top Nuevo Paciente button to move to bottom) */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Buscar paciente por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-[0.5px] border-black/8 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white text-black text-sm"
          />
          {searching && (
            <div className="absolute right-3 top-2.5">
              <Loader2 size={18} className="animate-spin text-gray-400" />
            </div>
          )}
          
          {/* Suggestions Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border-[0.5px] border-black/8 rounded-xl shadow-lg">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    window.location.href = `/dashboard/consultations?patient_id=${p.id}`;
                    setSearchTerm('');
                    setSearchResults([]);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-900 border-b-[0.5px] border-black/8 last:border-0"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3 Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Consultas Hoy */}
        <div className="bg-white border-[0.5px] border-black/8 rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Consultas hoy</span>
          <span className="text-3xl font-medium" style={{ color: '#1A4A8A' }}>{todayPatients.length}</span>
        </div>
        {/* Pacientes Activos */}
        <div className="bg-white border-[0.5px] border-black/8 rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Pacientes activos</span>
          <span className="text-3xl font-medium text-gray-900">{activePatients}</span>
        </div>
        {/* Pendientes de Pago */}
        <div className="bg-white border-[0.5px] border-black/8 rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <span className="text-xs font- medium text-gray-500 uppercase tracking-wider mb-2">Pendientes de pago</span>
          <span className="text-3xl font-medium" style={{ color: '#854F0B' }}>{pendingPayments}</span>
        </div>
      </div>

      {/* Agenda de hoy Table */}
      <div className="bg-white border-[0.5px] border-black/8 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          Agenda de hoy
        </h3>
        {todayPatients.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            No hay citas programadas para hoy.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border-[0.5px] border-black/8">
              <thead>
                <tr className="border-[0.5px] border-black/8 text-[11px] font-medium text-gray-500 uppercase tracking-wider bg-gray-50/50">
                  <th className="py-3 px-4 w-12 text-center border-[0.5px] border-black/8">Avatar</th>
                  <th className="py-3 px-4 border-[0.5px] border-black/8">Nombre paciente</th>
                  <th className="py-3 px-4 border-[0.5px] border-black/8">Hora</th>
                  <th className="py-3 px-4 text-center border-[0.5px] border-black/8">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-[0.5px] divide-black/8">
                {todayPatients.map((c: any, index: number) => {
                  const initials = c.patients?.name ? c.patients.name.substring(0,2).toUpperCase() : 'NA';
                  
                  const statusMap = {
                    completed: { label: 'Atendido', bg: '#E6F5F0', color: '#0F6E56' },
                    in_progress: { label: 'En consulta', bg: '#E8F0FB', color: '#1A4A8A' },
                    pending: { label: 'Pendiente', bg: '#FAEEDA', color: '#854F0B' },
                  };
                  const s = statusMap[c.status as keyof typeof statusMap] ?? statusMap.pending;

                  return (
                    <tr key={c.id}>
                      <td className="py-3 px-4 border-[0.5px] border-black/8 text-center">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 border-[0.5px] border-black/8 mx-auto">
                          {initials}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 border-[0.5px] border-black/8">
                        {c.patients?.name || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 border-[0.5px] border-black/8">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-center border-[0.5px] border-black/8">
                        <span 
                          className="inline-flex px-2 py-1 text-[10px] font-medium rounded-md" 
                          style={{ backgroundColor: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Botones de acción rápida al fondo */}
      <div className="flex flex-col sm:flex-row gap-4 mt-2">
        <button 
          className="flex-1 py-3 bg-gray-900 border-[0.5px] border-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
          Nueva consulta
        </button>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex-1 py-3 bg-white border-[0.5px] border-black/8 text-gray-900 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
          Nuevo paciente
        </button>
      </div>

      {/* Nuevo Paciente Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 text-lg font-bold"
            >
              &times;
            </button>
            <PatientForm onSuccess={() => {
              setIsModalOpen(false);
              fetchData();
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

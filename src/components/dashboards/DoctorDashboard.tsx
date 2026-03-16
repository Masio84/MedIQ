'use client';

import { useState, useEffect } from 'react';
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
  const [filter, setFilter] = useState<'today' | 'weekly' | 'range'>('today');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const supabase = createClient();

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
  const fetchData = async () => {
    // 1. Fetch Today's consultations
    const today = new Date().toISOString().split('T')[0];
    const { data: cToday } = await supabase
      .from('consultations')
      .select('id, patient_id, created_at, patients(name)')
      .gte('created_at', today);
    if (cToday) setTodayPatients(cToday);

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

    const { data: billings } = await query;
    if (billings) {
      const total = billings.reduce(
        (acc: number, b: any) => acc + (Number(b.normal_fee) + Number(b.extra_charge) - Number(b.discount)),
        0
      );
      setTotalEarned(total);
      setConsultations(billings);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter, dateRange, supabase]);

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-1/2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Buscar paciente por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white text-black text-sm"
          />
          {searching && (
            <div className="absolute right-3 top-2.5">
              <Loader2 size={18} className="animate-spin text-gray-400" />
            </div>
          )}
          
          {/* Suggestions Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    // Navigate or alert component if needed
                    window.location.href = `/dashboard/consultations?patient_id=${p.id}`;
                    setSearchTerm('');
                    setSearchResults([]);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-900 border-b border-gray-100 last:border-0"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium shadow-sm transition-colors w-full md:w-auto justify-center"
        >
          <UserPlus size={18} />
          Nuevo Paciente
        </button>
      </div>

      {/* Grid: Consultations & Earnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Patients */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100/50 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            Pacientes Atendidos Hoy
          </h3>
          {todayPatients.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              No se han registrado consultas el día de hoy.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50 text-xs font-semibold text-gray-400">
                    <th className="py-2">Paciente</th>
                    <th className="py-2 text-right">Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {todayPatients.map((c: any) => (
                    <tr key={c.id}>
                      <td className="py-3 text-sm font-medium text-gray-900">{c.patients?.name || 'N/A'}</td>
                      <td className="py-3 text-sm text-gray-500 text-right">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Consultas Pagadas Stats */}
        <div className="bg-white rounded-xl border border-gray-100/50 shadow-sm p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign size={18} className="text-gray-400" />
            Consultas Pagadas
          </h3>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 border-b border-gray-50">
            <button
              onClick={() => setFilter('today')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === 'today' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              Hoy
            </button>
            <button
              onClick={() => setFilter('weekly')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === 'weekly' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              Semanal
            </button>
            <button
              onClick={() => setFilter('range')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === 'range' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              Rango
            </button>
          </div>

          {filter === 'range' && (
            <div className="flex gap-2 mb-4">
              <input
                type="date"
                className="w-full text-xs border border-gray-100 rounded-lg p-1"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
              <input
                type="date"
                className="w-full text-xs border border-gray-100 rounded-lg p-1"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          )}

          <div className="mt-2 text-center flex-1 flex flex-col justify-center">
            <span className="text-xs text-gray-400 font-medium">Total Recaudado</span>
            <span className="text-4xl font-black text-gray-900 mt-1">
              ${totalEarned.toFixed(2)}
            </span>
            <span className="text-xs text-gray-400 mt-1 capitalize">
              ({filter === 'today' ? 'hoy' : filter === 'weekly' ? 'últimos 7 días' : 'rango seleccionado'})
            </span>
          </div>
        </div>
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

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Clock, User, FileText, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useRole } from '@/context/RoleContext';

export default function AgendaPage() {
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [selectedDayAppointments, setSelectedDayAppointments] = useState<any[]>([]);
  const [selectedDateString, setSelectedDateString] = useState<string | null>(null);
  const { role } = useRole();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('todos');
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Creation States from actions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [newAppointment, setNewAppointment] = useState({ patient_id: '', doctor_id: '', date: '', time: '', notes: '' });
  const [quickPatientSearch, setQuickPatientSearch] = useState('');
  const [quickPatientDropdown, setQuickPatientDropdown] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const supabase = createClient();

  const filteredAppointments = allAppointments.filter(app => {
    const matchesDoctor = selectedDoctorId === 'todos' || app.doctor_id === selectedDoctorId;
    const patientName = app.patients ? app.patients.name : 'Paciente';
    const matchesPatient = selectedPatientId 
      ? app.patient_id === selectedPatientId
      : searchTerm.trim() === '' 
          ? true 
          : patientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDoctor && matchesPatient;
  });

  useEffect(() => {
    fetchMonthAppointments();
    fetchPatients();
    fetchSupportDoctors();
  }, [currentDate]);

  const fetchSupportDoctors = async () => {
    try {
      const res = await fetch('/api/admin/list-users');
      const result = await res.json();
      if (result.success) {
         const docs = result.data.filter((u: any) => u.role === 'doctor');
         setDoctors(docs);
      }
    } catch (err) {
      console.error('Error fetching support doctors:', err);
    }
  };

  const confirmNewAppointment = async () => {
    if (!newAppointment.patient_id || !newAppointment.doctor_id || !newAppointment.date || !newAppointment.time) {
      setModalError('Por favor llena todos los campos obligatorios.');
      return;
    }
    setModalError(null);

    const { error } = await supabase.from('appointments').insert([newAppointment]);

    if (error) {
      setModalError('Error: ' + error.message);
    } else {
      setIsModalOpen(false);
      setQuickPatientSearch('');
      fetchMonthAppointments(); // Refresh layouts configs!
    }
  };

  const fetchMonthAppointments = async () => {
    setLoading(true);
    const startCount = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
    const endCount = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

    try {
      if (role === 'admin') {
        const res = await fetch(`/api/admin/list-appointments?start=${startCount}&end=${endCount}`);
        const result = await res.json();
        if (result.success) setAllAppointments(result.data);
      } else {
        const { data } = await supabase
          .from('appointments')
          .select('*, patients(name), profiles:doctor_id(name)')
          .gte('date', startCount)
          .lte('date', endCount)
          .order('time', { ascending: true });
        
        if (data) setAllAppointments(data);
      }
    } catch (err) {
      console.error('Error fetching appointments API:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    const { data } = await supabase.from('patients').select('id, name');
    if (data) setPatients(data);
  };

  // Safe Calendar Layout Math helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const changeMonth = (val: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + val);
    setCurrentDate(d);
    setSelectedDateString(null); // Clear selected
  };

  const handleDayClick = (day: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDateString(dayStr);
    const filtered = allAppointments.filter(app => 
      app.date === dayStr && (selectedDoctorId === 'todos' || app.doctor_id === selectedDoctorId)
    );
    setSelectedDayAppointments(filtered);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Agenda Médica</h1>
          <p className="text-sm text-gray-500">Consulta en vista mensual las citas programadas.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-2 w-full md:w-2/3 md:justify-end">
          {/* Search Bar with Patient Filter */}
          <div className="relative w-full md:w-1/2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Filtrar por Paciente..."
              value={searchTerm}
              onFocus={() => setShowPatientDropdown(true)}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 text-sm"
            />
            {selectedPatientId && (
              <button 
                onClick={() => { setSelectedPatientId(null); setSearchTerm(''); }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}

            {showPatientDropdown && searchTerm.trim() !== '' && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {patients
                  .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        setSearchTerm(p.name);
                        setShowPatientDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-xs font-semibold text-gray-800 border-b border-gray-50 last:border-0"
                    >
                      {p.name}
                    </button>
                  ))
                }
              </div>
            )}
          </div>

          {/* Doctor Filter for Admin */}
          {role === 'admin' && (
            <div className="w-full md:w-1/3">
              <select 
                value={selectedDoctorId} 
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 text-sm font-medium text-gray-700 h-full"
              >
                <option value="todos">Todos los Médicos</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Full Month Calendar View Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100/50 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
            <h2 className="text-lg font-bold text-gray-900">
              {monthNames[month]} {year}
            </h2>
            <div className="flex gap-1">
              <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-600"><ChevronLeft size={18} /></button>
              <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-600"><ChevronRight size={18} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-bold text-gray-400 text-xxs tracking-widest uppercase mb-2">
            <div>Dom</div><div>Lun</div><div>Mar</div><div>Mie</div><div>Jue</div><div>Vie</div><div>Sab</div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Blank placeholder spaces for starts Index offsets */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`blank-${i}`} className="h-14 md:h-20 bg-gray-50/20 rounded-lg"></div>
            ))}

            {/* Loop Days Calendar index Node Cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayAppointments = filteredAppointments.filter(app => app.date === dayStr);
              const hasCitas = dayAppointments.length > 0;

              // Validate highlight for selected searching Patient ID
              const matchingPatient = selectedPatientId ? dayAppointments.some(app => app.patient_id === selectedPatientId) : false;

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => handleDayClick(day)}
                  className={`h-14 md:h-20 flex flex-col items-center justify-center rounded-xl transition-all relative border ${
                    dayStr === selectedDateString 
                     ? 'border-blue-500 bg-blue-50/40' 
                     : matchingPatient 
                        ? 'border-emerald-400 bg-emerald-50/30' 
                        : hasCitas 
                           ? 'border-gray-100 hover:bg-gray-50/80 hover:border-gray-200' 
                           : 'border-transparent hover:bg-gray-50/50 hover:border-gray-100 text-gray-600'
                  }`}
                >
                  <span className={`text-sm font-bold ${dayStr === selectedDateString ? 'text-blue-600' : 'text-gray-900'}`}>{day}</span>
                  
                  {matchingPatient ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1"></div>
                  ) : hasCitas ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1"></div>
                  ) : null}

                  {/* Bubble Count markers for large screens lists */}
                  {hasCitas && (
                    <span className="hidden md:inline-block absolute top-1.5 right-1.5 text-[9px] font-black bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md">
                      {dayAppointments.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Side Panel: Selected Day Details */}
        <div className="bg-white rounded-2xl border border-gray-100/50 shadow-sm p-6 flex flex-col h-full max-h-[600px]">
          <div className="pb-4 border-b border-gray-50 h-max">
            <h3 className="text-md font-bold text-gray-900 flex items-center gap-1.5">
              <Calendar size={18} className="text-blue-500" />
              Horarios {selectedDateString && new Date(selectedDateString + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </h3>
          </div>

          <div className="flex-1 mt-4 overflow-y-auto space-y-2 pr-1">
            {!selectedDateString ? (
              <div className="flex h-full items-center justify-center text-gray-400 text-xs text-center p-4">
                💡 Selecciona un día del calendario para ver o agendar horarios.
              </div>
            ) : (
              <div className="space-y-1">
                {(() => {
                  const slots = [];
                  for (let h = 0; h <= 23; h++) {
                    slots.push(`${String(h).padStart(2, '0')}:00`);
                    slots.push(`${String(h).padStart(2, '0')}:30`);
                  }

                  const dayAppointments = filteredAppointments.filter(app => app.date === selectedDateString);

                  return slots.map(slot => {
                    const appointment = dayAppointments.find(
                      (app) => app.time.substring(0, 5) === slot
                    );

                    return (
                      <div 
                        key={slot} 
                        onClick={() => {
                          if (!appointment) {
                            setNewAppointment({
                              patient_id: '',
                              doctor_id: '',
                              date: selectedDateString || '',
                              time: slot,
                              notes: ''
                            });
                            setIsModalOpen(true);
                          }
                        }}
                        className={`p-2 rounded-xl flex items-center justify-between border transition-all ${
                          appointment 
                            ? 'bg-amber-50/70 border-amber-100 shadow-sm' 
                            : 'bg-white border-gray-50/80 hover:bg-gray-50/50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xxs font-black px-1.5 py-0.5 rounded-lg flex items-center gap-1 ${
                            appointment ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <Clock size={10} />
                            {slot}
                          </span>

                          {appointment ? (
                            <div>
                              <h4 className="font-bold text-gray-900 text-xxs flex items-center gap-1">
                                <User size={11} className="text-gray-400" />
                                {appointment.patients?.name || 'Paciente'}
                              </h4>
                              <p className="text-[9px] text-gray-400">Dr: {appointment.profiles?.name || 'Médico'}</p>
                            </div>
                          ) : (
                            <span className="text-xxs text-gray-300 font-medium">Disponible</span>
                          )}
                        </div>

                        {!appointment && (
                          <span className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg">
                            + Agendar
                          </span>
                        )}
                        {appointment && appointment.notes && (
                          <span className="text-[9px] text-gray-400 italic max-w-[100px] truncate" title={appointment.notes}>
                            "{appointment.notes}"
                          </span>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>

      </div>
      {/* Modal Quick Appointment Agenda */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 text-lg">&times;</button>
            
            <h3 className="text-md font-bold text-gray-900 border-b pb-2 flex items-center gap-1">
              <Calendar size={18} className="text-blue-500"/> Agendar Horario
            </h3>
            
            <div className="space-y-3">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-500 mb-1">Paciente</label>
                <input 
                  type="text" 
                  placeholder="Buscar o escribir nombre..."
                  value={quickPatientSearch}
                  onChange={(e) => {
                     setQuickPatientSearch(e.target.value);
                     setQuickPatientDropdown(true);
                     if (e.target.value === '') setNewAppointment({ ...newAppointment, patient_id: '' });
                  }}
                  onFocus={() => setQuickPatientDropdown(true)}
                  className="w-full bg-white px-3 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
                />
                {quickPatientDropdown && (
                  <div className="absolute top-14 left-0 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto p-1 space-y-0.5">
                    {patients.filter(p => !quickPatientSearch || p.name.toLowerCase().includes(quickPatientSearch.toLowerCase())).map(p => (
                       <div 
                         key={p.id} 
                         onClick={() => {
                            setNewAppointment({ ...newAppointment, patient_id: p.id });
                            setQuickPatientSearch(p.name);
                            setQuickPatientDropdown(false);
                         }}
                         className="px-3 py-1.5 text-xxs hover:bg-gray-50 cursor-pointer rounded-lg text-gray-700 font-bold"
                       >
                          {p.name}
                       </div>
                    ))}
                    {patients.filter(p => p.name.toLowerCase().includes(quickPatientSearch.toLowerCase())).length === 0 && quickPatientSearch.trim() !== '' && (
                       <div 
                         onClick={async () => {
                            const { data, error } = await supabase.from('patients').insert([{ name: quickPatientSearch }]).select('id, name').single();
                            if(data){
                               setPatients([...patients, data]);
                               setNewAppointment({...newAppointment, patient_id: data.id});
                               setQuickPatientDropdown(false);
                            }
                         }}
                         className="px-3 py-1.5 text-xxs hover:bg-blue-50 cursor-pointer rounded-lg text-blue-600 font-black flex items-center gap-1"
                       >
                          + Crear "{quickPatientSearch}"
                       </div>
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Médico</label>
                <select 
                  value={newAppointment.doctor_id}
                  onChange={(e) => setNewAppointment({ ...newAppointment, doctor_id: e.target.value })}
                  className="w-full bg-white px-3 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
                >
                  <option value="">Selecciona Médico...</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="flex items-center justify-between bg-blue-50/50 p-2 rounded-xl border border-blue-50">
                <span className="text-xxs font-bold text-gray-500">Fecha y Hora</span>
                <span className="text-xxs font-black text-blue-600">
                  {newAppointment.date} - {newAppointment.time}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notas / Motivo</label>
                <input 
                  type="text" 
                  placeholder="Ej: Consulta de rutina" 
                  value={newAppointment.notes} 
                  onChange={e => setNewAppointment({...newAppointment, notes: e.target.value})} 
                  className="w-full p-2 border border-gray-100 rounded-lg text-xs focus:outline-none" 
                />
              </div>
            </div>

            {modalError && (
               <div className="bg-red-50 border border-red-100 text-red-600 p-2 rounded-xl text-xxs font-bold text-center mt-2 mx-1">
                 {modalError}
               </div>
            )}

            <div className="flex gap-2 pt-3 border-t border-gray-50 mt-4">
              <button onClick={() => setIsModalOpen(false)} className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-bold">Cancelar</button>
              <button onClick={confirmNewAppointment} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm">Confirmar Cita</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, use } from 'react';
import { Calendar as CalendarIcon, Clock, User, Phone, Mail, FileText, CheckCircle2, ChevronLeft, ChevronRight, AlertCircle, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookPage({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = use(params);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Doctor Info
  const [doctorInfo, setDoctorInfo] = useState<{ name: string; role: string } | null>(null);

  // Form Data
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([]);

  const [patientForm, setPatientForm] = useState({
    name: '',
    phone: '',
    email: '',
    reason: ''
  });

  const [confirmationToken, setConfirmationToken] = useState<string | null>(null);

  // Month navigation for step 1
  const [currentDateNav, setCurrentDateNav] = useState(new Date());

  const year = currentDateNav.getFullYear();
  const month = currentDateNav.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchSlots = async (dateStr: string) => {
     setLoading(true);
     setError(null);
     try {
       const res = await fetch(`/api/appointments/available-slots?doctor_id=${doctorId}&date=${dateStr}`);
       const data = await res.json();
       if (data.success) {
         setAvailableSlots(data.data);
         if (data.doctor) setDoctorInfo(data.doctor);
       } else {
         setError(data.error || 'No se pudieron cargar los horarios');
       }
     } catch (err: any) {
        setError(err.message);
     } finally {
        setLoading(false);
     }
  };

  const handleBook = async () => {
     setLoading(true);
     setError(null);
     try {
       const res = await fetch('/api/appointments/book-public', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            doctor_id: doctorId,
            date: selectedDate,
            start_time: selectedTime,
            patient_name: patientForm.name,
            patient_phone: patientForm.phone,
            patient_email: patientForm.email,
            reason: patientForm.reason
         })
       });
       const data = await res.json();
       if (data.success) {
          setConfirmationToken(data.confirmation_token);
          setCurrentStep(4);
       } else {
          setError(data.error || 'Error al agendar la cita');
       }
     } catch (err: any) {
        setError(err.message);
     } finally {
        setLoading(false);
     }
  };

  const changeMonth = (val: number) => {
    const d = new Date(currentDateNav);
    d.setMonth(d.getMonth() + val);
    setCurrentDateNav(d);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
       <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl overflow-hidden border-[0.5px] border-black/5 flex flex-col">
          
          {/* Header Banner */}
          <div className="bg-[#1A4A8A] p-6 text-white relative">
             <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-3xl"></div>
             <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-xl">
                   {doctorInfo ? doctorInfo.name[0] : 'Dr'}
                </div>
                <div>
                   <p className="text-xs text-blue-200 font-bold tracking-wide uppercase">Agendar Cita Médica</p>
                   <h1 className="text-lg font-black">{doctorInfo ? `Dr. ${doctorInfo.name}` : 'Cargando Médico...'}</h1>
                </div>
             </div>
          </div>

          {/* Stepper Progress */}
          {currentStep < 4 && (
            <div className="px-6 pt-4 flex items-center justify-between border-b border-black/5 pb-4">
                {[1, 2, 3].map(step => (
                   <div key={step} className="flex items-center gap-2">
                       <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${currentStep >= step ? 'bg-[#1A4A8A] text-white' : 'bg-gray-100 text-gray-400'}`}>
                          {step}
                       </div>
                       <span className={`text-xs font-bold ${currentStep >= step ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step === 1 ? 'Fecha' : step === 2 ? 'Hora' : 'Datos'}
                       </span>
                       {step < 3 && <div className={`h-[2px] w-12 rounded-full ${currentStep > step ? 'bg-[#1A4A8A]' : 'bg-gray-100'}`} />}
                   </div>
                ))}
            </div>
          )}

          {/* Steps Content Area */}
          <div className="flex-1 p-6 flex flex-col min-h-[400px]">
             
             {error && <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2 mb-4"><AlertCircle size={14}/> {error}</div>}

             <AnimatePresence mode="wait">
                 
                 {/* STEP 1: SELECT DATE */}
                 {currentStep === 1 && (
                    <motion.div key="step1" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="flex flex-col h-full">
                       <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-1.5"><CalendarIcon size={16} className="text-blue-600"/> 1. Selecciona la Fecha</h3>
                       
                       <div className="border border-black/8 rounded-2xl p-4 bg-gray-50/30 flex-1">
                           <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-black text-gray-800">{monthNames[month]} {year}</span>
                              <div className="flex gap-1">
                                 <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft size={16}/></button>
                                 <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight size={16}/></button>
                              </div>
                           </div>
                           <div className="grid grid-cols-7 text-center mb-2">
                              {['D','L','M','M','J','V','S'].map(d => <div key={d} className="text-[10px] font-bold text-gray-400">{d}</div>)}
                           </div>
                           <div className="grid grid-cols-7 gap-1">
                              {Array.from({ length: firstDayIndex }).map((_, i) => <div key={`b-${i}`} />)}
                              {Array.from({ length: daysInMonth }).map((_, i) => {
                                 const day = i + 1;
                                 const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                 const isSelected = selectedDate === dayStr;
                                 const isPast = dayStr < todayStr;
                                 return (
                                   <button 
                                     key={day} 
                                     disabled={isPast}
                                     onClick={() => { setSelectedDate(dayStr); setSelectedTime(''); }} 
                                     className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${isSelected ? 'bg-[#1A4A8A] text-white' : isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-50 text-gray-700'}`}
                                   >
                                      {day}
                                   </button>
                                 );
                              })}
                           </div>
                       </div>
                       
                       <button onClick={() => setCurrentStep(2)} disabled={!selectedDate} className="w-full py-3 bg-gray-900 text-white font-bold text-sm rounded-xl mt-4 shadow-sm disabled:opacity-50">
                          Continuar
                       </button>
                    </motion.div>
                 )}

                 {/* STEP 2: SELECT TIME */}
                 {currentStep === 2 && (
                    <motion.div key="step2" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="flex flex-col h-full">
                        <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-1.5"><Clock size={16} className="text-blue-600"/> 2. Selecciona el Horario</h3>
                        
                        {loading ? (
                           <div className="flex-1 flex items-center justify-center"><Loader className="animate-spin text-blue-600" size={24}/></div>
                        ) : (
                           <div className="flex-1 grid grid-cols-4 gap-2 border border-black/8 rounded-2xl p-4 bg-gray-50/30 overflow-y-auto max-h-[250px] content-start">
                              {availableSlots.length > 0 ? (
                                availableSlots.map(slot => (
                                   <button 
                                     key={slot.time}
                                     disabled={!slot.available}
                                     onClick={() => setSelectedTime(slot.time)}
                                     className={`p-2 rounded-xl text-xs font-bold transition-all ${selectedTime === slot.time ? 'bg-[#1A4A8A] text-white' : !slot.available ? 'bg-gray-100 text-gray-300 line-through cursor-not-allowed' : 'bg-white border-[0.5px] border-black/8 hover:border-blue-300 text-gray-700 hover:bg-blue-50/50'}`}
                                   >
                                      {slot.time}
                                   </button>
                                ))
                              ) : (
                                <p className="col-span-4 text-center text-xs text-gray-400 py-10 font-bold">No hay horarios disponibles para este día.</p>
                              )}
                           </div>
                        )}

                        <div className="flex gap-2 mt-4">
                           <button onClick={() => setCurrentStep(1)} className="w-1/3 py-3 border-[0.5px] border-black/8 font-bold text-sm rounded-xl hover:bg-gray-50">Atrás</button>
                           <button onClick={() => setCurrentStep(3)} disabled={!selectedTime} className="w-2/3 py-3 bg-gray-900 text-white font-bold text-sm rounded-xl shadow-sm disabled:opacity-50">Continuar</button>
                        </div>
                    </motion.div>
                 )}

                 {/* STEP 3: PATIENT DATA */}
                 {currentStep === 3 && (
                    <motion.div key="step3" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="flex flex-col h-full">
                       <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-1.5"><User size={16} className="text-blue-600"/> 3. Datos del Paciente</h3>
                       
                       <div className="flex-1 space-y-3">
                           <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo *</label>
                              <div className="relative">
                                 <User className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                                 <input type="text" placeholder="Tu nombre..." value={patientForm.name} onChange={e => setPatientForm({...patientForm, name: e.target.value})} className="w-full bg-white pl-9 pr-4 py-2 text-sm border-[0.5px] border-black/10 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"/>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                              <div>
                                 <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono *</label>
                                 <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                                    <input type="tel" placeholder="10 dígitos..." value={patientForm.phone} onChange={e => setPatientForm({...patientForm, phone: e.target.value})} className="w-full bg-white pl-9 pr-4 py-2 text-sm border-[0.5px] border-black/10 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"/>
                                 </div>
                              </div>
                              <div>
                                 <label className="block text-xs font-bold text-gray-700 mb-1">Email <span className="font-normal text-gray-400">(Opcional)</span></label>
                                 <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                                    <input type="email" placeholder="correo@ejemplo.com" value={patientForm.email} onChange={e => setPatientForm({...patientForm, email: e.target.value})} className="w-full bg-white pl-9 pr-4 py-2 text-sm border-[0.5px] border-black/10 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"/>
                                 </div>
                              </div>
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">Motivo / Síntomas *</label>
                              <div className="relative">
                                 <FileText className="absolute left-3 top-3 text-gray-400" size={16}/>
                                 <textarea rows={3} placeholder="Ej: Dolor de garganta, revisión general..." value={patientForm.reason} onChange={e => setPatientForm({...patientForm, reason: e.target.value})} className="w-full bg-white pl-9 pr-4 py-2 text-sm border-[0.5px] border-black/10 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
                              </div>
                           </div>

                           <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/50 flex items-center justify-between mt-2">
                               <div className="flex items-center gap-2">
                                  <CalendarIcon size={14} className="text-blue-600"/>
                                  <span className="text-xs font-black text-gray-800">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                  <Clock size={14} className="text-blue-600"/>
                                  <span className="text-xs font-black text-gray-800">{selectedTime} hrs</span>
                               </div>
                           </div>
                       </div>

                       <div className="flex gap-2 mt-4">
                           <button onClick={() => setCurrentStep(2)} className="w-1/3 py-3 border-[0.5px] border-black/8 font-bold text-sm rounded-xl hover:bg-gray-50">Atrás</button>
                           <button onClick={handleBook} disabled={loading || !patientForm.name || !patientForm.phone || !patientForm.reason} className="w-2/3 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2">
                              {loading ? <Loader className="animate-spin" size={16}/> : 'Confirmar Cita'}
                           </button>
                       </div>
                    </motion.div>
                 )}

                 {/* STEP 4: CONFIRMATION */}
                 {currentStep === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center py-6 h-full flex-1">
                       <CheckCircle2 size={56} className="text-green-500 mb-3 drop-shadow-md" />
                       <h2 className="text-xl font-black text-gray-900 mb-1">¡Cita Reservada Exitosamente!</h2>
                       <p className="text-xs text-gray-500 mb-4">Se ha enviado un correo con los detalles de la consulta.</p>

                       <div className="bg-gray-50 border-[0.5px] border-black/5 rounded-2xl p-4 w-full space-y-2 mb-6">
                            <div className="flex justify-between text-xs"><span className="text-gray-400">Paciente:</span><span className="font-bold text-gray-900">{patientForm.name}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-gray-400">Fecha:</span><span className="font-bold text-gray-900">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-gray-400">Horario:</span><span className="font-bold text-gray-900">{selectedTime} hrs</span></div>
                            <div className="flex justify-between text-xs border-t border-black/5 pt-2 mt-2"><span className="text-gray-400">Folio:</span><span className="font-black text-blue-600">{confirmationToken?.substring(0, 8).toUpperCase() || 'ABC123XY'}</span></div>
                       </div>

                       <p className="text-[10px] text-gray-400 max-w-sm mb-4">Por favor, preséntate 10 minutos antes de tu cita. Conserve su folio para cualquier aclaración.</p>

                       <button onClick={() => window.location.reload()} className="w-full py-3 bg-gray-900 text-white font-bold text-sm rounded-xl">Regresar al Inicio</button>
                    </motion.div>
                 )}
             </AnimatePresence>

          </div>

       </div>
    </div>
  );
}

import re

with open('/home/jorge/MedIQ/MedIQ/src/components/dashboards/AssistantDashboard.tsx', 'r') as f:
    content = f.read()

# Replace states
content = content.replace(
    "  const [todayEarnings, setTodayEarnings] = useState(0);\n  const [doctors, setDoctors] = useState<any[]>([]);",
    "  const [todayEarnings, setTodayEarnings] = useState(0);\n  const [appointmentsToday, setAppointmentsToday] = useState(0);\n  const [doctors, setDoctors] = useState<any[]>([]);"
)

# Replace data fetching
content = content.replace(
    "if (p) setPatients(p);\n  };\n\n  const fetchPendingBillings = async () => {",
    "if (p) setPatients(p);\n\n    const todayStr = new Date().toISOString().split('T')[0];\n    const { count } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', todayStr);\n    if (count !== null) setAppointmentsToday(count);\n  };\n\n  const fetchPendingBillings = async () => {"
)

# Replace JSX
new_jsx = """      {/* 3 Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cobros Pendientes */}
        <div className="bg-white border-[0.5px] border-black/8 rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Cobros pendientes</span>
          <span className="text-3xl font-medium" style={{ color: '#854F0B' }}>{billings.length}</span>
        </div>
        {/* Recaudado Hoy */}
        <div className="bg-white border-[0.5px] border-black/8 rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Recaudado hoy</span>
          <span className="text-3xl font-medium" style={{ color: '#0F6E56' }}>${todayEarnings.toFixed(2)}</span>
        </div>
        {/* Citas Hoy */}
        <div className="bg-white border-[0.5px] border-black/8 rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Citas hoy</span>
          <span className="text-3xl font-medium text-gray-900">{appointmentsToday}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="text-gray-400" size={20} />
          Cobros Pendientes
        </h2>
        <a href="/dashboard/agenda" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-medium text-xs hover:bg-blue-100 transition-colors">
          <Calendar size={14} />
          Ver Agenda
        </a>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : billings.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border-[0.5px] border-black/8 text-center text-gray-400 text-sm shadow-sm">
          No hay cuentas pendientes por cobrar.
        </div>
      ) : (
        <div className="bg-white rounded-xl border-[0.5px] border-black/8 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border-[0.5px] border-black/8">
              <thead>
                <tr className="bg-gray-50/50 border-[0.5px] border-black/8 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3 border-[0.5px] border-black/8">Paciente</th>
                  <th className="px-6 py-3 border-[0.5px] border-black/8">Monto a cobrar</th>
                  <th className="px-6 py-3 text-center border-[0.5px] border-black/8">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y-[0.5px] divide-black/8">
                {billings.map((b) => {
                  const total = Number(b.normal_fee) + Number(b.extra_charge) - Number(b.discount);
                  const patientName = b.patients?.name ? b.patients.name : 'Paciente Sin Nombre'; // Requerimiento: jalar el nombre real, no N/A
                  return (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 border-[0.5px] border-black/8">
                        {patientName}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 text-sm border-[0.5px] border-black/8">
                        ${total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center border-[0.5px] border-black/8">
                        <button 
                          onClick={() => handleMarkAsPaid(b)}
                          className="px-3 py-1.5 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 mx-auto"
                          style={{ backgroundColor: '#E6F5F0', color: '#0F6E56' }}
                        >
                          ✓ Validar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Botones de acción rápida al fondo */}
      <div className="flex flex-col sm:flex-row gap-4 mt-2">
        <button 
          onClick={() => setIsPatientModalOpen(true)}
          className="flex-1 py-3 bg-white border-[0.5px] border-black/8 text-gray-900 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
          Nuevo paciente
        </button>
        <button 
          onClick={() => setIsAppointmentModalOpen(true)}
          className="flex-1 py-3 bg-gray-900 border-[0.5px] border-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
          Agendar cita
        </button>
      </div>"""

start_token = "      {/* Top Section Stats and Actions CTA */}"
end_token = "      {/* Modal Confirmar Pago y Agendar */}"

start_idx = content.find(start_token)
end_idx = content.find(end_token)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_jsx + "\n\n" + content[end_idx:]
    with open('/home/jorge/MedIQ/MedIQ/src/components/dashboards/AssistantDashboard.tsx', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Failed to find tokens")

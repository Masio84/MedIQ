import { Users, LayoutDashboard, Calendar, DollarSign } from 'lucide-react';

export default function GlobalMetrics({ metrics }: { metrics: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Clínicas */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><LayoutDashboard size={20} /></div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Clínicas activas / Totales</span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-gray-900">{metrics.activeClinics}</span>
          <span className="text-xs font-bold text-gray-400">/ {metrics.totalClinics} en total</span>
        </div>
        {metrics.suspendedClinics > 0 && (
          <p className="text-xxs text-red-500 font-bold mt-1">⚠️ {metrics.suspendedClinics} suspendidas</p>
        )}
      </div>

      {/* Usuarios */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><Users size={20} /></div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Usuarios activos</span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-[#0F6E56]">{metrics.doctorCount + metrics.assistantCount + metrics.adminCount}</span>
        </div>
        <p className="text-xxs text-gray-400 font-bold mt-1">
          {metrics.doctorCount} Médico{metrics.doctorCount !== 1 && 's'} · {metrics.assistantCount} Asistente{metrics.assistantCount !== 1 && 's'}
        </p>
      </div>

      {/* Consultas */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Calendar size={20} /></div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Consultas este mes</span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-purple-700">{metrics.monthlyConsultations}</span>
        </div>
        <p className="text-xxs text-gray-400 font-bold mt-1">Acumulado del período actual</p>
      </div>

      {/* MRR */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><DollarSign size={20} /></div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Suma MRR Estimativo</span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-amber-600">${metrics.mrr.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>
        <p className="text-xxs text-gray-400 font-bold mt-1">Suma de precios base de planes activos / mes</p>
      </div>
    </div>
  );
}

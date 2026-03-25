import { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';

export default function CreateClinicModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    clinic_name: '',
    city: '',
    plan_slug: 'esencial',
    admin_name: '',
    email: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/superadmin/create-clinic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al dar de alta clínica');

      setForm({ clinic_name: '', city: '', plan_slug: 'esencial', admin_name: '', email: '' });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold">&times;</button>
        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 border-b pb-2">
          <PlusCircle className="text-blue-600" size={20} />
          Alta de Nueva Clínica
        </h3>

        {error && (
          <p className="bg-red-50 text-red-600 p-2 text-xxs font-bold border border-red-100 rounded-lg">⚠️ {error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xxs font-bold text-gray-500 uppercase">Nombre Comercial</label>
            <input 
              type="text" 
              required
              value={form.clinic_name}
              onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
              placeholder="Ej: Clínica Central"
              className="w-full bg-gray-50/50 px-3 py-2 text-sm border border-gray-100 rounded-md focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xxs font-bold text-gray-500 uppercase">Ubicación / Ciudad</label>
            <input 
              type="text" 
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Ej: Aguascalientes, MX"
              className="w-full bg-gray-50/50 px-3 py-2 text-sm border border-gray-100 rounded-md focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xxs font-bold text-gray-500 uppercase">Plan de arranque</label>
            <select 
              value={form.plan_slug}
              onChange={(e) => setForm({ ...form, plan_slug: e.target.value })}
              className="w-full bg-gray-50/50 px-3 py-2 text-sm border border-gray-100 rounded-md focus:outline-none focus:border-blue-500 font-black text-gray-800"
            >
              <option value="esencial">Esencial (1 Dr)</option>
              <option value="consultorio">Consultorio (1 Dr + 1 Asist)</option>
              <option value="enterprise">Enterprise (2+ Drs / 2+ Asist)</option>
            </select>
          </div>

          <div className="border-t border-gray-50 pt-3">
            <h4 className="text-xxs font-black text-gray-400 uppercase tracking-wider mb-2">Administrador Titular</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xxs font-bold text-gray-500">Nombre</label>
                <input 
                  type="text" 
                  required
                  value={form.admin_name}
                  onChange={(e) => setForm({ ...form, admin_name: e.target.value })}
                  placeholder="Dr. Juan López"
                  className="w-full bg-gray-50/50 px-2.5 py-2 text-sm border border-gray-100 rounded-md focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xxs font-bold text-gray-500">Email (Invitación)</label>
                <input 
                  type="email" 
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-gray-50/50 px-2.5 py-2 text-sm border border-gray-100 rounded-md focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="w-full py-2 bg-gray-50 text-gray-600 rounded-md text-xs font-bold hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading && <Loader2 className="animate-spin" size={12} />}
              Dar de Alta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

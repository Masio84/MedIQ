'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

interface ClinicFormModalProps {
  clinic: any | null; // null for new clinic
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function ClinicFormModal({ clinic, isOpen, onClose, onSave }: ClinicFormModalProps) {
  const [formData, setFormData] = useState({
    clinic_name: '',
    address: '',
    plan_slug: 'consultorio',
    admin_name: '', // only for creation
    email: '', // only for creation
    status: 'active' // only for edition
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clinic) {
      setFormData({
        clinic_name: clinic.name || '',
        address: clinic.address || '',
        plan_slug: clinic.subscription?.plan_slug || 'consultorio',
        admin_name: '',
        email: '',
        status: clinic.subscription?.status || 'active'
      });
    } else {
      setFormData({
        clinic_name: '',
        address: '',
        plan_slug: 'consultorio',
        admin_name: '',
        email: '',
        status: 'active'
      });
    }
    setError(null);
  }, [clinic, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (clinic) {
        await onSave({
          id: clinic.id,
          name: formData.clinic_name,
          address: formData.address,
          plan_slug: formData.plan_slug,
          status: formData.status
        });
      } else {
        await onSave({
          clinic_name: formData.clinic_name,
          city: formData.address,
          plan_slug: formData.plan_slug,
          admin_name: formData.admin_name,
          email: formData.email
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar clínica');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">
            {clinic ? 'Editar Clínica' : 'Dar de Alta Clínica'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 rounded-lg flex gap-2 border border-red-200">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm border-b border-gray-100 pb-2 text-blue-800 font-semibold tracking-wide uppercase">Datos Comerciales</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Clínica</label>
              <input
                type="text"
                required
                value={formData.clinic_name}
                onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección / Ciudad</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Contratado</label>
              <select
                value={formData.plan_slug}
                onChange={(e) => setFormData({ ...formData, plan_slug: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="esencial">Esencial (1 Dr)</option>
                <option value="consultorio">Consultorio (1 Dr + 1 Asist)</option>
                <option value="enterprise">Enterprise (2+ Drs / 2+ Asist)</option>
              </select>
            </div>

            {clinic && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado Operativo</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="active">Servicio Activo</option>
                  <option value="suspended">Servicio Suspendido</option>
                </select>
              </div>
            )}
          </div>

          {!clinic && (
            <div className="space-y-4 pt-4 mt-2 border-t border-gray-100">
              <h3 className="text-sm border-b border-gray-100 pb-2 text-blue-800 font-semibold tracking-wide uppercase">Admin Inicial</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Administrador</label>
                <input
                  type="text"
                  required={!clinic}
                  value={formData.admin_name}
                  onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico (Login)</label>
                <input
                  type="email"
                  required={!clinic}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center min-w-[120px] disabled:opacity-70"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {clinic ? 'Guardar Configuración' : 'Crear Clínica'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

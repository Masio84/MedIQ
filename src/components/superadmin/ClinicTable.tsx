'use client';

import { useState } from 'react';
import { Edit2, Building2, Users, Search, Ban, CheckCircle2 } from 'lucide-react';

interface Clinic {
  id: string;
  name: string;
  address: string;
  subscription: {
    status: string;
    plan_slug: string;
  } | null;
  userCount: number;
}

interface ClinicTableProps {
  clinics: Clinic[];
  loading: boolean;
  onEdit: (clinic: Clinic) => void;
}

export default function ClinicTable({ clinics, loading, onEdit }: ClinicTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClinics = clinics.filter((clinic) => {
    return clinic.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           clinic.address?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Filters Head */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar clínicas por nombre o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-6 py-3 font-medium">Clínica</th>
              <th className="px-6 py-3 font-medium">Plan</th>
              <th className="px-6 py-3 font-medium text-center">Usuarios</th>
              <th className="px-6 py-3 font-medium">Estado</th>
              <th className="px-6 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex justify-center items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Cargando clínicas...</span>
                  </div>
                </td>
              </tr>
            ) : filteredClinics.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No se encontraron clínicas
                </td>
              </tr>
            ) : (
              filteredClinics.map((clinic) => {
                const badgeStatusClass = clinic.subscription?.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200';
                
                return (
                  <tr key={clinic.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{clinic.name}</div>
                          <div className="text-gray-500 text-xs mt-0.5 truncate max-w-xs">{clinic.address}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md text-xs font-medium capitalize">
                        {clinic.subscription?.plan_slug || 'Sin Plan'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2 py-1 rounded-md text-xs font-medium border border-gray-100">
                        <Users className="w-3.5 h-3.5" />
                        {clinic.userCount}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ' + badgeStatusClass}>
                        {clinic.subscription?.status === 'active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                        {clinic.subscription?.status === 'active' ? 'Activa' : 'Suspendida'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(clinic)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="Editar clínica / suspender"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
        Mostrando {filteredClinics.length} de {clinics.length} clínicas en total
      </div>
    </div>
  );
}

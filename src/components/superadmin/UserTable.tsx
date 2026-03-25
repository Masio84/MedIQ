'use client';

import { useState } from 'react';
import { Edit2, Ban, CheckCircle2, MoreVertical, Search, ShieldCheck } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  clinic_id: string;
  clinics: { name: string } | null;
}

interface Clinic {
  id: string;
  name: string;
}

interface UserTableProps {
  users: User[];
  clinics: Clinic[];
  loading: boolean;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
}

export default function UserTable({ users, clinics, loading, onEdit, onToggleStatus }: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.clinics?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Filters Head */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o clínica..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-sm border-gray-200 rounded-lg focus:ring-blue-500 py-2 pl-3 pr-8"
          >
            <option value="all">Todos los roles</option>
            <option value="doctor">Médico</option>
            <option value="assistant">Asistente</option>
            <option value="admin">Admin Clínica</option>
            <option value="superadmin">SuperAdmin</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-6 py-3 font-medium">Usuario</th>
              <th className="px-6 py-3 font-medium">Clínica</th>
              <th className="px-6 py-3 font-medium">Rol</th>
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
                    <span>Cargando usuarios...</span>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const badgeStatusClass = user.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200';
                const actionBtnClass = user.is_active 
                  ? 'text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100' 
                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50 hover:border-green-100';

                return (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md text-xs font-medium">
                        {user.clinics?.name || 'Global (Sin Clínica)'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4">
                      <span className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ' + badgeStatusClass}>
                        {user.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                        {user.is_active ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(user)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="Editar perfil"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onToggleStatus(user)}
                          className={'p-1.5 rounded-lg border border-transparent transition-colors ' + actionBtnClass}
                          title={user.is_active ? 'Suspender acceso (Soft Delete)' : 'Reactivar acceso'}
                        >
                          {user.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
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
        Mostrando {filteredUsers.length} de {users.length} usuarios en total
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, { bg: string, text: string, icon?: boolean }> = {
    doctor: { bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-700' },
    assistant: { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
    admin: { bg: 'bg-fuchsia-50 border-fuchsia-100', text: 'text-fuchsia-700' },
    superadmin: { bg: 'bg-slate-900 border-slate-700', text: 'text-white', icon: true }
  };

  const config = styles[role] || { bg: 'bg-gray-50', text: 'text-gray-700' };

  return (
    <span className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ' + config.bg + ' ' + config.text}>
      {config.icon && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
      {role === 'superadmin' ? 'SuperAdmin' : 
       role === 'admin' ? 'Admin Clínica' : 
       role === 'doctor' ? 'Médico' : 
       role === 'assistant' ? 'Asistente' : role}
    </span>
  );
}

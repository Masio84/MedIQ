'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRole } from '@/context/RoleContext';

type Profile = {
  id: string;
  name: string;
  role: 'admin' | 'doctor' | 'assistant';
  created_at: string;
};

export default function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' }>({ isOpen: false, title: '', message: '', type: 'success' });
  const { role: currentUserRole } = useRole();
  const supabase = createClient();

  // Fetch profiles on mount
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await fetch('/api/admin/list-users');
        const result = await res.json();
        
        if (result.success) {
          setProfiles(result.data as Profile[]);
        } else {
          console.error('Error fetching profiles:', result.error);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUserRole === 'admin') {
      fetchProfiles();
    }
  }, [currentUserRole]);

  const handleRoleChange = async (userId: string, currentName: string, newRole: 'admin' | 'doctor' | 'assistant') => {
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, name: currentName, role: newRole })
      });
      const result = await res.json();

      if (result.success) {
        setFeedback({ isOpen: true, title: '¡Éxito!', message: 'Rol actualizado exitosamente.', type: 'success' });
        setProfiles((prev) =>
          prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p))
        );
      } else {
        console.error('Error updating role:', result.error);
        setFeedback({ isOpen: true, title: 'Error', message: 'No se pudo actualizar el rol: ' + result.error, type: 'error' });
      }
    } catch (err: any) {
      console.error('Update error:', err);
      setFeedback({ isOpen: true, title: 'Error', message: 'Error de red al actualizar rol.', type: 'error' });
    }
  };

  if (currentUserRole !== 'admin') {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        No tienes permisos para acceder a esta sección.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Gestión de Usuarios</h3>
        <p className="text-sm text-gray-500">Administra los roles y accesos de los miembros del equipo.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Nombre</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Rol</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Fecha de Creación</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {profiles.map((profile) => (
              <tr key={profile.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{profile.name || 'Sin Nombre'}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile.role === 'admin' ? 'bg-purple-50 text-purple-700' :
                    profile.role === 'doctor' ? 'bg-blue-50 text-blue-700' :
                    'bg-gray-50 text-gray-700'
                  }`}>
                    {profile.role === 'admin' ? 'Administrador' : profile.role === 'doctor' ? 'Doctor' : 'Asistente'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(profile.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <select
                    value={profile.role}
                    onChange={(e) => handleRoleChange(profile.id, profile.name, e.target.value as any)}
                    className="block w-full max-w-[150px] px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="assistant">Asistente</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Feedback Modal Overlay */}
      {feedback.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 text-center">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${feedback.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              <div className="text-xl font-bold">{feedback.type === 'success' ? '✓' : '✕'}</div>
            </div>
            <h3 className="font-bold text-lg text-gray-900">{feedback.title}</h3>
            <p className="text-sm text-gray-500">{feedback.message}</p>
            <div>
              <button 
                onClick={() => setFeedback({ ...feedback, isOpen: false })} 
                className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

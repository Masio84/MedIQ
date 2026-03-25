'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Users, Building2, Plus } from 'lucide-react';
import UserTable from '@/components/superadmin/UserTable';
import UserFormModal from '@/components/superadmin/UserFormModal';
import ClinicTable from '@/components/superadmin/ClinicTable';
import ClinicFormModal from '@/components/superadmin/ClinicFormModal';
import { toast } from 'sonner';

export default function SuperAdminManagePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'clinics'>('users');
  
  // Data
  const [users, setUsers] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  
  const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<any | null>(null);

  const fetchClinics = async () => {
    try {
      const res = await fetch('/api/superadmin/clinics');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClinics(data.clinics || []);
    } catch (err: any) {
      toast.error('Error al cargar clínicas', { description: err.message });
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/superadmin/users');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUsers(data.users || []);
    } catch (err: any) {
      toast.error('Error al cargar usuarios', { description: err.message });
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchClinics(), fetchUsers()]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);


  // Handler for creating / updating Users
  const handleSaveUser = async (formData: any) => {
    if (editingUser) {
      // Update
      const res = await fetch('/api/superadmin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingUser.id, ...formData })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Usuario actualizado', { description: 'Los cambios se aplicaron correctamente.' });
    } else {
      // Invite
      const res = await fetch('/api/superadmin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Usuario invitado', { description: 'Se ha enviado una invitación a ' + formData.email + '.' });
    }
    fetchUsers(); // reload users
  };

  // Handler for Soft Delete / Reactivate User
  const handleToggleUserStatus = async (user: any) => {
    const newStatus = !user.is_active;
    const actionName = newStatus ? 'Reactivar' : 'Suspender';
    
    if (!confirm('¿Estás seguro que deseas ' + actionName.toLowerCase() + ' al usuario ' + user.name + '?')) return;

    try {
      const res = await fetch('/api/superadmin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, is_active: newStatus })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      const titleStatus = newStatus ? 'reactivado' : 'suspendido';
      const descStatus = newStatus ? 'tiene' : 'no tiene';
      toast.success('Acceso ' + titleStatus, { 
        description: 'El usuario ahora ' + descStatus + ' acceso al sistema.'
      });
      fetchUsers();
    } catch (err: any) {
      toast.error('Error al actualizar estado', { description: err.message });
    }
  };

  // Handler for creating / updating Clinics
  const handleSaveClinic = async (formData: any) => {
    if (editingClinic) {
      // Update
      const res = await fetch('/api/superadmin/clinics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Clínica actualizada', { description: 'Los cambios se aplicaron correctamente.' });
    } else {
      // Create via existing api
      const res = await fetch('/api/superadmin/create-clinic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Clínica creada', { description: 'Se ha creado la clínica y enviado invitación al nuevo admin.' });
      fetchUsers(); // also reload users because an admin was invited
    }
    fetchClinics();
  };

  const getTabClass = (isActive: boolean) => {
    const base = "px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ";
    return base + (isActive ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Control de Plataforma
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión centralizada de clínicas, planes y usuarios del sistema.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'users' ? (
            <button
              onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Nuevo Usuario
            </button>
          ) : (
            <button
              onClick={() => { setEditingClinic(null); setIsClinicModalOpen(true); }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Nueva Clínica
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('users')}
          className={getTabClass(activeTab === 'users')}
        >
          <Users className="w-4 h-4" />
          Usuarios Registrados
        </button>
        <button
          onClick={() => setActiveTab('clinics')}
          className={getTabClass(activeTab === 'clinics')}
        >
          <Building2 className="w-4 h-4" />
          Clínicas y Planes
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'users' ? (
          <UserTable 
            users={users} 
            clinics={clinics} 
            loading={loading} 
            onEdit={(user) => { setEditingUser(user); setIsUserModalOpen(true); }}
            onToggleStatus={handleToggleUserStatus}
          />
        ) : (
          <ClinicTable 
            clinics={clinics} 
            loading={loading} 
            onEdit={(clinic) => { setEditingClinic(clinic); setIsClinicModalOpen(true); }}
          />
        )}
      </div>

      {/* Modals */}
      <UserFormModal 
        user={editingUser}
        clinics={clinics}
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUser}
      />

      <ClinicFormModal 
        clinic={editingClinic}
        isOpen={isClinicModalOpen}
        onClose={() => setIsClinicModalOpen(false)}
        onSave={handleSaveClinic}
      />
    </div>
  );
}

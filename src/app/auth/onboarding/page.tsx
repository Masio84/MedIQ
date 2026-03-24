"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function OnboardingPage() {
  const [role, setRole] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos base
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Campos específicos
  const [specialty, setSpecialty] = useState('');
  const [medicalLicense, setMedicalLicense] = useState('');
  const [position, setPosition] = useState('');
  const [area, setArea] = useState('');

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profile.onboarding_completed) {
          router.push('/dashboard');
          return;
        }

        setRole(profile.role);
        setName(profile.name || '');
      } catch (err: any) {
        setError('Error al cargar perfil.');
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !phone) {
      setError('Nombre y teléfono son obligatorios.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión no encontrada");

      const updates: any = {
        name,
        phone,
        onboarding_completed: true,
      };

      if (role === 'doctor') {
        if (!specialty || !medicalLicense) throw new Error("Especialidad y cedula son obligatorios.");
        updates.specialty = specialty;
        updates.medical_license = medicalLicense;
      } else if (role === 'admin') {
        if (position) updates.position = position;
      } else if (role === 'assistant') {
        if (!area) throw new Error("Área es obligatoria.");
        updates.area = area;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) throw updateError;

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al guardar el onboarding');
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
        <p className="text-xs text-gray-500 font-medium font-sans">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-gray-100/30 border border-gray-100 p-8 space-y-6">
        <div className="text-center">
          <Image 
            src="/logo_v1.png" 
            alt="MedIQ" 
            width={140} 
            height={40} 
            className="mx-auto mb-4 object-contain"
            priority
            style={{ width: 'auto', height: 'auto' }}
          />
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Completa tu perfil</h1>
          <p className="text-xs text-gray-400 mt-1 font-medium font-sans">
             Para acceder al sistema necesitamos unos datos extra
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 flex items-center gap-2 font-medium font-sans">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campos Base */}
          <div>
            <label className="block text-xxs font-black text-gray-500 uppercase tracking-wider mb-1">Nombre Completo</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-black bg-gray-50/10"
              placeholder="Ej. Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-xxs font-black text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-black bg-gray-50/10"
              placeholder="Ej. 5512345678"
            />
          </div>

          {/* Campos Dinámicos por Rol */}
          {role === 'doctor' && (
            <>
              <div>
                <label className="block text-xxs font-black text-gray-500 uppercase tracking-wider mb-1">Especialidad</label>
                <input
                  type="text"
                  required
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-black bg-gray-50/10"
                  placeholder="Ej. Cardiología"
                />
              </div>
              <div>
                <label className="block text-xxs font-black text-gray-500 uppercase tracking-wider mb-1">Cédula Profesional</label>
                <input
                  type="text"
                  required
                  value={medicalLicense}
                  onChange={(e) => setMedicalLicense(e.target.value)}
                  className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-black bg-gray-50/10"
                  placeholder="Ej. 12345678"
                />
              </div>
            </>
          )}

          {role === 'admin' && (
            <div>
              <label className="block text-xxs font-black text-gray-500 uppercase tracking-wider mb-1">Puesto (Opcional)</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-black bg-gray-50/10"
                placeholder="Ej. Gerente General"
              />
            </div>
          )}

          {role === 'assistant' && (
            <div>
              <label className="block text-xxs font-black text-gray-500 uppercase tracking-wider mb-1">Área / Módulo</label>
              <input
                type="text"
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-black bg-gray-50/10"
                placeholder="Ej. Recepción Principal"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Guardando...' : 'Finalizar y Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

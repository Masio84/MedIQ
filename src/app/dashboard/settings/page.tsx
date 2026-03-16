'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Camera, User } from 'lucide-react';
import Image from 'next/image';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [profile, setProfile] = useState<any>({
    name: '',
    phone: '',
    medical_license: '',
    consult_schedule: '',
    base_price: 0,
    discount_min: 0,
    discount_max: 0,
    increment_min: 0,
    increment_max: 0,
    avatar_url: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' }>({ isOpen: false, title: '', message: '', type: 'success' });

  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setProfile({
          ...data,
          base_price: Number(data.base_price || 0),
          discount_min: Number(data.discount_min || 0),
          discount_max: Number(data.discount_max || 0),
          increment_min: Number(data.increment_min || 0),
          increment_max: Number(data.increment_max || 0),
        });
        if (data.avatar_url) setPreview(data.avatar_url);
      }
      setFetching(false);
    };

    fetchProfile();
  }, [supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userId = profile.id;
      if (!userId) throw new Error('No autenticado');
      
      const user = { id: userId }; // backwards compatibility mapping node setups

      let avatarUrl = profile.avatar_url;

      if (file) {
        // 1. Enviar archivo a nuestra API que gestiona el Bucket y Service Role
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const uploadRes = await fetch('/api/storage/upload-avatar', {
          method: 'POST',
          body: uploadFormData,
        });

        const uploadResult = await uploadRes.json();

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Error al subir la imagen.');
        }

        avatarUrl = uploadResult.publicUrl;
      }

      const updateData: any = {
        name: profile.name,
        phone: profile.phone,
        avatar_url: avatarUrl,
      };

      if (profile.role === 'doctor') {
        updateData.medical_license = profile.medical_license || '';
        updateData.consult_schedule = profile.consult_schedule || '';
        updateData.base_price = profile.base_price || 0;
        updateData.discount_min = profile.discount_min || 0;
        updateData.discount_max = profile.discount_max || 0;
        updateData.increment_min = profile.increment_min || 0;
        updateData.increment_max = profile.increment_max || 0;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (updateError) throw updateError;
      setFeedback({ isOpen: true, title: '¡Éxito!', message: 'Configuración guardada exitosamente.', type: 'success' });
    } catch (err: any) {
      setError(err.message || 'Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  const isDoctor = profile.role === 'doctor';

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Configuración {profile.role === 'admin' ? 'del Administrador' : isDoctor ? 'del Médico' : 'de la Asistente'}
        </h1>
        <p className="text-sm text-gray-500">Aquí puedes configurar tu información personal y foto de perfil.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center">
          <label className="block text-sm font-medium text-gray-700 mb-4 text-center">Foto de Perfil</label>
          <div className="relative w-24 h-24 rounded-full bg-gray-50 border-2 border-gray-100 flex items-center justify-center overflow-hidden">
            {preview ? (
              <Image src={preview} alt="Profile" className="object-cover w-full h-full" width={96} height={96} />
            ) : (
              <User size={40} className="text-gray-300" />
            )}
            <label className="absolute bottom-1 right-1 p-1.5 bg-gray-900 text-white rounded-full cursor-pointer hover:bg-gray-800 shadow-sm">
              <Camera size={14} />
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-2">Formatos: JPG, PNG. Máx 2MB.</p>
        </div>

        {/* Informacion Personal */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-2">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre Completo</label>
              <input
                type="text"
                className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            {isDoctor ? (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Cédula Profesional/Licencia</label>
                <input
                  type="text"
                  placeholder="Ej: CED123456"
                  className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
                  value={profile.medical_license || ''}
                  onChange={(e) => setProfile({ ...profile, medical_license: e.target.value })}
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Correo Electrónico (Solo Lectura)</label>
                <input
                  type="email"
                  disabled
                  className="w-full px-4 py-2 text-sm border border-gray-50 bg-gray-50/50 text-gray-400 rounded-lg focus:outline-none cursor-not-allowed"
                  value={profile.email || ''}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono</label>
              <input
                type="tel"
                className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
            {isDoctor && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Horario de Consulta</label>
                <input
                  type="text"
                  placeholder="Ej: Lunes a Viernes 9:00 - 18:00"
                  className="w-full px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
                  value={profile.consult_schedule || ''}
                  onChange={(e) => setProfile({ ...profile, consult_schedule: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>

        {/* Precios y Reglas - Solo médicos */}
        {isDoctor && (
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-2">Reglas de Costo</h2>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Costo de Consulta Base ($)</label>
              <input
                type="number"
                step="0.01"
                className="w-full md:w-1/3 px-4 py-2 text-sm border border-gray-100 rounded-lg focus:outline-none"
                value={profile.base_price}
                onChange={(e) => setProfile({ ...profile, base_price: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-50 pt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rangos de Descuento</label>
                <div className="flex gap-2">
                  <div>
                    <label className="block text-xs text-gray-400">Desde ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-1 text-sm border border-gray-100 rounded-lg"
                      value={profile.discount_min}
                      onChange={(e) => setProfile({ ...profile, discount_min: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400">Hasta ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-1 text-sm border border-gray-100 rounded-lg"
                      value={profile.discount_max}
                      onChange={(e) => setProfile({ ...profile, discount_max: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rangos de Incremento</label>
                <div className="flex gap-2">
                  <div>
                    <label className="block text-xs text-gray-400">Desde ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-1 text-sm border border-gray-100 rounded-lg"
                      value={profile.increment_min}
                      onChange={(e) => setProfile({ ...profile, increment_min: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400">Hasta ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-1 text-sm border border-gray-100 rounded-lg"
                      value={profile.increment_max}
                      onChange={(e) => setProfile({ ...profile, increment_max: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </form>
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
                type="button"
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

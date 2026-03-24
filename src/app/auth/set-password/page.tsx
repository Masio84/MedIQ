"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { Eye, EyeOff, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleSession = async () => {
      try {
        const hash = window.location.hash;
        if (!hash) {
          setError('No se proporcionó un token de activación válido.');
          setSessionLoading(false);
          return;
        }

        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (!access_token || !refresh_token) {
          setError('Token de activación inválido o corrupto.');
          setSessionLoading(false);
          return;
        }

        // Autenticar la sesión localmente con el token de invitación
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sessionError) {
          setError('El enlace de invitación ha expirado o ya fue utilizado.');
        }
      } catch (err) {
        setError('Ocurrió un error al procesar el enlace.');
      } finally {
        setSessionLoading(false);
      }
    };

    handleSession();
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
         router.push('/setup');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
        <p className="text-xs text-gray-500 font-medium">Validando invitación...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-gray-100/30 border border-gray-100 p-8">
        <div className="text-center mb-8">
          <Image 
            src="/logo_v1.png" 
            alt="MedIQ" 
            width={140} 
            height={50} 
            className="mx-auto mb-4 object-contain"
            priority
            style={{ width: 'auto', height: 'auto' }}
          />
          <h1 className="text-xl font-black tracking-tight text-gray-900">
             Bienvenido a MedIQ
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-medium">
             Establece tu contraseña para activar tu cuenta
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 flex items-center gap-2 font-medium">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center py-4 space-y-3">
             <div className="mx-auto w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                <CheckCircle size={24} />
             </div>
             <p className="text-sm font-bold text-gray-900">¡Contraseña establecida!</p>
             <p className="text-xs text-gray-400">Redirigiendo a tu panel de control...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xxs font-black text-gray-500 uppercase tracking-wider mb-1">Nueva Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-black pr-10 bg-gray-50/50"
                  placeholder="••••••••"
                  disabled={!!error}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 focus:outline-none"
                  disabled={!!error}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xxs font-black text-gray-500 uppercase tracking-wider mb-1">Confirmar Contraseña</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-black bg-gray-50/50"
                placeholder="••••••••"
                disabled={!!error}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!error}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Activando Cuenta...' : 'Crear Cuenta y Acceder'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

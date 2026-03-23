'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const disabledReason = searchParams.get('reason') === 'account_disabled';
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Forzar cierre de sesión anterior antes de nuevo login
      await supabase.auth.signOut();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      router.refresh();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-gray-100/50 border border-gray-100 p-8">
        <div className="text-center mb-8">
          <Image 
            src="/logo_v1.png" 
            alt="MedIQ" 
            width={160} 
            height={60} 
            className="mx-auto mb-4 object-contain"
            priority
            style={{ width: 'auto', height: 'auto' }}
          />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Iniciar Sesión
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Plataforma Médica MedIQ (BETA)
          </p>
        </div>
        
        {disabledReason && (
          <div className="mb-4 p-3 bg-amber-50 text-amber-700 text-xs rounded-lg border border-amber-100 font-bold">
            Tu cuenta ha sido desactivada. Contacta al administrador de tu clínica.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 text-black"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 text-black pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

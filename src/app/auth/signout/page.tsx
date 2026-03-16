'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LogOut } from 'lucide-react';
import Image from 'next/image';

export default function SignOutPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const doSignOut = async () => {
      // 1. Sign out from Supabase (cleans cookies & session)
      await supabase.auth.signOut();
      
      // 2. Clear local storage just in case
      localStorage.clear();

      // 3. Redirect to login following a short delay for UX smoothness
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    };

    doSignOut();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full text-center space-y-6 flex flex-col items-center">
        <Image 
          src="/logo.png" 
          alt="AssistMed AI" 
          width={120} 
          height={35} 
          className="object-contain"
          priority
        />

        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center animate-pulse mt-2">
          <LogOut size={24} />
        </div>

        <div>
          <h3 className="font-bold text-lg text-gray-900">Cerrando Sesión...</h3>
          <p className="text-sm text-gray-400 mt-1 leading-relaxed">Por favor espera un momento, estamos desconectando tu cuenta de forma segura.</p>
        </div>

        {/* Loading Spinner Dots */}
        <div className="flex gap-1 items-center justify-center">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}

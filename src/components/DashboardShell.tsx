'use client';

import { useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import SidebarLinks from '@/components/SidebarLinks';

export default function DashboardShell({
  children,
  profile,
  role,
}: {
  children: React.ReactNode;
  profile: any;
  role: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900 overflow-hidden relative">
      {/* Sidebar - Desktop & Mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#2f6cf2] flex flex-col h-full transform 
        md:relative md:translate-x-0 transition-transform duration-300 ease-in-out shadow-lg md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between md:justify-start gap-2 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-black text-white tracking-tight flex items-center">
              AssistMed<span className="text-blue-200">.</span><span className="text-teal-300 text-sm font-bold">+</span>
            </span>
          </Link>
          <button 
            className="p-1 rounded-lg text-white/50 hover:bg-white/10 md:hidden"
            onClick={toggleSidebar}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center text-center space-y-2 relative group border-b border-white/5">
          {profile?.avatar_url ? (
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-md transition-transform duration-300 group-hover:scale-105">
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white font-black text-lg shadow-inner border border-white/10">
              {profile?.name ? profile.name[0].toUpperCase() : '?'}
            </div>
          )}

          <div className="space-y-0.5">
            <p className="text-sm font-bold text-white tracking-tight">
              {profile?.name || 'Usuario'}
            </p>
            
            <span className="text-[9px] font-bold uppercase tracking-widest text-teal-300 bg-white/10 px-2 py-0.5 rounded-full inline-block">
              {role === 'admin' ? 'Administrador' : role === 'doctor' ? 'Doctor' : 'Asistente'}
            </span>
          </div>
        </div>


        {/* Sidebar Navigation */}
        <SidebarLinks />

        {/* Footer/Aviso Legal */}
        <div className="p-4 border-t border-white/5 text-center mt-auto">
          <Link href="/legal" className="text-xs text-blue-100/50 hover:text-white transition-colors">
            Aviso Legal
          </Link>
        </div>

        {/* Logout Button Section at Bottom */}
        <div className="p-3 border-t border-white/5 bg-white/5">
          <Link href="/auth/signout" className="flex items-center justify-center gap-2 py-2 px-3 w-full hover:bg-white/10 rounded-xl text-blue-100 hover:text-white transition-all font-semibold text-xs border border-transparent hover:border-white/10">
            <LogOut size={14} />
            Cerrar Sesión
          </Link>
        </div>
      </aside>


      {/* Backdrop for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/25 backdrop-blur-sm z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white md:rounded-l-[32px] md:shadow-[0_0_20px_rgba(0,0,0,0.02)] z-10">
        <header className="h-16 bg-white border-b border-gray-50/80 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              className="p-2 -ml-2 rounded-lg text-gray-400 hover:bg-gray-50 md:hidden"
              onClick={toggleSidebar}
            >
              <Menu size={22} />
            </button>
            <h2 className="text-xs font-medium text-gray-400">Sistema Beta AssistMed AI</h2>
          </div>
          {profile?.avatar_url && (
            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100">
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}


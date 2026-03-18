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
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col h-full transform 
        md:relative md:translate-x-0 transition-transform duration-300 ease-in-out shadow-lg md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between md:justify-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image 
              src="/logo_v1.png" 
              alt="MedIQ" 
              width={140} 
              height={40} 
              className="object-contain"
              priority
            />
          </Link>
          <button 
            className="p-1 rounded-lg text-gray-400 hover:bg-gray-50 md:hidden"
            onClick={toggleSidebar}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 border-b border-gray-100 bg-gray-50/20 flex flex-col items-center text-center space-y-3 relative group">
          {profile?.avatar_url ? (
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md ring-2 ring-gray-100/50 transition-transform duration-300 group-hover:scale-105">
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-black text-xl shadow-inner border border-gray-100">
              {profile?.name ? profile.name[0].toUpperCase() : '?'}
            </div>
          )}

          <div className="space-y-1">
            <p className="text-sm font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent tracking-tight">
              {profile?.name || 'Usuario'}
            </p>
            
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-full inline-block">
              {role === 'admin' ? 'Administrador' : role === 'doctor' ? 'Doctor' : 'Asistente'}
            </span>

            {profile?.medical_license && (
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                Cédula: <span className="text-gray-600 font-semibold">{profile.medical_license}</span>
              </p>
            )}
          </div>
        </div>

        {/* Sidebar Navigation */}
        <SidebarLinks />

        {/* Footer/Aviso Legal */}
        <div className="p-4 border-t border-gray-50 text-center mt-auto">
          <Link href="/legal" className="text-xs text-gray-400 hover:text-gray-900 transition-colors">
            Aviso Legal
          </Link>
        </div>

        {/* Logout Button Section at Bottom */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/50">
          <Link href="/auth/signout" className="flex items-center justify-center gap-2 py-2 px-3 w-full hover:bg-red-50/80 rounded-lg text-gray-500 hover:text-red-600 transition-all font-semibold text-xs border border-transparent hover:border-red-100">
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
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-50/80 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              className="p-2 -ml-2 rounded-lg text-gray-400 hover:bg-gray-50 md:hidden"
              onClick={toggleSidebar}
            >
              <Menu size={22} />
            </button>
            <h2 className="text-xs font-medium text-gray-400">Sistema Beta MedIQ</h2>
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


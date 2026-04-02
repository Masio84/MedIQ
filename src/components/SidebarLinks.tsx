'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard, 
  ShieldCheck, 
  Calendar, 
  FolderOpen, 
  Stethoscope, 
  FileCheck, 
  Archive,
  ChevronDown,
  ChevronRight,
  FilePenLine,
  FilePlus2,
  Settings
} from 'lucide-react';
import { useRole } from '@/context/RoleContext';

interface SidebarLinksProps {
  isMini?: boolean;
}

export default function SidebarLinks({ isMini = false }: SidebarLinksProps) {
  const { role } = useRole();
  const pathname = usePathname();
  const [isPrescriptionsOpen, setIsPrescriptionsOpen] = useState(false);
  const [isCertificatesOpen, setIsCertificatesOpen] = useState(false);

  // Auto-expand if the current path is within prescriptions
  useEffect(() => {
    if (pathname.startsWith('/dashboard/prescriptions') && !isMini) {
      setIsPrescriptionsOpen(true);
    }
  }, [pathname, isMini]);

  // Auto-expand if the current path is within certificates
  useEffect(() => {
    if (pathname.startsWith('/dashboard/certificates') && !isMini) {
      setIsCertificatesOpen(true);
    }
  }, [pathname, isMini]);

  const links = [
    {
      href: '/superadmin',
      label: 'Panel SuperAdmin',
      icon: ShieldCheck,
      roles: ['superadmin'],
    },
    {
      href: '/superadmin/manage',
      label: 'Gestión de Plataforma',
      icon: Users,
      roles: ['superadmin'],
    },
    {
      href: '/superadmin/logs',
      label: 'Auditoría NOM-024',
      icon: FileText,
      roles: ['superadmin'],
    },
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'doctor', 'assistant'],
    },
    {
      href: '/dashboard/agenda',
      label: 'Agenda',
      icon: Calendar,
      roles: ['admin', 'assistant', 'doctor'],
    },
    {
      href: '/dashboard/admin',
      label: 'Panel de Administrador',
      icon: ShieldCheck,
      roles: ['admin'],
    },
    {
      href: '/dashboard/patients',
      label: 'Expediente Digital',
      icon: FolderOpen,
      roles: ['doctor'],
    },
    {
      href: '/dashboard/consultations',
      label: 'Consultas',
      icon: Stethoscope,
      roles: ['doctor'],
    },
    {
      label: 'Certificados',
      icon: FileCheck,
      roles: ['doctor', 'assistant'],
      isSubmenu: true,
      isOpen: isCertificatesOpen && !isMini,
      onToggle: () => !isMini && setIsCertificatesOpen(!isCertificatesOpen),
      subItems: [
        {
          href: '/dashboard/certificates/new',
          label: 'Certificado Médico',
          icon: FilePlus2,
        },
        {
          href: '/dashboard/certificates/archive',
          label: 'Historial',
          icon: Archive,
        },
        {
          href: '/dashboard/certificates/editor',
          label: 'Editor de Plantillas',
          icon: FilePenLine,
        },
      ]
    },
    {
      label: 'Recetas',
      icon: FileText,
      roles: ['doctor'],
      isSubmenu: true,
      isOpen: isPrescriptionsOpen && !isMini,
      onToggle: () => !isMini && setIsPrescriptionsOpen(!isPrescriptionsOpen),
      subItems: [
        {
          href: '/dashboard/prescriptions/archive',
          label: 'Recetas Emitidas',
          icon: Archive,
        },
        {
          href: '/dashboard/prescriptions',
          label: 'Edición de Plantillas',
          icon: FilePenLine,
        },
      ]
    },
    {
      href: '/dashboard/billing',
      label: 'Facturación',
      icon: CreditCard,
      roles: ['admin', 'assistant'],
    },
    {
      href: '/dashboard/settings',
      label: 'Configuración',
      icon: Settings,
      roles: ['admin', 'doctor', 'assistant'],
    },
  ];

  return (
    <nav className={`flex-1 p-3 ${isMini ? 'space-y-4' : 'space-y-1'}`}>
      {links
        .filter((link) => link.roles.includes(role))
        .map((link) => {
          const Icon = link.icon;
          
          if (link.isSubmenu) {
            const hasActiveSubItem = link.subItems?.some(sub => pathname === sub.href);
            
            return (
              <div key={link.label} className="space-y-1">
                <button
                  onClick={link.onToggle}
                  title={isMini ? link.label : undefined}
                  className={`w-full flex items-center justify-between gap-3 text-sm font-medium rounded-lg transition-all ${
                    isMini ? 'px-0 py-2 justify-center' : 'px-4 py-3'
                  } ${
                    hasActiveSubItem || link.isOpen
                      ? 'bg-gray-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className={`flex items-center ${isMini ? 'justify-center' : 'gap-3'}`}>
                    <Icon size={20} className={hasActiveSubItem ? 'text-blue-500' : 'text-gray-400'} />
                    {!isMini && <span>{link.label}</span>}
                  </div>
                  {!isMini && (link.isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                </button>
                
                {link.isOpen && !isMini && (
                  <div className="ml-4 space-y-1 border-l border-gray-100 pl-2">
                    {link.subItems?.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = pathname === sub.href;
                      
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                            isSubActive
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <SubIcon size={16} className={isSubActive ? 'text-blue-500' : 'text-gray-400'} />
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href as string}
              title={isMini ? link.label : undefined}
              className={`flex items-center gap-3 text-sm font-medium rounded-lg transition-all ${
                isMini ? 'px-0 py-2 justify-center' : 'px-4 py-3'
              } ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-blue-500' : 'text-gray-400'} />
              {!isMini && <span>{link.label}</span>}
            </Link>
          );
        })}
    </nav>
  );
}



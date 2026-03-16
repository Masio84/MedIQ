'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, CreditCard, ShieldCheck, Calendar } from 'lucide-react';
import { useRole } from '@/context/RoleContext';

export default function SidebarLinks() {
  const { role } = useRole();
  const pathname = usePathname();

  const links = [
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
      label: 'Pacientes',
      icon: Users,
      roles: ['doctor'],
    },
    {
      href: '/dashboard/consultations',
      label: 'Consultas',
      icon: FileText,
      roles: ['doctor'],
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
      icon: Users, // Using appropriate icon if available, maybe Settings later
      roles: ['admin', 'doctor', 'assistant'],
    },

  ];

  return (
    <nav className="flex-1 p-4 space-y-1">
      {links
        .filter((link) => link.roles.includes(role))
        .map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-blue-500' : 'text-gray-400'} />
              {link.label}
            </Link>
          );
        })}
    </nav>
  );
}

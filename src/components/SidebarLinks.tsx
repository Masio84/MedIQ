import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, CreditCard, ShieldCheck, Calendar } from 'lucide-react';
import { useRole } from '@/context/RoleContext';
import { motion } from 'framer-motion';

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
      icon: Users,
      roles: ['admin', 'doctor', 'assistant'],
    },
  ];

  return (
    <nav className="flex-1 py-6 pl-1 pr-0 space-y-2 relative">
      {links
        .filter((link) => link.roles.includes(role))
        .map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-6 py-3.5 text-xs font-semibold rounded-l-full transition-colors duration-200 relative group w-full ${
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-blue-100 hover:text-white hover:bg-blue-700/50'
              }`}
            >
              {/* Animated Inner Curve Layered Backing */}
              {isActive && (
                <motion.div 
                  layoutId="activeNavPill"
                  className="absolute inset-0 z-0 active-nav-item"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              {/* Icon / Content strictly on Top Layer */}
              <Icon 
                size={18} 
                className={`z-10 transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-blue-200 group-hover:text-white'}`} 
              />
              <span className="z-10 transition-colors duration-200">{link.label}</span>
            </Link>
          );
        })}
    </nav>
  );
}


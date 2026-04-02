import Link from 'next/link';

const columns = [
  {
    title: 'Producto',
    links: [
      { label: 'Características', href: '#features' },
      { label: 'Planes', href: '#planes' },
      { label: 'Simulador ROI', href: '#simulador' },
      { label: 'Iniciar sesión', href: '/login' },
    ],
  },
  {
    title: 'Soporte',
    links: [
      { label: 'Contacto', href: '#contacto' },
      { label: 'WhatsApp', href: 'https://wa.me/524492347305' },
      { label: 'contacto@mediq.mx', href: 'mailto:contacto@mediq.mx' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Aviso de Privacidad', href: '/legal/privacidad' },
      { label: 'Términos de Uso', href: '/legal/terminos' },
      { label: 'Cumplimiento NOM-024', href: '/legal/nom-024' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="mb-4">
            <img
              src="/Logo_MedIQ_Transp.png"
              alt="MedIQ Logo"
              className="h-16 md:h-32 w-auto object-contain brightness-0 invert transition-opacity hover:opacity-80"
            />
          </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Sistema de gestión clínica inteligente, conforme a NOM-004 y NOM-024. Diseñado para el médico mexicano moderno.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-300 mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Masio Technologies & Digital Solutions. Todos los derechos reservados.
          </p>
          <div className="flex gap-2">
            <span className="px-2.5 py-1 bg-green-900/30 text-green-400 text-[10px] font-bold rounded-full border border-green-900/50">NOM-004 ✓</span>
            <span className="px-2.5 py-1 bg-blue-900/30 text-blue-400 text-[10px] font-bold rounded-full border border-blue-900/50">NOM-024 ✓</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

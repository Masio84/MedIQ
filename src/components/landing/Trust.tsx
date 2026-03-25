import { ShieldCheck, FileCheck, Lock, Stethoscope } from 'lucide-react';

const items = [
  { icon: FileCheck, label: 'NOM-004', desc: 'Expediente clínico digital' },
  { icon: ShieldCheck, label: 'NOM-024', desc: 'Auditoría automatizada' },
  { icon: Lock, label: 'Seguridad RLS', desc: 'Aislamiento de datos por clínica' },
  { icon: Stethoscope, label: 'COFEPRIS', desc: 'Trazabilidad legal completa' },
];

export default function Trust() {
  return (
    <section className="py-14 bg-white border-y border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <p className="text-center text-xs font-black uppercase tracking-widest text-gray-400 mb-8">
          Cumplimiento y seguridad garantizados
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-3 shadow-sm">
                  <Icon size={22} />
                </div>
                <div className="text-sm font-black text-gray-900">{item.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

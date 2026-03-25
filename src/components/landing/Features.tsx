'use client';

import { motion } from 'framer-motion';
import { FileText, Calendar, CreditCard, ShieldCheck, Sparkles, MessageSquare, Clipboard, Lock, Zap, Activity } from 'lucide-react';

const categories = [
  {
    label: 'Operación Clínica',
    color: 'blue',
    icon: Activity,
    items: [
      {
        icon: Clipboard,
        title: 'Expediente Clínico Digital',
        description: 'Cumplimiento NOM-004. Historiales organizados, seguros y listos para auditoría en cualquier momento.',
      },
      {
        icon: Calendar,
        title: 'Agenda Inteligente',
        description: 'Controla y bloquea horarios sin empalmes. Multi-médico, sin conflictos.',
      },
      {
        icon: FileText,
        title: 'Certificados en PDF',
        description: 'Genera certificados médicos institucionales en segundos, con firma y plantilla.',
      },
    ],
  },
  {
    label: 'Automatización',
    color: 'indigo',
    icon: Zap,
    items: [
      {
        icon: MessageSquare,
        title: 'Recordatorios WhatsApp',
        description: 'Notifica citas automáticamente al paciente. Reduce ausencias hasta un 40%.',
      },
      {
        icon: CreditCard,
        title: 'Control Financiero',
        description: 'Cobros, deudas, cortes de caja y CFDI sin errores humanos ni hojas de Excel.',
      },
      {
        icon: Sparkles,
        title: 'IA Clínica',
        description: 'Sugerencias de diagnóstico y seguimiento con Inteligencia Artificial como apoyo médico.',
      },
    ],
  },
  {
    label: 'Seguridad y Legal',
    color: 'green',
    icon: Lock,
    items: [
      {
        icon: ShieldCheck,
        title: 'Bitácora Inmutable NOM-024',
        description: 'Registro inalterable de todos los accesos y modificaciones al expediente.',
      },
      {
        icon: Lock,
        title: 'Seguridad RLS',
        description: 'Row Level Security en base de datos. Cada clínica solo ve su propia información.',
      },
      {
        icon: FileText,
        title: 'Protección Legal Médica',
        description: 'Cumplimiento COFEPRIS con trazabilidad total. El médico siempre tiene respaldo.',
      },
    ],
  },
];

const colorMap: Record<string, { bg: string; icon: string; border: string; label: string }> = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100', label: 'text-blue-600' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-100', label: 'text-indigo-600' },
  green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100', label: 'text-emerald-600' },
};

export default function Features() {
  return (
    <section id="features" className="py-24 bg-gray-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-3">Plataforma Completa</p>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Todo lo que tu consultorio necesita,<br className="hidden sm:block" /> en un solo lugar
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Reemplaza expedientes de papel, agendas en Excel y sistemas desconectados con una plataforma integrada y conforme a la NOM.
          </p>
        </div>

        <div className="space-y-12">
          {categories.map((cat, ci) => {
            const c = colorMap[cat.color];
            const CatIcon = cat.icon;
            return (
              <div key={ci}>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${c.bg} border ${c.border} mb-6`}>
                  <CatIcon size={14} className={c.icon} />
                  <span className={`text-xs font-bold uppercase tracking-wide ${c.label}`}>{cat.label}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {cat.items.map((feat, fi) => {
                    const Icon = feat.icon;
                    return (
                      <motion.div
                        key={fi}
                        whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(0,0,0,0.08)' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm cursor-default"
                      >
                        <div className={`h-11 w-11 rounded-xl ${c.bg} ${c.icon} flex items-center justify-center mb-4`}>
                          <Icon size={22} />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-2">{feat.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{feat.description}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

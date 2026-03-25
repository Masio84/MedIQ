'use client';

import { motion } from 'framer-motion';
import { Check, X, Star } from 'lucide-react';

const plans = [
  {
    name: 'Esencial',
    price: '$599',
    desc: 'Para consultorios de un solo médico que inician su digitalización.',
    features: [
      { label: '1 médico', included: true },
      { label: '1 asistente', included: true },
      { label: 'Hasta 150 pacientes', included: true },
      { label: 'Expediente digital', included: true },
      { label: 'Reportes básicos', included: true },
      { label: 'Finanzas y cobros', included: false },
      { label: 'IA clínica', included: false },
    ],
    btn: 'Contratar ahora',
    btnStyle: 'border border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700 bg-white',
    highlight: false,
  },
  {
    name: 'Consultorio',
    price: '$1,299',
    desc: 'El plan más completo para clínicas en crecimiento. Recomendado.',
    features: [
      { label: 'Hasta 3 médicos', included: true },
      { label: 'Hasta 2 asistentes', included: true },
      { label: 'Hasta 500 pacientes', included: true },
      { label: 'Expediente digital', included: true },
      { label: 'Reportes avanzados', included: true },
      { label: 'Finanzas y cobros', included: true },
      { label: 'IA clínica', included: false },
    ],
    btn: 'Contratar ahora',
    btnStyle: 'bg-white text-blue-700 font-black shadow-md hover:bg-blue-50',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'A cotizar',
    desc: 'Para hospitales y redes de clínicas con necesidades avanzadas.',
    features: [
      { label: '10+ médicos', included: true },
      { label: 'Asistentes ilimitados', included: true },
      { label: 'Pacientes ilimitados', included: true },
      { label: 'Expediente digital', included: true },
      { label: 'Reportes avanzados', included: true },
      { label: 'Finanzas y cobros', included: true },
      { label: 'IA clínica avanzada', included: true },
    ],
    btn: 'Solicitar demo',
    btnStyle: 'border border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700 bg-white',
    highlight: false,
  },
];

export default function Plans() {
  return (
    <section id="planes" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-3">Tarifas</p>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Planes claros, sin sorpresas
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-lg mx-auto">
            Elige el plan que se adapta al tamaño de tu consultorio. Cancela cuando quieras.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              whileHover={{ y: plan.highlight ? 0 : -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className={`relative flex flex-col rounded-3xl p-8 ${
                plan.highlight
                  ? 'bg-gradient-to-b from-blue-700 to-blue-800 text-white shadow-2xl shadow-blue-200 scale-[1.03]'
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1.5 bg-yellow-400 text-yellow-900 rounded-full text-xs font-black shadow">
                  <Star size={11} className="fill-yellow-900" /> Más popular
                </div>
              )}

              <div>
                <h3 className={`text-xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <p className={`text-sm mt-1 leading-snug ${plan.highlight ? 'text-blue-200' : 'text-gray-500'}`}>{plan.desc}</p>

                <div className="mt-6 mb-2">
                  <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                  {plan.price.startsWith('$') && (
                    <span className={`text-sm font-medium ml-1 ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>/mes</span>
                  )}
                </div>
              </div>

              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm">
                    {f.included
                      ? <Check size={15} className={plan.highlight ? 'text-green-300 shrink-0' : 'text-green-500 shrink-0'} />
                      : <X size={15} className={plan.highlight ? 'text-blue-400/50 shrink-0' : 'text-gray-300 shrink-0'} />
                    }
                    <span className={f.included
                      ? (plan.highlight ? 'text-white font-medium' : 'text-gray-700')
                      : (plan.highlight ? 'text-blue-300/50' : 'text-gray-300')
                    }>{f.label}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`mt-8 w-full py-3 rounded-xl font-bold text-sm transition-all ${plan.btnStyle}`}
              >
                {plan.btn}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

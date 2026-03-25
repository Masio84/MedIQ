'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Star } from 'lucide-react';

const plans = [
  {
    name: 'Esencial',
    price: 699,
    setup: 0,
    desc: '1 médico únicamente. Sin asistente clínico.',
    features: [
      { label: 'Expediente digital (NOM-004)', included: true },
      { label: 'Consultas con notas SOAP', included: true },
      { label: 'CIE-10/11 completo', included: true },
      { label: 'Receta electrónica PDF', included: true },
      { label: 'Certificados médicos', included: true },
      { label: 'Finanzas y cobros', included: true },
      { label: 'IA en diagnóstico', included: true },
      { label: 'Chat con asistente', included: false },
    ],
    btn: 'Contratar ahora',
    btnStyle: 'border border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700 bg-white',
    highlight: false,
    slug: 'esencial'
  },
  {
    name: 'Consultorio',
    price: 1000,
    setup: 1299,
    desc: '1 médico + 1 asistente vinculado al médico.',
    features: [
      { label: 'Todo lo del plan Esencial', included: true },
      { label: 'Hasta 500 pacientes', included: true },
      { label: 'Chat doctor-asistente en tiempo real', included: true },
      { label: 'Agenda compartida', included: true },
      { label: 'Panel de sala de espera', included: true },
      { label: 'Botón "Invitar asistente"', included: true },
    ],
    btn: 'Contratar ahora',
    btnStyle: 'bg-white text-blue-700 font-black shadow-md hover:bg-blue-50',
    highlight: true,
    slug: 'consultorio'
  },
  {
    name: 'Enterprise',
    price: null, // A cotizar
    setup: 0,
    desc: 'Para clínicas con 2 o más médicos. Intercomunicado con Panel Centralizado.',
    features: [
      { label: 'Todo lo de consultorios', included: true },
      { label: 'Administrador de Clínica', included: true },
      { label: 'Reportes consolidados por doctor', included: true },
      { label: 'Ranking de rentabilidad', included: true },
      { label: 'Logs NOM-024 para Cofepris', included: true },
      { label: 'IA clínica avanzada', included: true },
    ],
    btn: 'Contactar',
    btnStyle: 'border border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700 bg-white',
    highlight: false,
    slug: 'enterprise'
  },
];

export default function Plans() {
  const [isAnual, setIsAnual] = useState(false);

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

          <div className="mt-8 flex justify-center">
            <div className="bg-gray-100 p-1 rounded-full flex items-center border border-gray-200 shadow-inner">
              <button
                onClick={() => setIsAnual(false)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!isAnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Mensual
              </button>
              <button
                onClick={() => setIsAnual(true)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isAnual ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 flex items-center gap-1'}`}
              >
                Anual
                {!isAnual && <span className="text-[9px] bg-yellow-400 text-yellow-900 px-1 py-0.5 rounded-full font-black">-20%</span>}
              </button>
            </div>
          </div>
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
                  <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price 
                      ? `$${Math.round(isAnual ? plan.price * 0.8 : plan.price)}` 
                      : 'A cotizar'
                    }
                  </span>
                  {plan.price && (
                    <span className={`text-sm font-medium ml-1 ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>/mes</span>
                  )}
                </div>
                {plan.slug === 'esencial' && (
                  <p className={`text-[11px] font-semibold ${plan.highlight ? 'text-blue-100' : 'text-green-600'}`}>
                    Sin costo de setup
                  </p>
                )}
                {plan.slug === 'consultorio' && plan.setup > 0 && (
                  <p className={`text-[11px] ${plan.highlight ? 'text-blue-100' : 'text-gray-500'}`}>
                    Setup: <span className="font-bold">${plan.setup}</span> (pago único)
                  </p>
                )}
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
                onClick={() => {
                  if (plan.slug === 'enterprise') {
                    window.location.href = 'mailto:cumplimiento@masio.mx';
                  } else {
                    window.location.href = `/login?plan=${plan.slug}&anual=${isAnual}`;
                  }
                }}
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

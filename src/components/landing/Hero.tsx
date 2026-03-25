'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const badges = ['NOM-004 ✓', 'NOM-024 ✓', 'Seguridad RLS', 'COFEPRIS'];

export default function Hero() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[92vh] flex items-center bg-white overflow-hidden pt-16">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-50 opacity-60" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-indigo-50 opacity-40" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left Column — Copy */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            {/* Top badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full mb-6">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Sistema NOM-004 certificado</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-[1.1] tracking-tight">
              Gestiona tu clínica{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">con inteligencia</span>,{' '}
              no con papel
            </h1>

            <p className="mt-5 text-lg text-gray-600 leading-relaxed max-w-lg">
              Expediente electrónico, agenda sin empalmes, facturación y cumplimiento NOM en un solo sistema. Diseñado para el médico mexicano moderno.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => scrollTo('simulador')}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-colors text-base"
              >
                ✦ Calcular mi ROI
              </motion.button>
              <Link
                href="/login"
                className="px-6 py-3.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl transition-all text-base text-center hover:shadow"
              >
                Iniciar sesión →
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap gap-2">
              {badges.map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-semibold text-gray-600">
                  <CheckCircle size={12} className="text-green-500" /> {b}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right Column — Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="relative"
          >
            {/* Decorative floating elements */}
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-3xl" />
              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                {/* Browser bar mockup */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="ml-4 flex-1 bg-gray-200 rounded-full h-5 max-w-xs" />
                </div>
                <div className="aspect-[4/3] overflow-hidden">
                  <iframe
                    src="/simulador.html"
                    className="w-full h-full border-none scale-[0.85] origin-top-left"
                    style={{ width: '118%', height: '118%' }}
                    title="Dashboard Preview"
                  />
                </div>
              </div>
            </motion.div>

            {/* Floating stat card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute -bottom-4 -left-6 bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <span className="text-green-600 text-lg font-black">↑</span>
              </div>
              <div>
                <div className="text-[11px] text-gray-500 font-medium">Ahorro promedio</div>
                <div className="text-base font-black text-gray-900">$4,200/mes</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="absolute -top-4 -right-4 bg-blue-600 text-white rounded-xl shadow-lg px-4 py-3"
            >
              <div className="text-[11px] font-medium text-blue-100">ROI promedio</div>
              <div className="text-xl font-black">+180%</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

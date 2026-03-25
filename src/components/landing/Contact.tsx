'use client';

import { useState } from 'react';
import { MessageCircle, Mail, Clock } from 'lucide-react';

export default function Contact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section id="contacto" className="py-24 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Left — Info */}
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-3">Contacto</p>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              ¿Tienes preguntas?<br />Estamos aquí para ayudarte
            </h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Cuéntanos sobre tu consultorio y encontraremos el plan ideal para ti. Sin compromisos.
            </p>

            <div className="mt-8 space-y-4">
              <a
                href="https://wa.me/524492347305"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl hover:bg-green-100 transition-colors group"
              >
                <div className="h-10 w-10 rounded-xl bg-green-500 text-white flex items-center justify-center shrink-0">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">WhatsApp directo</div>
                  <div className="text-xs text-green-700">Haz clic para abrir chat</div>
                </div>
                <span className="ml-auto text-green-600 font-bold text-sm group-hover:translate-x-0.5 transition-transform">→</span>
              </a>

              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Correo electrónico</div>
                  <div className="text-xs text-blue-600">contacto@mediq.mx</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-100 border border-gray-200 rounded-2xl">
                <div className="h-10 w-10 rounded-xl bg-white border border-gray-200 text-gray-500 flex items-center justify-center shrink-0">
                  <Clock size={20} />
                </div>
                <div className="text-sm text-gray-600">
                  <strong className="text-gray-900">Respondemos en menos de 24 h</strong><br />
                  Lunes a Viernes 9:00–18:00 CST
                </div>
              </div>
            </div>
          </div>

          {/* Right — Form */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            {sent ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
                <h3 className="text-xl font-black text-gray-900">¡Mensaje enviado!</h3>
                <p className="text-gray-500 text-sm mt-2">Te contactaremos muy pronto.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Nombre completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Juan Pérez"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Correo electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="juan@clinica.com"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Mensaje</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tengo un consultorio con 2 médicos y quiero saber más sobre el plan Consultorio..."
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all hover:shadow-md text-sm"
                >
                  Enviar mensaje
                </button>
                <p className="text-center text-xs text-gray-400">Sin spam. Solo te contactamos con información relevante.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
            <ArrowLeft size={16} /> Volver a MedIQ
          </Link>
          <img src="/Logo_MedIQ_Transp.png" alt="MedIQ" className="h-7 w-auto object-contain brightness-0" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-gray-100 prose prose-blue max-w-none">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Aviso de Privacidad</h1>
          <p className="text-sm text-gray-500 mb-8">Última actualización: 24 de Marzo de 2025</p>

          <section className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              **Masio Technologies & Digital Solutions**, con domicilio en Aguascalientes, México, es responsable del tratamiento de sus datos personales, del uso que se le dé a los mismos y de su protección, de conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Datos Personales que Recabamos</h2>
            <p>Para la prestación de nuestros servicios de software (SaaS), recabamos los siguientes datos de los profesionales de la salud (médicos, asistentes, administradores):</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Nombre completo y Cédula Profesional.</li>
              <li>Correo electrónico y Teléfono de contacto.</li>
              <li>Especialidad médica y Datos fiscales para facturación.</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Datos de los Pacientes (Responsabilidad del Médico)</h2>
            <p>
              MedIQ actúa únicamente como **Encargado** del tratamiento de los datos clínicos de pacientes que los médicos (Responsables) ingresan en el sistema. Los datos clínicos y notas de evolución son propiedad del médico, hospedándose de manera cifrada bajo estrictos estándares de seguridad y en cumplimiento con la **NOM-004-SSA3-2012**.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Finalidades del Tratamiento</h2>
            <p>Los datos personales del profesional de la salud serán utilizados para:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Configuración y acceso a la plataforma MedIQ.</li>
              <li>Soporte técnico y comunicación sobre actualizaciones.</li>
              <li>Facturación y cobranza del servicio contratado.</li>
              <li>Cumplimiento de obligaciones legales aplicables.</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Derechos ARCO</h2>
            <p>
              Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (**Acceso**). Asimismo, es su derecho solicitar la corrección de su información (**Rectificación**); que la eliminemos de nuestros registros (**Cancelación**) o bien, oponerse al uso de los mismos para fines específicos (**Oposición**).
            </p>
            <p>Para el ejercicio de cualquiera de los derechos ARCO, usted deberá enviar una solicitud por escrito al correo electrónico: <span className="text-blue-600 font-medium">cumplimiento@masio.mx</span>.</p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Medidas de Seguridad</h2>
            <p>
              MedIQ implementa medidas de seguridad técnicas (cifrado SSL/TLS en tránsito y en reposo AES-256), administrativas y físicas para proteger sus datos personales contra daño, pérdida, alteración, destrucción o el uso, acceso o tratamiento no autorizado.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

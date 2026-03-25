import Link from 'next/link';
import { ArrowLeft, Award, ShieldCheck } from 'lucide-react';

export default function Nom024Page() {
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
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-0">Cumplimiento Normativo</h1>
              <p className="text-sm text-gray-500">Expediente Clínico Electrónico en México</p>
            </div>
          </div>

          <section className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              En **MedIQ**, la seguridad, la interoperabilidad y el marco legal son nuestra prioridad. Nuestra plataforma está diseñada desde cero para cumplir con las normativas oficiales que rigen la práctica médica en los Estados Unidos Mexicanos.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={18} className="text-green-600" />
                  <h3 className="font-bold text-gray-900">NOM-004-SSA3-2012</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Regula la integración y el resguardo del expediente clínico, obligando a conservar las notas médicas por un mínimo de 5 años.
                </p>
              </div>

              <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={18} className="text-blue-600" />
                  <h3 className="font-bold text-gray-900">NOM-024-SSA3-2012</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Establece los requisitos tecnológicos para el registro, intercambio y resguardo de información en salud mediante software.
                </p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">¿Cómo garantiza MedIQ el cumplimiento de la NOM-024?</h2>
            
            <h3 className="text-lg font-bold text-gray-900">1. Autenticación y Trazabilidad (Logs)</h3>
            <p>
              Cada acción en el sistema (creación de consultas, edición de notas, vistas de expediente) se registra en una bitácora auditables (**logs**) que contiene marca de tiempo invariable y el usuario responsable. No se permite la manipulación de registros históricos de consultas.
            </p>

            <h3 className="text-lg font-bold text-gray-900">2. Seguridad y Cifrado de Información</h3>
            <p>
              Todos los datos están protegidos bajo cifrado **AES-256** en reposo y conexiones seguras **SSL/TLS** en tránsito, previniendo accesos no autorizados y garantizando la confidencialidad de la información clínica del paciente.
            </p>

            <h3 className="text-lg font-bold text-gray-900">3. Interoperabilidad (Catálogos CIE)</h3>
            <p>
              Para el llenado de notas y diagnósticos, MedIQ integra oficialmente los catálogos internacionales de enfermedades **CIE-10** y **CIE-11** exigidos por la Secretaría de Salud para mantener estándares de comunicación homologados.
            </p>

            <h3 className="text-lg font-bold text-gray-900">4. Firma Electrónica y Recetas</h3>
            <p>
              La generación de recetas médicas vincula automáticamente la cédula profesional del médico tratante y su firma autógrafa digitalizada, cumpliendo con los estándares de validez oficial para farmacias.
            </p>

            <div className="mt-12 bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start gap-4">
              <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 text-sm mb-1">Nota de Cumplimiento Cofepris</h4>
                <p className="text-xs text-blue-800/80 leading-relaxed">
                  MedIQ ofrece a las instituciones médicas la descarga de reportes y logs necesarios para sus procesos de certificación ante el Consejo de Salubridad General (CSG) y COFEPRIS.
                </p>
              </div>
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}

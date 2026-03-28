import Link from 'next/link';
import { ShieldAlert, Lock, BookOpen, Copyright, Server } from 'lucide-react';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 h-16 flex items-center px-8 justify-between">
        <span className="font-bold text-gray-900">MedIQ</span>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          Volver
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto p-8 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Aviso Legal y Términos de Uso</h1>
          <p className="text-sm text-gray-500 mt-2">Última actualización: Marzo 2026</p>
        </div>

        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-gray-900">
            <ShieldAlert className="text-amber-500" size={24} />
            <h2 className="text-xl font-bold">1. Descargo de Responsabilidad de IA (AI Disclaimer)</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            La inteligencia artificial (IA) integrada en MedIQ **NO genera diagnósticos médicos reales ni prescribe tratamientos** de forma Autónoma. 
            Todas las sugerencias de síntomas, diagnósticos y tratamientos son generadas con fines de apoyo y referencia auxiliar únicamente.
            La responsabilidad final de la evaluación del paciente, diagnóstico y prescripción médica recae exclusivamente en el médico colegiado y autorizado que utiliza la plataforma. La plataforma no sustituye el juicio clínico profesional.
          </p>
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-gray-900">
            <Lock className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold">2. Privacidad de Datos del Paciente</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Garantizamos la confidencialidad absoluta de los datos médicos proporcionados. Los registros de salud de los pacientes se almacenan en servidores cifrados y seguros, cumpliendo con las mejores prácticas internacionales de protección de datos de salud. 
            Esta información es de uso exclusivo para el expediente clínico del centro médico tratante y no será compartida, vendida ni utilizada para fines comerciales.
          </p>
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-gray-900">
            <BookOpen className="text-green-500" size={24} />
            <h2 className="text-xl font-bold">3. Términos de Uso del Sistema</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            El sistema **MedIQ** es una herramienta de soporte clínico y gestión médica. Al utilizar la plataforma, el personal médico y administrativo se compromete a hacer uso de ella dentro del marco legal vigente de la práctica médica. El sistema no proporciona atención de emergencia y no debe ser utilizado en situaciones críticas de riesgo de vida de forma exclusiva.
          </p>
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-gray-900">
            <Copyright className="text-purple-500" size={24} />
            <h2 className="text-xl font-bold">4. Derechos de Autor y Propiedad</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Todos los derechos de software, interfaces, algoritmos de sugerencia AI, y arquitectura del sistema de **MedIQ** pertenecen a sus creadores. Queda estrictamente prohibida la copia, reproducción, redistribución o ingeniería inversa de cualquier componente del sistema sin una autorización expresa por escrito.
          </p>
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-gray-900">
            <Server className="text-gray-500" size={24} />
            <h2 className="text-xl font-bold">5. Funcionamiento General</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            MedIQ funciona almacenando expedientes clínicos de pacientes e interactuando con módulos de consulta y facturación que permiten coordinar de forma óptima el flujo de trabajo entre médicos y asistentes. Las herramientas de IA son exclusivamente módulos auxiliares que potencian el registro de la información.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-gray-100 bg-white flex items-center justify-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} MedIQ. Todos los derechos reservados.
      </footer>
    </div>
  );
}

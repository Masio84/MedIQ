import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TerminosPage() {
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
          <h1 className="text-3xl font-black text-gray-900 mb-2">Términos y Condiciones de Uso</h1>
          <p className="text-sm text-gray-500 mb-8">Última actualización: 24 de Marzo de 2025</p>

          <section className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              Bienvenido a **MedIQ**, una plataforma de software como servicio (SaaS) propiedad de **Masio Technologies & Digital Solutions**. Al registrarse, acceder y utilizar este sitio web o las aplicaciones de MedIQ, usted acepta estar sujeto a estos Términos y Condiciones.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Licencia de Uso</h2>
            <p>
              MedIQ otorga al Usuario una licencia no exclusiva, intransferible y revocable para utilizar la plataforma de acuerdo con el plan de suscripción contratado (Esencial, Consultorio, Enterprise), con el único propósito de gestionar expedientes clínicos y administración de consultorios médicos.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Registro y Responsabilidad de Cuentas</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>El usuario debe ser un profesional de la salud legalmente facultado (con Cédula Profesional) para ejercer la medicina en México.</li>
              <li>Usted es el único responsable de mantener la confidencialidad de sus credenciales de acceso y de cualquier actividad que ocurra bajo su cuenta.</li>
              <li>Está estrictamente prohibido compartir accesos corporativos o "múltiples" con una sola cuenta médica.</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Suscripción, Pagos y Cancelaciones</h2>
            <p>El uso de MedIQ está sujeto al pago de una tarifa recurrente mensual o anual de acuerdo al plan elegido.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>**Cargos**: Los pagos se procesan de forma automatizada mediante tarjeta de crédito/débito o transferencia.</li>
              <li>**Cancelación**: El profesional de la salud puede cancelar su suscripción en cualquier momento desde su panel de facturación. No se realizarán reembolsos por periodos ya facturados.</li>
              <li>**Resguardo de Información**: En caso de cancelación, MedIQ guardará la información del expediente clínico hasta por un periodo de cinco años conforme a la ley, garantizando al médico la descarga de sus expedientes.</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Propiedad de los Datos</h2>
            <p>
              Toda la información clínica subida por el médico sobre sus pacientes es de **exclusiva propiedad del médico**. MedIQ no tiene ningún derecho de propiedad, uso comercial o divulgación sobre estos datos clínicos, actuando solo como proveedor de infraestructura segura.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Limitación de Responsabilidad</h2>
            <p>
              MedIQ es una herramienta de apoyo a la gestión médica. El diagnóstico, el tratamiento y la atención médica son de exclusiva responsabilidad del profesional de la salud. MedIQ no se responsabiliza por errores médicos o malas prácticas derivadas de la interpretación del software.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

import { useCertificateStore } from '../../store/certificate-template.store';
import { replaceCertificateVariables } from '../../utils/cert-variable-engine';

export default function CertPatientBlock({ mockData }: { mockData?: any }) {
  const { template } = useCertificateStore();
  const block = template.blocks.find(b => b.type === 'patient');

  if (!block || !block.enabled) return null;

  const contentConfig = block.contentConfig || {};
  const fields = contentConfig.fields || ['name', 'age', 'gender', 'folio', 'date'];

  const patientName = replaceCertificateVariables('{{patient_name}}', mockData);
  const patientAge = replaceCertificateVariables('{{patient_age}}', mockData);
  const patientGender = replaceCertificateVariables('{{patient_gender}}', mockData);
  const patientFolio = replaceCertificateVariables('{{patient_folio}}', mockData);
  const patientDate = replaceCertificateVariables('{{patient_date}}', mockData);

  return (
    <div className="w-full mb-8 border border-gray-200 rounded-xl overflow-hidden shrink-0 group relative">
      <div className="bg-gray-50/50 px-4 py-2 border-b border-gray-100 flex justify-between items-center text-[10px] uppercase tracking-wider font-bold text-gray-500">
        <span>Datos del Paciente</span>
        {fields.includes('folio') && (
          <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">Folio: {patientFolio}</span>
        )}
      </div>
      
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-6 text-sm">
        {fields.includes('name') && (
          <div className="col-span-full md:col-span-2">
            <span className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-1">Nombre Completo</span>
            <span className="font-semibold text-gray-900 leading-tight block">{patientName}</span>
          </div>
        )}
        
        {fields.includes('age') && (
          <div>
            <span className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-1">Edad</span>
            <span className="font-medium text-gray-800 tabular-nums">{patientAge} años</span>
          </div>
        )}
        
        {fields.includes('gender') && (
          <div>
            <span className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-1">Sexo</span>
            <span className="font-medium text-gray-800">{patientGender}</span>
          </div>
        )}
        
        {fields.includes('date') && (
          <div className="col-span-full pt-3 mt-1 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[10px] text-gray-400">Fecha de expedición:</span>
            <span className="font-medium text-gray-800">{patientDate}</span>
          </div>
        )}
      </div>
    </div>
  );
}

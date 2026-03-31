import { useCertificateStore } from '../../store/certificate-template.store';
import { replaceCertificateVariables } from '../../utils/cert-variable-engine';

export default function CertBodyBlock({ mockData }: { mockData?: any }) {
  const { template } = useCertificateStore();
  const block = template.blocks.find(b => b.type === 'body');

  if (!block || !block.enabled) return null;

  const contentConfig = block.contentConfig || {};
  const prefix = replaceCertificateVariables(contentConfig.prefix || 'A quien corresponda:', mockData);
  const showPurpose = contentConfig.showPurpose !== false;
  
  // Use mockData properties if they exist, or fallback to reasonable defaults
  const purpose = mockData?.purpose || 'Evaluación de Salud General';
  const findings = mockData?.findings || 'Paciente presenta parámetros cardiovasculares, respiratorios y neurológicos dentro de la nomalidad. Sin evidencia clínica de patologías infectocontagiosas actuales.';
  const conclusion = mockData?.conclusion || 'El paciente se encuentra APTO para las actividades que al interesado convengan.';
  const validDays = mockData?.validDays || 30;

  return (
    <div className="w-full flex-1 mb-8 shrink-0 min-h-[150px] relative group text-justify leading-relaxed text-gray-800 text-sm">
      <div className="mb-6 font-medium whitespace-pre-wrap">{prefix}</div>
      
      {showPurpose && (
        <div className="mb-4">
          <span className="font-bold text-[var(--primary-color)]">Motivo del certificado:</span> {purpose}
        </div>
      )}
      
      <div className="mb-4">
        <span className="font-bold text-[var(--primary-color)]">Hallazgos clínicos:</span> {findings}
      </div>

      <div className="mt-8 mb-4 p-4 bg-gray-50/80 rounded-lg border border-gray-100 shadow-sm">
        <span className="font-bold text-gray-900 block mb-1">Conclusión:</span> 
        <span className="font-semibold">{conclusion}</span>
      </div>

      {validDays > 0 && (
        <div className="mt-6 text-xs text-gray-500 italic">
          * Este certificado tiene una vigencia de {validDays} días a partir de su fecha de expedición.
        </div>
      )}
    </div>
  );
}

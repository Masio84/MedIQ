import { useCertificateStore } from '../../store/certificate-template.store';
import { replaceCertificateVariables } from '../../utils/cert-variable-engine';

export default function CertDoctorBlock({ mockData }: { mockData?: any }) {
  const { template } = useCertificateStore();
  const block = template.blocks.find(b => b.type === 'doctor');

  if (!block || !block.enabled) return null;

  const contentConfig = block.contentConfig || {};
  const alignment = contentConfig.alignment || 'right';
  const showSpecialty = contentConfig.showSpecialty !== false;

  const rawDoctorName = '{{doctor_name}}';
  const rawSpecialty = '{{doctor_specialty}}';
  const rawCedula = '{{doctor_cedula}}';

  const doctorName = replaceCertificateVariables(rawDoctorName, mockData);
  const specialty = replaceCertificateVariables(rawSpecialty, mockData);
  const cedula = replaceCertificateVariables(rawCedula, mockData);

  const alignmentClass = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end'
  }[alignment as 'left' | 'center' | 'right'] || 'text-right items-end';

  return (
    <div className={`flex flex-col w-full mb-6 ${alignmentClass}`}>
      <div className="bg-[var(--primary-color)]/5 px-4 py-2 rounded-lg border-l-2 border-[var(--primary-color)] inline-flex flex-col">
        <h3 className="text-base font-bold text-gray-900 uppercase">{doctorName}</h3>
        {showSpecialty && (
          <p className="text-xs font-semibold text-[var(--primary-color)] uppercase tracking-wide mt-0.5">{specialty}</p>
        )}
        <p className="text-[10px] text-gray-500 font-mono mt-1">Cédula: {cedula}</p>
      </div>
    </div>
  );
}

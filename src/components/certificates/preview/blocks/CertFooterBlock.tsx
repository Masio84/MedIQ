import { useCertificateStore } from '../../store/certificate-template.store';
import { replaceCertificateVariables } from '../../utils/cert-variable-engine';

export default function CertFooterBlock({ mockData }: { mockData?: any }) {
  const { template } = useCertificateStore();
  const block = template.blocks.find(b => b.type === 'footer');

  if (!block || !block.enabled) return null;

  const contentConfig = block.contentConfig || {};
  const text = replaceCertificateVariables(contentConfig.text || '', mockData);

  return (
    <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col items-center justify-center w-full relative z-10 bg-white group shrink-0">
      <p className="text-[9px] text-center text-[var(--text-color)] font-medium max-w-[80%] mx-auto opacity-70 leading-relaxed uppercase tracking-wider">
        {text}
      </p>
    </div>
  );
}

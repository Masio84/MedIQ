import { useCertificateStore } from '../../store/certificate-template.store';
import { replaceCertificateVariables, getCertificateVariableDataMap } from '../../utils/cert-variable-engine';

export default function CertSignatureBlock({ mockData }: { mockData?: any }) {
  const { template } = useCertificateStore();
  const block = template.blocks.find(b => b.type === 'signature');
  const { signature, seal } = template.branding;

  if (!block || !block.enabled) return null;

  const contentConfig = block.contentConfig || {};
  const alignment = contentConfig.position || 'center';
  const showSeal = contentConfig.showSeal !== false;

  const dataMap = getCertificateVariableDataMap(mockData);

  const alignmentWrapper = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  }[alignment as 'left' | 'center' | 'right'] || 'justify-center';

  const textAlignment = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[alignment as 'left' | 'center' | 'right'] || 'text-center';

  const sealSize = seal?.width || 120;

  return (
    <div className={`mt-12 flex w-full ${alignmentWrapper} gap-8 items-end`}>
      <div className={`relative flex flex-col items-center min-w-[250px] ${textAlignment}`}>
        {/* Seal */}
        {showSeal && seal?.enabled !== false && (seal?.url || seal?.textConfig) && (
          <div 
            className="absolute z-0 mix-blend-multiply opacity-80 pointer-events-none select-none transition-transform flex-shrink-0"
            style={{ 
              width: `${seal?.width || 120}px`,
              height: `${seal?.width || 120}px`,
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${seal?.offsetX || 60}px), calc(-50% - ${seal?.offsetY || 60}px)) rotate(${seal?.rotation || 0}deg)`
            }}
          >
            {seal.textConfig ? (
              <div 
                className="w-full h-full rounded-full flex flex-col items-center justify-center text-center overflow-hidden aspect-square"
                style={{ 
                  borderColor: seal.textConfig.color || '#1e3a8a',
                  color: seal.textConfig.color || '#1e3a8a',
                  borderWidth: `${sealSize * 0.025}px`,
                  padding: `${sealSize * 0.03}px`
                }}
              >
                 <div className="w-full h-full rounded-full border-dashed flex flex-col items-center justify-center" 
                      style={{ 
                        borderColor: seal.textConfig.color || '#1e3a8a',
                        borderWidth: `${Math.max(1, sealSize * 0.01)}px`,
                        padding: `${sealSize * 0.02}px`
                      }}>
                    <span className="font-bold leading-tight object-contain" style={{ fontSize: `${sealSize * 0.08}px`, marginBottom: `${sealSize * 0.01}px` }}>{seal.textConfig.line1}</span>
                    <span className="border-b-2 border-t-2 w-full" style={{ borderColor: seal.textConfig.color || '#1e3a8a', fontSize: `${sealSize * 0.06}px`, padding: `${sealSize * 0.015}px 0`, margin: `${sealSize * 0.01}px 0` }}>{seal.textConfig.line2}</span>
                    <span className="font-medium leading-tight" style={{ fontSize: `${sealSize * 0.07}px`, marginTop: `${sealSize * 0.01}px` }}>{seal.textConfig.line3}</span>
                 </div>
              </div>
            ) : seal.url ? (
              <img src={seal.url} alt="Sello" className="w-full h-full object-contain" />
            ) : null}
          </div>
        )}

        {/* Signature */}
        <div 
           className="border-b-2 border-gray-800 w-full mb-2 flex justify-center h-24 items-end pb-1 relative z-10 box-content transition-transform"
           style={{
             transform: `translate(${signature?.offsetX || 0}px, ${signature?.offsetY || 0}px)`
           }}
        >
          {signature?.enabled !== false && signature?.url ? (
            <img 
              src={signature.url} 
              alt="Firma" 
              style={{ 
                width: `${signature.width || 140}px`,
                maxHeight: '100%'
              }}
              className="object-contain"
            />
          ) : (
            <div className="text-[10px] text-gray-300 italic uppercase font-bold tracking-tighter self-center">Espacio para Firma del Médico</div>
          )}
        </div>

        {/* Name and Professional Details */}
        <div className="space-y-0.5 mt-2">
          <p className="text-sm font-black text-gray-900 leading-tight uppercase tracking-tight">
            {dataMap['{{doctor_name}}']}
          </p>
          <p className="text-[10px] font-bold text-[var(--primary-color)] uppercase tracking-widest whitespace-nowrap">
            {dataMap['{{doctor_specialty}}']}
          </p>
          <p className="text-[9px] font-mono text-gray-500 font-bold">
            CÉDULA: {dataMap['{{doctor_cedula}}']}
          </p>
          {dataMap['{{doctor_cedula_esc}}'] && (
            <p className="text-[9px] font-mono text-gray-500 font-bold">
              CÉDULA ESP: {dataMap['{{doctor_cedula_esc}}']}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

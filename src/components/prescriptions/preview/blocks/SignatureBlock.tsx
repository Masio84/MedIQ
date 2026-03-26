import { usePrescriptionStore } from '../../store/prescription-template.store';
import { replaceVariables, getVariableDataMap } from '../../utils/variable-engine';

export default function SignatureBlock() {
  const { template } = usePrescriptionStore();
  const block = template.blocks.find(b => b.type === 'signature');
  const { signature, seal } = template.branding;
  const dataMap = getVariableDataMap();

  if (!block || !block.enabled) return null;

  // Alignment from contentConfig or default
  const alignment = block.contentConfig.alignment || 'center';
  const showSeal = block.contentConfig.showSeal !== false;
  const showName = block.contentConfig.showName !== false;

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

  return (
    <div className={`mt-10 flex w-full ${alignmentWrapper} gap-8 items-end`}>
      <div className={`relative flex flex-col items-center min-w-[200px] ${textAlignment}`}>
        {/* Seal */}
        {showSeal && seal?.url && (
          <div 
            className="absolute -top-12 -right-12 pointer-events-none select-none z-0"
            style={{ 
              width: `${seal.width || 60}px`,
              height: `${seal.height || 60}px`
            }}
          >
            <img src={seal.url} alt="Sello" className="w-full h-full object-contain" />
          </div>
        )}

        {/* Signature */}
        <div className="border-b-2 border-gray-100 w-full mb-2 flex justify-center h-20 items-end pb-1 relative z-10 box-content">
          {signature?.url ? (
            <img 
              src={signature.url} 
              alt="Firma" 
              style={{ 
                width: `${signature.width || 120}px`,
                maxHeight: '100%'
              }}
              className="object-contain"
            />
          ) : (
            <div className="text-[10px] text-gray-300 italic uppercase font-bold tracking-tighter self-center">Espacio para Firma del Médico</div>
          )}
        </div>

        {/* Name and Professional Details */}
        {showName && (
          <div className="space-y-0.5">
            <p className="text-sm font-black text-gray-900 leading-tight uppercase tracking-tight">
              {dataMap['{{doctor_name}}']}
            </p>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
              {dataMap['{{doctor_specialty}}']}
            </p>
            <p className="text-[8px] font-mono text-gray-400 font-bold opacity-60">
              CÉDULA: {dataMap['{{doctor_cedula}}']}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

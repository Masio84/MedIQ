import { usePrescriptionStore } from '../../store/prescription-template.store';
import { replaceVariables, getVariableDataMap } from '../../utils/variable-engine';

export default function FooterBlock() {
  const { template } = usePrescriptionStore();
  const block = template.blocks.find(b => b.type === 'footer');
  const dataMap = getVariableDataMap();

  if (!block || !block.enabled) return null;

  const footerText = replaceVariables(block.contentConfig.text, dataMap);

  return (
    <div className="mt-auto pt-8 border-t border-gray-100">
      <div className="text-[9px] text-gray-400 text-center leading-relaxed italic whitespace-pre-line">
        {footerText}
      </div>
    </div>
  );
}

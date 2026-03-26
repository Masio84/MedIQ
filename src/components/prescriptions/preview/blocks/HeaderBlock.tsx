import { TemplateBlock } from '../../types/prescription-template.types';
import { usePrescriptionStore } from '../../store/prescription-template.store';
import { replaceVariables, getVariableDataMap } from '../../utils/variable-engine';
import { DEFAULT_TEMPLATE } from '../../mock/prescription-template.mock';
import { PrescriptionTemplate } from '../../types/prescription-template.types';
import { useContext } from 'react';
import { PreviewTemplateContext, PreviewDataContext } from '../PreviewContext';

export default function HeaderBlock() {
  const storeTemplate = usePrescriptionStore(state => state.template);
  const contextTemplate = useContext(PreviewTemplateContext);
  const contextData = useContext(PreviewDataContext);
  
  const template: PrescriptionTemplate = {
    ...DEFAULT_TEMPLATE,
    ...(contextTemplate || storeTemplate),
    // Ensure critical nested objects are also merged
    blocks: (contextTemplate || storeTemplate)?.blocks || DEFAULT_TEMPLATE.blocks,
    styles: {
      ...DEFAULT_TEMPLATE.styles,
      ...((contextTemplate || storeTemplate)?.styles || {})
    },
    branding: {
      ...DEFAULT_TEMPLATE.branding,
      ...((contextTemplate || storeTemplate)?.branding || {})
    }
  };

  const block = template.blocks.find(b => b.type === 'header');
  const dataMap = contextData || getVariableDataMap();

  if (!block || !block.enabled) return null;

  const title = replaceVariables(block.contentConfig.title, dataMap);
  const subtitle = replaceVariables(block.contentConfig.subtitle, dataMap);
  const contactInfo = replaceVariables(block.contentConfig.contactInfo, dataMap);

  return (
    <div className="flex items-center justify-between mb-8 border-b-2 pb-6" style={{ borderColor: template.styles.primaryColor }}>
      <div className="flex-1">
        <h1 className="text-2xl font-black uppercase tracking-tight leading-none mb-1" style={{ color: template.styles.primaryColor }}>
          {title}
        </h1>
        <p className="text-sm font-bold text-gray-400 mb-3" style={{ color: template.styles.secondaryColor }}>
          {subtitle}
        </p>
        <div className="text-[10px] text-gray-400 leading-relaxed font-medium whitespace-pre-line">
          {contactInfo}
        </div>
      </div>
      
      <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-100 overflow-hidden ml-6">
        {template.branding.logo?.url ? (
          <img src={template.branding.logo.url} alt="Logo" className="w-full h-full object-contain p-2" />
        ) : (
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center px-4">Logo Clínica</span>
        )}
      </div>
    </div>
  );
}

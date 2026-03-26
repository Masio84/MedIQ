import { usePrescriptionStore } from '../../store/prescription-template.store';
import { getVariableDataMap } from '../../utils/variable-engine';
import { useContext } from 'react';
import { PreviewTemplateContext, PreviewDataContext } from '../PreviewContext';

export default function PatientBlock() {
  const storeTemplate = usePrescriptionStore(state => state.template);
  const contextTemplate = useContext(PreviewTemplateContext);
  const contextData = useContext(PreviewDataContext);
  
  const template = contextTemplate || storeTemplate;
  const block = template.blocks.find(b => b.type === 'patient');
  const dataMap = contextData || getVariableDataMap();

  if (!block || !block.enabled) return null;

  const fields = block.contentConfig.fields || [];

  return (
    <div className="grid grid-cols-2 gap-y-2 mb-6 p-3 bg-gray-50 rounded-lg border border-gray-100">
      {fields.includes('name') && (
        <div className="col-span-2">
          <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">Paciente</span>
          <span className="font-bold text-sm">{dataMap['{{patient_name}}']}</span>
        </div>
      )}
      {fields.includes('age') && (
        <div>
          <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">Edad</span>
          <span className="text-xs">{dataMap['{{patient_age}}']} años</span>
        </div>
      )}
      {fields.includes('gender') && (
        <div>
          <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">Sexo</span>
          <span className="text-xs">{dataMap['{{patient_gender}}']}</span>
        </div>
      )}
      {fields.includes('date') && (
        <div>
          <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">Fecha</span>
          <span className="text-xs">{dataMap['{{date}}']}</span>
        </div>
      )}
      {fields.includes('folio') && (
        <div>
          <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">Folio</span>
          <span className="font-mono text-blue-600 font-bold text-xs">{dataMap['{{folio}}']}</span>
        </div>
      )}
    </div>
  );
}

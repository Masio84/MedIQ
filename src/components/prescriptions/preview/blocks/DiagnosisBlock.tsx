import { TemplateBlock } from '../../types/prescription-template.types';
import { MOCK_PRESCRIPTION_DATA } from '../../mock/prescription-template.mock';
import { useContext } from 'react';
import { PreviewDataContext } from '../PreviewContext';

export default function DiagnosisBlock({ block, styles }: { block: TemplateBlock; styles: any }) {
  const contextData = useContext(PreviewDataContext);
  const diagnosis = contextData?.diagnosis || MOCK_PRESCRIPTION_DATA.diagnosis;

  return (
    <div className="mb-6">
      <h3 className="text-[10px] uppercase font-bold text-gray-400 mb-1">Diagnóstico</h3>
      <p className="font-medium bg-white p-2 rounded border border-gray-50 min-h-[40px] text-sm">
        {diagnosis}
      </p>
    </div>
  );
}

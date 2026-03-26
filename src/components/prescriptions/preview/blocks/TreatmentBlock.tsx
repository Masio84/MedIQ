import { TemplateBlock } from '../../types/prescription-template.types';
import { MOCK_PRESCRIPTION_DATA } from '../../mock/prescription-template.mock';
import { useContext } from 'react';
import { PreviewDataContext } from '../PreviewContext';

export default function TreatmentBlock({ block, styles }: { block: TemplateBlock; styles: any }) {
  const contextData = useContext(PreviewDataContext);
  const treatment = Array.isArray(contextData?.treatment) ? contextData.treatment : MOCK_PRESCRIPTION_DATA.treatment;

  return (
    <div className="mb-6">
      <h3 className="text-[10px] uppercase font-bold opacity-40 mb-2">Tratamiento e Indicaciones</h3>
      <div className="space-y-4">
        {treatment.map((item: any, idx: number) => (
          <div key={idx} className="flex gap-4 items-start border-l-2 pl-3" style={{ borderColor: styles.primaryColor }}>
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: styles.primaryColor }}>{item.medication}</p>
              <p className="text-xs opacity-80 mt-1">{item.dose} — {item.frequency}</p>
              <p className="text-[10px] uppercase font-bold opacity-40 mt-1">Durante: {item.duration}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

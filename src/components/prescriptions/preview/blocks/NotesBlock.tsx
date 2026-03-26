import { TemplateBlock } from '../../types/prescription-template.types';
import { MOCK_PRESCRIPTION_DATA } from '../../mock/prescription-template.mock';
import { useContext } from 'react';
import { PreviewDataContext } from '../PreviewContext';

export default function NotesBlock({ block, styles }: { block: TemplateBlock; styles: any }) {
  const contextData = useContext(PreviewDataContext);
  const notes = contextData?.notes || MOCK_PRESCRIPTION_DATA.notes;

  return (
    <div className="mb-6">
      <h3 className="text-[10px] uppercase font-bold opacity-40 mb-1">Notas Adicionales</h3>
      <p className="text-xs italic bg-amber-50/30 p-3 rounded-lg border border-amber-100/50">
        {notes}
      </p>
    </div>
  );
}

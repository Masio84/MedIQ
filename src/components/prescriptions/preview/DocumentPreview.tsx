'use client';

import { usePrescriptionStore } from '../store/prescription-template.store';
import { PAGE_DIMENSIONS, BlockType, PrescriptionTemplate } from '../types/prescription-template.types';
import { DEFAULT_TEMPLATE } from '../mock/prescription-template.mock';
import VisualRules from './VisualRules';
import { getVariableDataMap } from '../utils/variable-engine';
import { useContext, useMemo } from 'react';
import { PreviewTemplateContext, PreviewDataContext } from './PreviewContext';

// Blocks
import HeaderBlock from './blocks/HeaderBlock';
import PatientBlock from './blocks/PatientBlock';
import DiagnosisBlock from './blocks/DiagnosisBlock';
import TreatmentBlock from './blocks/TreatmentBlock';
import NotesBlock from './blocks/NotesBlock';
import SignatureBlock from './blocks/SignatureBlock';
import FooterBlock from './blocks/FooterBlock';

const MM_TO_PX = 3.78;

const BLOCK_COMPONENTS: Record<BlockType, React.FC<any>> = {
  header: HeaderBlock,
  patient: PatientBlock,
  diagnosis: DiagnosisBlock,
  treatment: TreatmentBlock,
  notes: NotesBlock,
  signature: SignatureBlock,
  footer: FooterBlock,
};

export default function DocumentPreview({ 
  zoom = 1, 
  showRules = true, 
  showGrid = false 
}: { 
  zoom?: number; 
  showRules?: boolean; 
  showGrid?: boolean;
}) {
  const storeTemplate = usePrescriptionStore(state => state.template);
  const contextTemplate = useContext(PreviewTemplateContext);
  const contextData = useContext(PreviewDataContext);
  const updatePage = usePrescriptionStore(state => state.updatePage);

  // Merge context template with defaults to ensure all properties exist
  const template: PrescriptionTemplate = useMemo(() => {
    const base = contextTemplate || storeTemplate;
    return {
      ...DEFAULT_TEMPLATE,
      ...base,
      // Ensure critical nested objects are also merged if they exist
      page: {
        ...DEFAULT_TEMPLATE.page,
        ...(base?.page || {})
      },
      styles: {
        ...DEFAULT_TEMPLATE.styles,
        ...(base?.styles || {})
      },
      branding: {
        ...DEFAULT_TEMPLATE.branding,
        ...(base?.branding || {})
      },
      blocks: base?.blocks || DEFAULT_TEMPLATE.blocks
    };
  }, [contextTemplate, storeTemplate]);

  const { size, margins, orientation } = template.page;
  let dimensions = { ...PAGE_DIMENSIONS[size] };

  // Swap width and height for landscape orientation
  if (orientation === 'LANDSCAPE') {
    const temp = dimensions.width;
    dimensions.width = dimensions.height;
    dimensions.height = temp;
  }

  // Estilos base calculados en px
  const containerStyle = {
    width: `${dimensions.width * MM_TO_PX}px`,
    height: `${dimensions.height * MM_TO_PX}px`,
    paddingTop: `${margins.top * MM_TO_PX}px`,
    paddingRight: `${margins.right * MM_TO_PX}px`,
    paddingBottom: `${margins.bottom * MM_TO_PX}px`,
    paddingLeft: `${margins.left * MM_TO_PX}px`,
    transform: `scale(${zoom})`,
    transformOrigin: 'top center',
    backgroundColor: 'white',
    fontFamily: template.styles.fontFamily,
    fontSize: `${template.styles.fontSize}px`,
    lineHeight: template.styles.lineHeight,
    color: template.styles.textColor,
  };

  // Filtrar y ordenar bloques habilitados
  const activeBlocks = template.blocks
    .filter(b => b.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="flex justify-center bg-gray-200/50 p-8 rounded-xl overflow-auto custom-scrollbar h-full min-h-[600px]">
      <div 
        id="prescription-canvas"
        className="shadow-2xl relative flex flex-col transition-all duration-300 ease-in-out"
        style={containerStyle}
      >
        {showRules && (
          <VisualRules 
            margins={margins} 
            width={dimensions.width} 
            height={dimensions.height} 
            showGrid={showGrid}
            gridSize={8}
            zoom={zoom}
            onMarginChange={(newMargins) => updatePage({ margins: newMargins })}
          />
        )}
        
        <PreviewTemplateContext.Provider value={template}>
          <PreviewDataContext.Provider value={contextData || getVariableDataMap()}>
            {activeBlocks.map((block) => {
              const Component = BLOCK_COMPONENTS[block.type];
              return Component ? (
                <Component 
                  key={block.id} 
                  block={block} 
                  styles={template.styles} 
                />
              ) : null;
            })}
          </PreviewDataContext.Provider>
        </PreviewTemplateContext.Provider>
      </div>
    </div>
  );
}

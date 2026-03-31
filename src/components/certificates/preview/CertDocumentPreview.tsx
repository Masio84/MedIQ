'use client';

import { useCertificateStore } from '../store/certificate-template.store';
import { PAGE_DIMENSIONS, BlockType, CertificateTemplate } from '../types/certificate-template.types';
import { DEFAULT_CERTIFICATE_TEMPLATE, MOCK_CERTIFICATE_DATA } from '../mock/certificate-template.mock';
import VisualRules from '../../prescriptions/preview/VisualRules'; // Reusing visual rules
import { getCertificateVariableDataMap } from '../utils/cert-variable-engine';
import { useContext, useMemo } from 'react';
import { CertPreviewTemplateContext, CertPreviewDataContext } from './CertPreviewContext';

// Blocks
import CertHeaderBlock from './blocks/CertHeaderBlock';
import CertDoctorBlock from './blocks/CertDoctorBlock';
import CertPatientBlock from './blocks/CertPatientBlock';
import CertBodyBlock from './blocks/CertBodyBlock';
import CertSignatureBlock from './blocks/CertSignatureBlock';
import CertFooterBlock from './blocks/CertFooterBlock';

const MM_TO_PX = 3.78;

const BLOCK_COMPONENTS: Record<BlockType, React.FC<any>> = {
  header: CertHeaderBlock,
  doctor: CertDoctorBlock,
  patient: CertPatientBlock,
  body: CertBodyBlock,
  signature: CertSignatureBlock,
  footer: CertFooterBlock,
};

export default function CertDocumentPreview({ 
  zoom = 1, 
  showRules = true, 
  showGrid = false 
}: { 
  zoom?: number; 
  showRules?: boolean; 
  showGrid?: boolean;
}) {
  const storeTemplate = useCertificateStore(state => state.template);
  const contextTemplate = useContext(CertPreviewTemplateContext);
  const contextData = useContext(CertPreviewDataContext);
  const updatePage = useCertificateStore(state => state.updatePage);

  // Merge context template with defaults to ensure all properties exist
  const template: CertificateTemplate = useMemo(() => {
    const base = contextTemplate || storeTemplate;
    return {
      ...DEFAULT_CERTIFICATE_TEMPLATE,
      ...base,
      // Ensure critical nested objects are also merged if they exist
      page: {
        ...DEFAULT_CERTIFICATE_TEMPLATE.page,
        ...(base?.page || {})
      },
      styles: {
        ...DEFAULT_CERTIFICATE_TEMPLATE.styles,
        ...(base?.styles || {})
      },
      branding: {
        ...DEFAULT_CERTIFICATE_TEMPLATE.branding,
        ...(base?.branding || {})
      },
      blocks: base?.blocks || DEFAULT_CERTIFICATE_TEMPLATE.blocks
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

  // Base styles calculated in px
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

  // Filter and sort active blocks
  const activeBlocks = template.blocks
    .filter(b => b.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="flex justify-center bg-gray-200/50 p-8 rounded-xl overflow-auto custom-scrollbar h-full min-h-[600px]">
      <div 
        id="certificate-canvas"
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
        
        <CertPreviewTemplateContext.Provider value={template}>
          <CertPreviewDataContext.Provider value={contextData || MOCK_CERTIFICATE_DATA}>
            {activeBlocks.map((block) => {
              const Component = BLOCK_COMPONENTS[block.type];
              return Component ? (
                <Component 
                  key={block.id} 
                  block={block} 
                  styles={template.styles} 
                  mockData={contextData || MOCK_CERTIFICATE_DATA}
                />
              ) : null;
            })}
          </CertPreviewDataContext.Provider>
        </CertPreviewTemplateContext.Provider>
      </div>
    </div>
  );
}

import { create } from 'zustand';
import { 
  CertificateTemplate, 
  PageConfig, 
  TemplateStyles, 
  BrandingConfig, 
  TemplateBlock 
} from '../types/certificate-template.types';
import { DEFAULT_CERTIFICATE_TEMPLATE } from '../mock/certificate-template.mock';

interface CertificateStore {
  template: CertificateTemplate;
  
  // Actions
  updatePage: (page: Partial<PageConfig>) => void;
  updateStyles: (styles: Partial<TemplateStyles>) => void;
  updateBranding: (branding: Partial<BrandingConfig>) => void;
  toggleBlock: (blockId: string) => void;
  reorderBlocks: (originIndex: number, destinationIndex: number) => void;
  updateBlockConfig: (blockId: string, config: any) => void;
  resetTemplate: () => void;
  loadTemplate: (template: CertificateTemplate) => void;
}

export const useCertificateStore = create<CertificateStore>((set) => ({
  template: {
    ...DEFAULT_CERTIFICATE_TEMPLATE,
    page: {
      ...DEFAULT_CERTIFICATE_TEMPLATE.page,
      orientation: 'PORTRAIT',
    },
  },

  updatePage: (page) => set((state) => ({
    template: {
      ...state.template,
      page: { ...state.template.page, ...page },
      updatedAt: new Date().toISOString(),
    }
  })),

  updateStyles: (styles) => set((state) => ({
    template: {
      ...state.template,
      styles: { ...state.template.styles, ...styles },
      updatedAt: new Date().toISOString(),
    }
  })),

  updateBranding: (branding) => set((state) => ({
    template: {
      ...state.template,
      branding: { 
        ...state.template.branding, 
        ...branding 
      },
      updatedAt: new Date().toISOString(),
    }
  })),

  toggleBlock: (blockId) => set((state) => ({
    template: {
      ...state.template,
      blocks: state.template.blocks.map(block => 
        block.id === blockId ? { ...block, enabled: !block.enabled } : block
      ),
      updatedAt: new Date().toISOString(),
    }
  })),

  reorderBlocks: (originIndex, destinationIndex) => set((state) => {
    const newBlocks = [...state.template.blocks];
    const [removed] = newBlocks.splice(originIndex, 1);
    newBlocks.splice(destinationIndex, 0, removed);
    
    // Update order property
    const orderedBlocks = newBlocks.map((block, index) => ({
      ...block,
      order: index
    }));

    return {
      template: {
        ...state.template,
        blocks: orderedBlocks,
        updatedAt: new Date().toISOString(),
      }
    };
  }),

  updateBlockConfig: (blockId, config) => set((state) => ({
    template: {
      ...state.template,
      blocks: state.template.blocks.map(block => 
        block.id === blockId ? { ...block, contentConfig: { ...block.contentConfig, ...config } } : block
      ),
      updatedAt: new Date().toISOString(),
    }
  })),

  resetTemplate: () => set({
    template: { ...DEFAULT_CERTIFICATE_TEMPLATE, updatedAt: new Date().toISOString() }
  }),

  loadTemplate: (template) => set({
    template: { ...template }
  }),
}));

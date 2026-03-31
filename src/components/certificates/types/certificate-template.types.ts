export type PageSize = 'LETTER' | 'HALF' | 'QUARTER';

export interface Margins {
  top: number;    // mm
  right: number;
  bottom: number;
  left: number;
}

export interface PageConfig {
  size: PageSize;
  margins: Margins;
  orientation: 'PORTRAIT' | 'LANDSCAPE';
}

export interface TemplateStyles {
  fontFamily: string;
  fontSize: number;       // px
  lineHeight: number;     // ratio
  primaryColor: string;   // hex
  secondaryColor: string; // hex
  textColor: string;      // hex
}

export interface BrandingConfig {
  logo: {
    url: string;
    position: 'left' | 'center' | 'right';
    width: number;  // mm
    height: number; // mm
  } | null;
  signature: {
    url: string;
    width: number;
    height: number;
    offsetX?: number;
    offsetY?: number;
    enabled?: boolean;
  } | null;
  seal: {
    url?: string;
    width?: number;
    height?: number;
    offsetX?: number;
    offsetY?: number;
    rotation?: number;
    enabled?: boolean;
    textConfig?: {
      color?: string;
      line1?: string;
      line2?: string;
      line3?: string;
    };
  } | null;
}

export type BlockType = 'header' | 'doctor' | 'patient' | 'body' | 'signature' | 'footer';

export interface TemplateBlock {
  id: string;
  type: BlockType;
  enabled: boolean;
  order: number;
  style: Record<string, string | number>;
  contentConfig: Record<string, any>;
}

export interface CertificateTemplate {
  id: string;
  doctorId: string;
  name: string;
  page: PageConfig;
  styles: TemplateStyles;
  branding: BrandingConfig;
  blocks: TemplateBlock[];
  createdAt: string;
  updatedAt: string;
}

export const PAGE_DIMENSIONS: Record<PageSize, { width: number; height: number }> = {
  LETTER: { width: 215.9, height: 279.4 },
  HALF: { width: 139.7, height: 215.9 },
  QUARTER: { width: 107.9, height: 139.7 },
};

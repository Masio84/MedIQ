import { createContext } from 'react';
import { CertificateTemplate } from '../../types/certificate-template.types';

export const CertPreviewTemplateContext = createContext<CertificateTemplate | null>(null);
export const CertPreviewDataContext = createContext<any>(null);

import { createContext } from 'react';
import { PrescriptionTemplate } from '../types/prescription-template.types';

export const PreviewTemplateContext = createContext<PrescriptionTemplate | null>(null);
export const PreviewDataContext = createContext<Record<string, string> | null>(null);

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PrescriptionTemplate, PAGE_DIMENSIONS } from '../types/prescription-template.types';

export async function generatePrescriptionPDF(template: PrescriptionTemplate, elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const { size, orientation } = template.page;
  const { width, height } = PAGE_DIMENSIONS[size];
  
  // PDF setup
  const pdfOrientation = orientation === 'LANDSCAPE' ? 'landscape' : 'portrait';
  
  // Real dimensions in mm for jsPDF
  const docWidth = orientation === 'LANDSCAPE' ? height : width;
  const docHeight = orientation === 'LANDSCAPE' ? width : height;

  const pdf = new jsPDF({
    orientation: pdfOrientation,
    unit: 'mm',
    format: [docWidth, docHeight]
  });

  try {
    // Render HTML to canvas
    const canvas = await html2canvas(element, {
      scale: 3, // High quality scale
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // ULTIMATE FIX FOR "lab" COLOR ERROR
        // The error happens because modern browsers return 'lab(...)' for computed styles 
        // when using Tailwind 4, and html2canvas doesn't know how to parse that.
        
        // 1. Remove all external stylesheets that might contain Lab/Oklch variables
        const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
        styles.forEach(s => s.remove());

        // 2. Inject a minimal, safe CSS for the prescription
        const style = clonedDoc.createElement('style');
        style.innerHTML = `
          * { box-sizing: border-box !important; -webkit-print-color-adjust: exact !important; }
          body { background: white !important; color: black !important; font-family: Arial, sans-serif !important; margin: 0 !important; padding: 0 !important; }
          .prescription-canvas { background: white !important; transform: none !important; box-shadow: none !important; margin: 0 !important; }
          .visual-rules-overlay { display: none !important; }
          .flex { display: flex !important; }
          .flex-col { flex-direction: column !important; }
          .items-center { align-items: center !important; }
          .justify-between { justify-content: space-between !important; }
          .justify-center { justify-content: center !important; }
          .justify-start { justify-content: flex-start !important; }
          .justify-end { justify-content: flex-end !important; }
          .grid { display: grid !important; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .gap-2 { gap: 0.5rem !important; }
          .gap-3 { gap: 0.75rem !important; }
          .gap-4 { gap: 1rem !important; }
          .gap-8 { gap: 2rem !important; }
          .gap-y-2 { row-gap: 0.5rem !important; }
          .w-full { width: 100% !important; }
          .h-full { height: 100% !important; }
          .h-20 { height: 5rem !important; }
          .border-b-2 { border-bottom-width: 2px !important; border-bottom-style: solid !important; }
          .border-t { border-top-width: 1px !important; border-top-style: solid !important; }
          .border { border-width: 1px !important; border-style: solid !important; }
          .rounded { border-radius: 0.25rem !important; }
          .rounded-lg { border-radius: 0.5rem !important; }
          .text-2xl { font-size: 1.5rem !important; }
          .text-sm { font-size: 0.875rem !important; }
          .text-xs { font-size: 0.75rem !important; }
          .text-\[10px\] { font-size: 10px !important; }
          .text-\[9px\] { font-size: 9px !important; }
          .text-\[8px\] { font-size: 8px !important; }
          .font-black { font-weight: 900 !important; }
          .font-bold { font-weight: 700 !important; }
          .font-medium { font-weight: 500 !important; }
          .uppercase { text-transform: uppercase !important; }
          .italic { font-style: italic !important; }
          .text-center { text-align: center !important; }
          .text-left { text-align: left !important; }
          .text-right { text-align: right !important; }
          .whitespace-pre-line { white-space: pre-line !important; }
          .mb-1 { margin-bottom: 0.25rem !important; }
          .mb-2 { margin-bottom: 0.5rem !important; }
          .mb-3 { margin-bottom: 0.75rem !important; }
          .mb-8 { margin-bottom: 2rem !important; }
          .mb-6 { margin-bottom: 1.5rem !important; }
          .mt-10 { margin-top: 2.5rem !important; }
          .mt-auto { margin-top: auto !important; }
          .pt-8 { padding-top: 2rem !important; }
          .pb-6 { padding-bottom: 1.5rem !important; }
          .p-2 { padding: 0.5rem !important; }
          .p-3 { padding: 0.75rem !important; }
          .relative { position: relative !important; }
          .absolute { position: absolute !important; }
          .-top-12 { top: -3rem !important; }
          .-right-12 { right: -3rem !important; }
          .z-10 { z-index: 10 !important; }
          .z-0 { z-index: 0 !important; }
          .opacity-40 { opacity: 0.4 !important; }
          .object-contain { object-fit: contain !important; }
          img { max-width: 100%; height: auto; }
        `;
        clonedDoc.head.appendChild(style);

        // 3. Setup the specific element
        const canvasElement = clonedDoc.getElementById(elementId);
        if (canvasElement) {
          canvasElement.style.transform = 'none';
          canvasElement.style.boxShadow = 'none';
          canvasElement.style.background = '#ffffff';
          canvasElement.style.color = '#000000';
          
          // Cleanup children from any computed style that might be lab()
          const all = canvasElement.querySelectorAll('*');
          all.forEach(el => {
            const node = el as HTMLElement;
            if (node.style) {
              // If it's a tailwind-colored element, try to force a safe color
              // This is a catch-all to prevent the 'lab' error
              const computed = window.getComputedStyle(el);
              if (computed.color.includes('lab') || computed.color.includes('oklch')) {
                 node.style.color = 'black';
              }
              if (computed.backgroundColor.includes('lab') || computed.backgroundColor.includes('oklch')) {
                 node.style.backgroundColor = 'transparent';
              }
            }
          });
        }
      }
    });

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, docWidth, docHeight);
    
    // Save the PDF
    pdf.save(`Receta_${template.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}

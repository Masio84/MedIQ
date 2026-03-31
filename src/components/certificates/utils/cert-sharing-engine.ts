import { CertificateTemplate } from '../types/certificate-template.types';
import { getCertificateVariableDataMap } from './cert-variable-engine';
import { MOCK_CERTIFICATE_DATA } from '../mock/certificate-template.mock';

/**
 * Generates and opens a WhatsApp link with the certificate details.
 */
export function shareCertificateViaWhatsApp(phone: string, folio: string, patientName?: string): void {
  // Clean phone number (remove spaces, dashes, parens)
  let cleanPhone = phone.replace(/[\\s\\-\\(\\)]/g, '');
  if (!cleanPhone.startsWith('+')) {
    cleanPhone = '+52' + cleanPhone; // Fallback to MX code, ideally passed dynamically
  }

  const message = encodeURIComponent(
    `📄 *CERTIFICADO MÉDICO*\n` +
    `-----------------------------------\n` +
    `Hola${patientName ? ` ${patientName}` : ''},\n\n` +
    `Aquí tienes el enlace para verificar o descargar tu certificado médico folio *${folio}*\n\n` +
    `Puedes presentarlo donde sea requerido.\n\n` +
    `_Enviado desde MedIQ Digital_`
  );

  const url = `https://wa.me/${cleanPhone.replace('+', '')}?text=${message}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Direct print function using a temporary, hidden iFrame to isolate styles
 */
export async function directPrintCertificate(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Create a hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) return;

  // Clone our element and its core styles
  // We re-use some principles from our PDF nuclear fix to avoid 'lab' errors
  iframeDoc.write('<html><head><title>Imprimir Certificado</title>');
  
  // Inject clean print styles
  iframeDoc.write(`
    <style>
      @page { size: auto; margin: 0; }
      body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; font-family: Arial, sans-serif; }
      .certificate-canvas { box-shadow: none !important; margin: 0 !important; width: 100% !important; border: none !important; transform: none !important; }
      .visual-rules-overlay { display: none !important; }
      /* Basic block layout for print */
      .flex { display: flex !important; }
      .flex-col { flex-direction: column !important; }
      .items-center { align-items: center !important; }
      .justify-between { justify-content: space-between !important; }
      .grid { display: grid !important; }
      .grid-cols-2 { grid-template-columns: 1fr 1fr !important; }
      .grid-cols-4 { grid-template-columns: 1fr 1fr 1fr 1fr !important; }
      .gap-8 { gap: 2rem !important; }
      .w-full { width: 100% !important; }
      .border-b-2 { border-bottom: 2px solid !important; }
      .border-t { border-top: 1px solid #eee !important; }
      .border { border: 1px solid #eee !important; }
      .text-2xl { font-size: 24px !important; }
      .font-black { font-weight: 900 !important; }
      .font-bold { font-weight: 700 !important; }
      .uppercase { text-transform: uppercase !important; }
      .text-sm { font-size: 14px !important; }
      .p-2 { padding: 8px !important; }
      .p-4 { padding: 16px !important; }
      img { max-width: 100%; height: auto; }
    </style>
  `);
  
  iframeDoc.write('</head><body>');
  iframeDoc.write('<div id="print-container"></div>');
  iframeDoc.write('</body></html>');
  iframeDoc.close();

  // Clone the element into the iframe container
  const printContainer = iframeDoc.getElementById('print-container');
  if (printContainer) {
    const clone = element.cloneNode(true) as HTMLElement;
    // Clean up scale and overlays in the original clone before append
    clone.style.transform = 'none';
    clone.style.boxShadow = 'none';
    
    // Hide rules in the clone
    const rules = clone.querySelectorAll('.visual-rules-overlay');
    rules.forEach(r => (r as HTMLElement).style.display = 'none');
    
    printContainer.appendChild(clone);
  }

  // Trigger print
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    // Remove the iframe after some delay
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 500);
}

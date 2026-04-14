import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateFullRecordPDF(patientName: string, elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // Safe CSS for the report
        const style = clonedDoc.createElement('style');
        style.innerHTML = `
          * { box-sizing: border-box !important; }
          body { background: white !important; color: black !important; font-family: sans-serif !important; }
          #full-record-report-content { width: 210mm !important; margin: 0 !important; padding: 15mm !important; }
          .flex { display: flex !important; }
          .flex-col { flex-direction: column !important; }
          .justify-between { justify-content: space-between !important; }
          .grid { display: grid !important; }
          .grid-cols-2 { grid-template-columns: 1fr 1fr !important; }
          .grid-cols-3 { grid-template-columns: 1fr 1fr 1fr !important; }
          .gap-4 { gap: 1rem !important; }
          .gap-8 { gap: 2rem !important; }
          .border-b-4 { border-bottom: 4px solid black !important; }
          .border-b { border-bottom: 1px solid #edf2f7 !important; }
          .border-l-2 { border-left: 2px solid #edf2f7 !important; }
          .border { border: 1px solid #edf2f7 !important; }
          .bg-gray-50 { background-color: #f7fafc !important; }
          .bg-blue-50 { background-color: #ebf8ff !important; }
          .text-blue-600 { color: #3182ce !important; }
          .text-gray-400 { color: #a0aec0 !important; }
          .text-gray-500 { color: #718096 !important; }
          .text-gray-900 { color: #1a202c !important; }
          .rounded-2xl { border-radius: 1rem !important; }
          .rounded-xl { border-radius: 0.75rem !important; }
          .font-black { font-weight: 900 !important; }
          .font-bold { font-weight: 700 !important; }
          .uppercase { text-transform: uppercase !important; }
          .p-6 { padding: 1.5rem !important; }
          .p-12 { padding: 3rem !important; }
          .m-0 { margin: 0 !important; }
        `;
        clonedDoc.head.appendChild(style);
      }
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Calculate how many pages we need (rough estimate if content is long)
    // For now, if it fits on one page (A4 is ~297mm height)
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    if (imgHeight <= pdfHeight) {
       pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
    } else {
       // Multi-page logic (simplified)
       let heightLeft = imgHeight;
       let position = 0;
       
       pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
       heightLeft -= pdfHeight;
       
       while (heightLeft >= 0) {
         position = heightLeft - imgHeight;
         pdf.addPage();
         pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
         heightLeft -= pdfHeight;
       }
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    pdf.save(`Expediente_${patientName.replace(/\s+/g, '_')}_${dateStr}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating full record PDF:', error);
    return false;
  }
}

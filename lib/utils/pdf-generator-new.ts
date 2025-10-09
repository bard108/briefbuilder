import type { FormData } from '../schemas/brief-schema';
import { pdfStyles, getPdfContent } from './pdf-content';

export interface PDFOptions {
  brandColor?: string;
}

export async function generateEnhancedPDF(
  data: FormData,
  options: PDFOptions = {}
): Promise<void> {
  try {
    // Create a temporary container for PDF content
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.innerHTML = getPdfContent(data);
    document.body.appendChild(container);

    try {
      // Load required modules
      const [jsPDFModule, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const jsPDF = jsPDFModule.jsPDF || (jsPDFModule as any).default;
      const html2canvas = html2canvasModule.default || html2canvasModule;

      // Configure PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Add styles to the container
      const style = document.createElement('style');
      style.textContent = pdfStyles;
      container.appendChild(style);

      // Generate PDF
      const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Add the canvas content to PDF
      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Save the PDF
      pdf.save(`${data.projectName || 'brief'}.pdf`);

    } finally {
      // Clean up
      document.body.removeChild(container);
    }
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
}
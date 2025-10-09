import type { FormData } from '../schemas/brief-schema';
import { pdfStyles } from './pdf-content';

export interface PDFOptions {
  brandColor?: string;
}

export async function generateEnhancedPDF(
  data: FormData,
  contentElement: HTMLElement | null,
  options: PDFOptions = {}
): Promise<void> {
  if (!contentElement) return;
  
  const wrapper = document.createElement('div');
  
  try {
    const [jsPDFModule, html2canvasModule] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);

    const JsPDF = jsPDFModule.jsPDF || (jsPDFModule as any).default;
    const html2canvas = html2canvasModule.default || html2canvasModule;
    
    // Create a styled wrapper for the content
    wrapper.setAttribute('id', 'brief-content-for-pdf');
    
    // Add the PDF styles
    const styleElement = document.createElement('style');
    styleElement.textContent = pdfStyles;
    wrapper.appendChild(styleElement);
    
    // Clone and append the content
    const contentClone = contentElement.cloneNode(true) as HTMLElement;
    wrapper.appendChild(contentClone);
    document.body.appendChild(wrapper);

    // Initialize PDF document
    const doc = new JsPDF('p', 'mm', 'a4');
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Render main content
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = width - 2 * margin;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;
    let pageNum = 1;
    const totalPages = Math.ceil(heightLeft / (height - 2 * margin));

    // Add header and footer to each page
    const addHeaderFooter = (page: number) => {
      // Header
      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(0.5);
      doc.line(margin, 12, width - margin, 12);
      
      doc.setFontSize(9);
      doc.setTextColor(79, 70, 229);
      doc.text(data.projectName || 'Photography Brief', margin, 10);
      
      // Footer
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, height - 15, width - margin, height - 15);
      
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text('Page ' + page + ' of ' + totalPages, width / 2, height - 10, { align: 'center' });
      doc.text(new Date().toLocaleDateString(), width - margin, height - 10, { align: 'right' });
    };

    // First page of content
    doc.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    addHeaderFooter(pageNum);
    heightLeft -= height - 2 * margin;

    // Additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      doc.addPage();
      pageNum++;
      doc.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      addHeaderFooter(pageNum);
      heightLeft -= height - 2 * margin;
    }

    // Save PDF
    const projectName = data.projectName || 'download';
    const safeProjectName = projectName.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const filename = 'brief-' + safeProjectName + '.pdf';
    doc.save(filename);

  } finally {
    // Clean up
    if (wrapper.parentElement) {
      document.body.removeChild(wrapper);
    }
  }
}
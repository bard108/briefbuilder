import type { FormData } from '../schemas/brief-schema';

export interface PDFOptions {
  includeCoverPage?: boolean;
  includeWatermark?: boolean;
  watermarkText?: string;
  brandColor?: string;
  logoUrl?: string;
}

export async function generateEnhancedPDF(
  data: FormData,
  contentElement: HTMLElement | null,
  options: PDFOptions = {}
): Promise<void> {
  if (!contentElement) {
    throw new Error('Content element not found');
  }

  const {
    includeCoverPage = true,
    includeWatermark = false,
    watermarkText = 'DRAFT',
    brandColor = '#4f46e5',
    logoUrl,
  } = options;

  try {
    // Dynamic imports
    const [jsPDFModule, html2canvasModule] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);

    const jsPDF = jsPDFModule.jsPDF || (jsPDFModule as any).default;
    const html2canvas = html2canvasModule.default || html2canvasModule;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;

    let currentY = margin;

    // Helper to add header/footer
    const addHeaderFooter = (pageNum: number, totalPages: number) => {
      // Header
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(data.projectName || 'Photography Brief', margin, 10);
      
      // Footer
      pdf.text(
        `Page ${pageNum} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      pdf.text(
        new Date().toLocaleDateString(),
        pageWidth - margin,
        pageHeight - 10,
        { align: 'right' }
      );

      // Watermark
      if (includeWatermark) {
        pdf.setFontSize(60);
        pdf.setTextColor(200, 200, 200);
        pdf.text(
          watermarkText,
          pageWidth / 2,
          pageHeight / 2,
          { align: 'center', angle: 45 }
        );
      }
    };

    // Cover Page
    if (includeCoverPage) {
      pdf.setFillColor(brandColor);
      pdf.rect(0, 0, pageWidth, 80, 'F');

      if (logoUrl) {
        try {
          pdf.addImage(logoUrl, 'PNG', margin, 20, 40, 20);
        } catch (e) {
          console.warn('Could not add logo to PDF');
        }
      }

      pdf.setTextColor(255);
      pdf.setFontSize(32);
      pdf.text(data.projectName || 'Photography Brief', pageWidth / 2, 120, {
        align: 'center',
      });

      pdf.setFontSize(14);
      pdf.text(
        `Created by ${data.clientName || 'Unknown'}`,
        pageWidth / 2,
        135,
        { align: 'center' }
      );

      pdf.setTextColor(100);
      pdf.setFontSize(12);
      pdf.text(
        new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        pageWidth / 2,
        145,
        { align: 'center' }
      );

      // Project overview on cover
      if (data.overview) {
        pdf.setTextColor(60);
        pdf.setFontSize(11);
        const overviewLines = pdf.splitTextToSize(
          data.overview,
          pageWidth - 2 * margin
        );
        pdf.text(overviewLines, pageWidth / 2, 165, { align: 'center' });
      }

      pdf.addPage();
    }

    // Render main content
    const canvas = await html2canvas(contentElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - 2 * margin;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;
    let pageNum = includeCoverPage ? 2 : 1;

    // Add first page of content
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    addHeaderFooter(pageNum, Math.ceil(heightLeft / (pageHeight - 2 * margin)) + (includeCoverPage ? 1 : 0));
    heightLeft -= pageHeight - 2 * margin;

    // Add additional pages if content overflows
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pageNum++;
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      addHeaderFooter(pageNum, Math.ceil(imgHeight / (pageHeight - 2 * margin)) + (includeCoverPage ? 1 : 0));
      heightLeft -= pageHeight - 2 * margin;
    }

    // Save
    const filename = `brief-${(data.projectName || 'download')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')}.pdf`;
    
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// Export shot list as separate PDF
export async function exportShotListPDF(data: FormData): Promise<void> {
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.jsPDF || (jsPDFModule as any).default;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  pdf.setFontSize(18);
  pdf.text('Shot List', margin, y);
  y += 5;
  
  pdf.setFontSize(12);
  pdf.text(data.projectName || 'Untitled Project', margin, y);
  y += 10;

  pdf.setFontSize(10);
  if (!data.shotList || data.shotList.length === 0) {
    pdf.text('No shots defined', margin, y);
  } else {
    data.shotList.forEach((shot, index) => {
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Shot ${index + 1}${shot.priority ? ' ⭐' : ''}`, margin, y);
      y += 6;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      const descLines = pdf.splitTextToSize(shot.description, pageWidth - 2 * margin);
      pdf.text(descLines, margin, y);
      y += descLines.length * 5;

      pdf.setFontSize(9);
      pdf.setTextColor(100);
      pdf.text(`Type: ${shot.shotType} | Angle: ${shot.angle}`, margin, y);
      y += 5;

      if (shot.notes) {
        const notesLines = pdf.splitTextToSize(`Notes: ${shot.notes}`, pageWidth - 2 * margin);
        pdf.text(notesLines, margin, y);
        y += notesLines.length * 4;
      }

      if (shot.equipment && shot.equipment.length > 0) {
        pdf.text(`Equipment: ${shot.equipment.join(', ')}`, margin, y);
        y += 5;
      }

      if (shot.estimatedTime) {
        pdf.text(`Est. Time: ${shot.estimatedTime} min`, margin, y);
        y += 5;
      }

      pdf.setTextColor(0);
      y += 5;
    });
  }

  pdf.save(`shotlist-${(data.projectName || 'download').toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

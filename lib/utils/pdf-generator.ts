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
    console.log('Starting PDF generation...');
    
    // Dynamic imports
    console.log('Loading PDF generation modules...');
    const [jsPDFModule, html2canvasModule] = await Promise.all([
      import('jspdf').catch(e => {
        console.error('Failed to load jspdf:', e);
        throw new Error('Failed to load PDF generation module: ' + e.message);
      }),
      import('html2canvas').catch(e => {
        console.error('Failed to load html2canvas:', e);
        throw new Error('Failed to load HTML capture module: ' + e.message);
      }),
    ]);

    console.log('Modules loaded, initializing...');
    const jsPDF = jsPDFModule.jsPDF || (jsPDFModule as any).default;
    if (!jsPDF) {
      throw new Error('Failed to initialize jsPDF');
    }

    const html2canvas = html2canvasModule.default || html2canvasModule;
    if (!html2canvas) {
      throw new Error('Failed to initialize html2canvas');
    }
    
    console.log('Modules initialized successfully');

    console.log('Creating new PDF document...');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;

    console.log('PDF document created, dimensions:', { pageWidth, pageHeight, margin });
    let currentY = margin;

    // Add basic font to ensure text rendering
    console.log('Configuring PDF settings...');
    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(12);

    // Helper to add header/footer with improved styling
    const addHeaderFooter = (pageNum: number, totalPages: number) => {
      // Header with line
      pdf.setDrawColor(79, 70, 229); // Indigo color
      pdf.setLineWidth(0.5);
      pdf.line(margin, 12, pageWidth - margin, 12);
      
      pdf.setFontSize(9);
      pdf.setTextColor(79, 70, 229);
      pdf.setFont('helvetica', 'bold');
      pdf.text(data.projectName || 'Photography Brief', margin, 10);
      
      // Footer with line
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.3);
      pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      
      pdf.setFontSize(8);
      pdf.setTextColor(100);
      pdf.setFont('helvetica', 'normal');
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
        pdf.setTextColor(240, 240, 240);
        pdf.setFont('helvetica', 'bold');
        pdf.text(
          watermarkText,
          pageWidth / 2,
          pageHeight / 2,
          { align: 'center', angle: 45 }
        );
      }
    };

    // Enhanced Cover Page
    if (includeCoverPage) {
      // Gradient-like effect with multiple rectangles
      pdf.setFillColor(79, 70, 229); // Indigo 600
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Lighter overlay for depth
      pdf.setFillColor(99, 102, 241); // Indigo 500
      pdf.rect(0, pageHeight * 0.3, pageWidth, pageHeight * 0.7, 'F');

      if (logoUrl) {
        try {
          pdf.addImage(logoUrl, 'PNG', margin, 25, 40, 20);
        } catch (e) {
          console.warn('Could not add logo to PDF');
        }
      }

      // Main title
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(36);
      const title = data.projectName || 'Photography Brief';
      pdf.text(title, pageWidth / 2, pageHeight * 0.35, { align: 'center' });

      // Subtitle with type
      if (data.projectType) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'normal');
        pdf.text(data.projectType, pageWidth / 2, pageHeight * 0.42, { align: 'center' });
      }

      // Created by section
      pdf.setFontSize(12);
      pdf.setTextColor(220, 220, 255);
      const createdBy = data.clientName ? `Created by ${data.clientName}` : '';
      const company = data.clientCompany ? `${data.clientCompany}` : '';
      if (createdBy) pdf.text(createdBy, pageWidth / 2, pageHeight * 0.52, { align: 'center' });
      if (company) pdf.text(company, pageWidth / 2, pageHeight * 0.56, { align: 'center' });

      // Date
      pdf.setFontSize(10);
      pdf.setTextColor(200, 200, 220);
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      pdf.text(dateStr, pageWidth / 2, pageHeight * 0.63, { align: 'center' });

      // Project overview box
      if (data.overview) {
        pdf.setFillColor(255, 255, 255);
        const boxHeight = 50;
        const boxY = pageHeight * 0.72;
        pdf.roundedRect(margin + 5, boxY, pageWidth - 2 * margin - 10, boxHeight, 3, 3, 'F');
        
        pdf.setTextColor(30, 30, 30);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const overviewLines = pdf.splitTextToSize(data.overview, pageWidth - 2 * margin - 20);
        pdf.text(overviewLines, pageWidth / 2, boxY + 8, { align: 'center', maxWidth: pageWidth - 2 * margin - 20 });
      }

      // Footer on cover
      pdf.setFontSize(8);
      pdf.setTextColor(180, 180, 200);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Professional Photography Brief', pageWidth / 2, pageHeight - 10, { align: 'center' });

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

      if (shot.orientation) {
        pdf.text(`Orientation: ${shot.orientation}`, margin, y);
        y += 5;
      }

      if (shot.equipment && shot.equipment.length > 0) {
        pdf.text(`Equipment: ${shot.equipment.join(', ')}`, margin, y);
        y += 5;
      }

      pdf.setTextColor(0);
      y += 5;
    });
  }

  pdf.save(`shotlist-${(data.projectName || 'download').toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

import type { FormData } from '../schemas/brief-schema';

// Export as JSON
export function exportAsJSON(data: FormData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `brief-${(data.projectName || 'download').toLowerCase().replace(/\s+/g, '-')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export shot list as CSV
export function exportShotListAsCSV(data: FormData): void {
  if (!data.shotList || data.shotList.length === 0) {
    alert('No shots to export');
    return;
  }

  const headers = [
    'Shot #',
    'Description',
    'Shot Type',
    'Angle',
    'Priority',
    'Category',
    'Est. Time (min)',
    'Equipment',
    'Notes',
    'Status',
  ];

  const rows = data.shotList.map((shot, index) => [
    (index + 1).toString(),
    shot.description.replace(/"/g, '""'),
    shot.shotType,
    shot.angle,
    shot.priority ? 'Yes' : 'No',
    shot.category || '',
    shot.estimatedTime?.toString() || '',
    shot.equipment?.join('; ') || '',
    shot.notes.replace(/"/g, '""'),
    shot.status || 'Not Started',
  ]);

  const csv = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `shotlist-${(data.projectName || 'download').toLowerCase().replace(/\s+/g, '-')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export budget as CSV
export function exportBudgetAsCSV(data: FormData): void {
  if (!data.budgetLineItems || data.budgetLineItems.length === 0) {
    alert('No budget items to export');
    return;
  }

  const headers = ['Category', 'Description', 'Quantity', 'Unit Cost', 'Total', 'Notes'];

  const rows = data.budgetLineItems.map(item => [
    item.category.replace(/"/g, '""'),
    item.description.replace(/"/g, '""'),
    item.quantity.toString(),
    item.unitCost.toFixed(2),
    item.total.toFixed(2),
    item.notes?.replace(/"/g, '""') || '',
  ]);

  // Add total row
  const total = data.budgetLineItems.reduce((sum, item) => sum + item.total, 0);
  rows.push(['', '', '', 'TOTAL', total.toFixed(2), '']);

  const csv = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `budget-${(data.projectName || 'download').toLowerCase().replace(/\s+/g, '-')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export as Markdown
export function exportAsMarkdown(data: FormData): void {
  let md = `# ${data.projectName || 'Photography Brief'}\n\n`;
  md += `**Created by:** ${data.clientName || 'Unknown'}  \n`;
  md += `**Date:** ${new Date().toLocaleDateString()}  \n`;
  md += `**Role:** ${data.userRole || 'N/A'}  \n\n`;

  if (data.overview || data.projectType) {
    md += `## Project Overview\n\n`;
    if (data.projectType) md += `**Type:** ${data.projectType}  \n`;
    if (data.overview) md += `${data.overview}\n\n`;
  }

  if (data.objectives) {
    md += `## Objectives\n\n${data.objectives}\n\n`;
  }

  if (data.audience) {
    md += `## Target Audience\n\n${data.audience}\n\n`;
  }

  if (data.clientEmail || data.clientPhone || data.clientCompany) {
    md += `## Contact Information\n\n`;
    if (data.clientName) md += `**Name:** ${data.clientName}  \n`;
    if (data.clientCompany) md += `**Company:** ${data.clientCompany}  \n`;
    if (data.clientEmail) md += `**Email:** ${data.clientEmail}  \n`;
    if (data.clientPhone) md += `**Phone:** ${data.clientPhone}  \n`;
    md += '\n';
  }

  if (data.shootDates || data.location) {
    md += `## Shoot Details\n\n`;
    if (data.shootDates) md += `**Date(s):** ${data.shootDates}  \n`;
    if (data.shootStatus) md += `**Status:** ${data.shootStatus}  \n`;
    if (data.location) md += `**Location:** ${data.location}  \n`;
    md += '\n';
  }

  if (data.deliverables && data.deliverables.length > 0) {
    md += `## Deliverables\n\n`;
    data.deliverables.forEach(d => md += `- ${d}\n`);
    md += '\n';
  }

  if (data.shotList && data.shotList.length > 0) {
    md += `## Shot List\n\n`;
    data.shotList.forEach((shot, index) => {
      md += `### Shot ${index + 1}${shot.priority ? ' ⭐' : ''}\n\n`;
      md += `**Description:** ${shot.description}  \n`;
      md += `**Type:** ${shot.shotType} | **Angle:** ${shot.angle}  \n`;
      if (shot.category) md += `**Category:** ${shot.category}  \n`;
      if (shot.estimatedTime) md += `**Est. Time:** ${shot.estimatedTime} min  \n`;
      if (shot.equipment && shot.equipment.length > 0) {
        md += `**Equipment:** ${shot.equipment.join(', ')}  \n`;
      }
      if (shot.notes) md += `**Notes:** ${shot.notes}  \n`;
      md += '\n';
    });
  }

  if (data.crew && data.crew.length > 0) {
    md += `## Crew\n\n`;
    md += '| Name | Role | Call Time | Contact |\n';
    md += '|------|------|-----------|----------|\n';
    data.crew.forEach(member => {
      md += `| ${member.name} | ${member.role} | ${member.callTime || 'TBD'} | ${member.contact || 'TBD'} |\n`;
    });
    md += '\n';
  }

  if (data.equipment && data.equipment.length > 0) {
    md += `## Equipment List\n\n`;
    const categories = Array.from(new Set(data.equipment.map(e => e.category)));
    categories.forEach(category => {
      md += `### ${category}\n\n`;
      data.equipment!.filter(e => e.category === category).forEach(item => {
        md += `- ${item.name}`;
        if (item.quantity > 1) md += ` (x${item.quantity})`;
        if (item.isRental) md += ` [RENTAL]`;
        md += '\n';
      });
      md += '\n';
    });
  }

  if (data.budget || data.budgetEstimate) {
    md += `## Budget\n\n`;
    if (data.budget) md += `**Range:** ${data.budget}  \n\n`;
    if (data.budgetEstimate) {
      md += `**Estimated Total:** ${new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: data.currency || 'USD',
      }).format(data.budgetEstimate.total)}  \n\n`;
      
      if (Object.keys(data.budgetEstimate.breakdown).length > 0) {
        md += '**Breakdown:**\n\n';
        Object.entries(data.budgetEstimate.breakdown).forEach(([key, value]) => {
          md += `- ${key}: ${new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: data.currency || 'USD',
          }).format(value)}\n`;
        });
        md += '\n';
      }
    }
  }

  if (data.notes) {
    md += `## Additional Notes\n\n${data.notes}\n\n`;
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `brief-${(data.projectName || 'download').toLowerCase().replace(/\s+/g, '-')}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate QR code for sharing
export async function generateQRCode(url: string): Promise<string> {
  const QRCode = await import('qrcode');
  return QRCode.default.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

// Copy to clipboard
export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return Promise.resolve();
  }
}

export const pdfStyles = `
  :root {
    color-scheme: light !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  #brief-content-for-pdf {
    --pdf-primary: rgb(59, 130, 246);
    --pdf-text-dark: rgb(17, 24, 39);
    --pdf-text-medium: rgb(55, 65, 81);
    --pdf-text-light: rgb(107, 114, 128);
    --pdf-border: rgb(229, 231, 235);
    --pdf-bg-white: rgb(255, 255, 255);
    --pdf-bg-gray: rgb(249, 250, 251);
    
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    color: var(--pdf-text-dark);
    background: var(--pdf-bg-white);
    padding: 40px 50px;
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.5;
  }

  /* Header Styles */
  .pdf-header {
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 2px solid var(--pdf-primary);
  }

  .pdf-title {
    font-size: 32px;
    font-weight: 700;
    color: var(--pdf-primary);
    margin: 0 0 12px 0;
    line-height: 1.2;
  }

  .pdf-metadata {
    display: flex;
    justify-content: space-between;
    color: var(--pdf-text-light);
    font-size: 14px;
  }

  /* Section Styles */
  .pdf-section {
    margin-bottom: 35px;
    page-break-inside: avoid;
  }

  .pdf-section-title {
    font-size: 22px;
    font-weight: 600;
    color: var(--pdf-text-medium);
    margin: 0 0 20px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--pdf-border);
  }

  /* Content Grid */
  .pdf-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    margin-bottom: 24px;
  }

  .pdf-card {
    background: var(--pdf-bg-gray);
    border: 1px solid var(--pdf-border);
    border-radius: 8px;
    padding: 20px;
  }

  /* Field Styles */
  .pdf-field {
    margin-bottom: 16px;
  }

  .pdf-field:last-child {
    margin-bottom: 0;
  }

  .pdf-field-label {
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--pdf-text-light);
    margin-bottom: 4px;
  }

  .pdf-field-value {
    font-size: 15px;
    color: var(--pdf-text-dark);
    line-height: 1.6;
  }

  /* List Styles */
  .pdf-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .pdf-list-item {
    padding: 16px;
    border-bottom: 1px solid var(--pdf-border);
  }

  .pdf-list-item:last-child {
    border-bottom: none;
  }

  /* Text Content */
  .pdf-text-content {
    background: var(--pdf-bg-white);
    border: 1px solid var(--pdf-border);
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
  }

  /* Print Optimization */
  @media print {
    #brief-content-for-pdf {
      padding: 20px;
    }

    .pdf-section,
    .pdf-grid,
    .pdf-card {
      page-break-inside: avoid;
    }
  }
`;

export const getPdfContent = (data: any) => `
  <div id="brief-content-for-pdf">
    <header class="pdf-header">
      <h1 class="pdf-title">${data.projectName || 'Untitled Brief'}</h1>
      <div class="pdf-metadata">
        <span>Created by ${data.clientName || data.userRole || 'Unknown'}</span>
        <span>${new Date().toLocaleDateString()}</span>
      </div>
    </header>

    ${data.projectType || data.budget || data.overview ? `
      <section class="pdf-section">
        <h2 class="pdf-section-title">Project Details</h2>
        <div class="pdf-grid">
          ${data.projectType ? `
            <div class="pdf-card">
              <div class="pdf-field">
                <div class="pdf-field-label">Project Type</div>
                <div class="pdf-field-value">${data.projectType}</div>
              </div>
            </div>
          ` : ''}
          ${data.budget ? `
            <div class="pdf-card">
              <div class="pdf-field">
                <div class="pdf-field-label">Budget</div>
                <div class="pdf-field-value">${data.budget}</div>
              </div>
            </div>
          ` : ''}
        </div>
        ${data.overview ? `
          <div class="pdf-text-content">
            <div class="pdf-field">
              <div class="pdf-field-label">Overview</div>
              <div class="pdf-field-value">${data.overview}</div>
            </div>
          </div>
        ` : ''}
      </section>
    ` : ''}

    ${data.objectives || data.audience ? `
      <section class="pdf-section">
        <h2 class="pdf-section-title">Objectives & Audience</h2>
        <div class="pdf-list">
          ${data.objectives ? `
            <div class="pdf-list-item">
              <div class="pdf-field">
                <div class="pdf-field-label">Objectives</div>
                <div class="pdf-field-value">${data.objectives}</div>
              </div>
            </div>
          ` : ''}
          ${data.audience ? `
            <div class="pdf-list-item">
              <div class="pdf-field">
                <div class="pdf-field-label">Target Audience</div>
                <div class="pdf-field-value">${data.audience}</div>
              </div>
            </div>
          ` : ''}
        </div>
      </section>
    ` : ''}
  </div>
`;
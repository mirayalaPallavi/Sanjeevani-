// PDF Export utilities using browser print
export interface ReportData {
  title: string;
  patientName?: string;
  date: string;
  content: {
    section: string;
    items: string[];
  }[];
  footer?: string;
}

export function generatePDFContent(data: ReportData): string {
  const sections = data.content
    .map(
      (section) => `
      <div class="section">
        <h3>${section.section}</h3>
        <ul>
          ${section.items.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${data.title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          color: #333;
        }
        .header {
          border-bottom: 2px solid #0066cc;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #0066cc;
          margin: 0;
        }
        .meta {
          display: flex;
          justify-content: space-between;
          color: #666;
          font-size: 14px;
          margin-top: 10px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h3 {
          color: #0066cc;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .section ul {
          padding-left: 20px;
        }
        .section li {
          margin-bottom: 8px;
          line-height: 1.5;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .severity-low { color: #22c55e; }
        .severity-medium { color: #f59e0b; }
        .severity-high { color: #ef4444; }
        .severity-emergency { color: #dc2626; font-weight: bold; }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${data.title}</h1>
        <div class="meta">
          ${data.patientName ? `<span>Patient: ${data.patientName}</span>` : ''}
          <span>Date: ${data.date}</span>
        </div>
      </div>
      ${sections}
      ${data.footer ? `<div class="footer">${data.footer}</div>` : ''}
    </body>
    </html>
  `;
}

export function downloadPDF(data: ReportData) {
  const content = generatePDFContent(data);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

export function downloadTranscript(transcript: string, filename: string) {
  const blob = new Blob([transcript], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

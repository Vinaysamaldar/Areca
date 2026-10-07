/**
 * Diagnostic PDF Report Generator
 * Generates and downloads an agricultural clinical diagnostic report
 */

function downloadPDFReport() {
  if (!currentPredictionData) {
    alert("Please perform an analysis before downloading the report.");
    return;
  }

  const data = currentPredictionData;
  const lang = localStorage.getItem('areca_lang') || 'en';
  const isKn = lang === 'kn';
  const details = data.details || {};
  const reportDate = new Date().toLocaleString();
  const reportId = "ARC-" + Math.floor(100000 + Math.random() * 900000);

  // Build the print/PDF container
  const reportHtml = `
    <div id="print-report-container" style="padding: 30px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; background: #ffffff; max-width: 800px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
      <!-- Header Banner -->
      <div style="border-bottom: 3px solid #16a34a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="margin: 0; color: #15803d; font-size: 24px; font-weight: 800; text-transform: uppercase;">Arecanut Crop Health Diagnostic Report</h1>
          <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 13px;">Automated Deep Learning Disease Surveillance System</p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; font-weight: bold; color: #15803d;">REPORT ID: ${reportId}</div>
          <div style="font-size: 11px; color: #6b7280;">Date: ${reportDate}</div>
        </div>
      </div>

      <!-- Overview Grid -->
      <div style="display: flex; gap: 20px; margin-bottom: 24px; background: #f0fdf4; padding: 16px; border-radius: 8px; border: 1px solid #bbf7d0;">
        <div style="width: 140px; height: 140px; border-radius: 8px; overflow: hidden; border: 2px solid #16a34a; flex-shrink: 0;">
          <img src="${data.image_url}" style="width: 100%; height: 100%; object-fit: cover;" alt="Sample Image" />
        </div>
        <div style="flex: 1;">
          <div style="font-size: 12px; text-transform: uppercase; color: #166534; font-weight: bold;">DIAGNOSTIC OUTCOME</div>
          <h2 style="margin: 4px 0 2px 0; color: #14532d; font-size: 22px; font-weight: 800;">
            ${data.disease} ${data.disease_kn ? `(${data.disease_kn})` : ''}
          </h2>
          <div style="display: flex; gap: 15px; margin-top: 10px; font-size: 13px;">
            <div><strong>Confidence Score:</strong> <span style="color: ${data.confidence >= 80 ? '#15803d' : '#d97706'}; font-weight: bold;">${data.confidence}%</span></div>
            <div><strong>Severity:</strong> <span style="font-weight: bold; color: #991b1b;">${details.severity || 'Moderate'}</span></div>
          </div>
          <div style="margin-top: 8px; font-size: 12px; color: #374151;">
            <strong>Causal Organism / Pathogen:</strong> <em>${details.pathogen || 'N/A'}</em>
          </div>
          ${data.low_confidence ? `
            <div style="margin-top: 8px; padding: 6px 10px; background: #fee2e2; border-left: 3px solid #dc2626; color: #991b1b; font-size: 11px;">
              ⚠ Warning: Low confidence detection (&lt;60%). Recommended to verify with on-site agronomist.
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Symptoms & Pathology -->
      <div style="margin-bottom: 20px;">
        <h3 style="color: #166534; font-size: 15px; border-bottom: 1px solid #d1fae5; padding-bottom: 4px; margin-bottom: 8px;">1. Clinical Symptoms Observed</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #374151;">
          ${(details.symptoms || []).map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>

      <!-- Treatment Directives -->
      <div style="display: flex; gap: 20px; margin-bottom: 20px;">
        <div style="flex: 1; background: #f9fafb; padding: 14px; border-radius: 6px; border: 1px solid #e5e7eb;">
          <h4 style="margin: 0 0 8px 0; color: #047857; font-size: 14px;">🌿 Organic & Bio-Control Remedies</h4>
          <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.5; color: #4b5563;">
            ${(details.organic_treatment || []).map(t => `<li>${t}</li>`).join('')}
          </ul>
        </div>
        <div style="flex: 1; background: #f9fafb; padding: 14px; border-radius: 6px; border: 1px solid #e5e7eb;">
          <h4 style="margin: 0 0 8px 0; color: #b45309; font-size: 14px;">🧪 Chemical Control & Dosages</h4>
          <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.5; color: #4b5563;">
            ${(details.chemical_treatment || []).map(t => `<li>${t}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Prevention Guidelines -->
      <div style="margin-bottom: 24px; background: #eff6ff; padding: 14px; border-radius: 6px; border: 1px solid #dbeafe;">
        <h4 style="margin: 0 0 6px 0; color: #1e40af; font-size: 14px;">🛡 Preventive Agronomic Guidelines</h4>
        <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.5; color: #1e3a8a;">
          ${(details.prevention || []).map(p => `<li>${p}</li>`).join('')}
        </ul>
      </div>

      <!-- Footer & Signature Box -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #6b7280;">
        <div>
          <div>Generated by: <strong>Arecanut AI Diagnostic System</strong></div>
          <div>Model: MobileNetV2 CNN Deep Learning Classifier</div>
          <div>Verification Mode: ${data.mode || 'Standard CNN Inference'}</div>
        </div>
        <div style="text-align: center; width: 180px; border-top: 1px dashed #9ca3af; padding-top: 6px;">
          Extension Officer / Agronomist Stamp
        </div>
      </div>
    </div>
  `;

  // Render to popup or download using html2pdf if available, else clean print window
  if (typeof html2pdf !== 'undefined') {
    const opt = {
      margin:       10,
      filename:     `Arecanut_Report_${data.disease.replace(/\s+/g, '_')}_${reportId}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    const element = document.createElement('div');
    element.innerHTML = reportHtml;
    html2pdf().set(opt).from(element.firstElementChild).save();
  } else {
    // Print window fallback
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Arecanut Diagnostic Report - ${data.disease}</title>
          <style>
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${reportHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const downloadPdfBtn = document.getElementById('download-pdf-btn');
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', downloadPDFReport);
  }
});

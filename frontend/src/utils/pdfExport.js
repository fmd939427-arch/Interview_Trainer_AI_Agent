import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportReportPDF({ elementId, name, role, level, averageScore, rating }) {
  const element = document.getElementById(elementId);
  if (!element) { console.warn('PDF export: element not found'); return; }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#020817',
      scale: 1.5,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const pageHeight = pdf.internal.pageSize.getHeight();

    let y = 0;
    let remaining = pdfHeight;

    while (remaining > 0) {
      pdf.addImage(imgData, 'PNG', 0, -y, pdfWidth, pdfHeight);
      remaining -= pageHeight;
      y += pageHeight;
      if (remaining > 0) pdf.addPage();
    }

    const filename = `Interview_Report_${name?.replace(/\s+/g,'_') ?? 'User'}_${new Date().toISOString().slice(0,10)}.pdf`;
    pdf.save(filename);
  } catch (err) {
    console.error('PDF export failed:', err);
    alert('PDF export failed. Try right-clicking and "Save as PDF" instead.');
  }
}

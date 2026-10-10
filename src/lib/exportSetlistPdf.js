import { jsPDF } from 'jspdf';

const PAGE_W = 210; // A4 mm
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

export function exportSetlistPdf(setlist, orderedSongs) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGIN;

  // Encabezado de marca
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(142, 154, 175); // #8e9aaf
  doc.text('ATRIL', MARGIN, y);
  y += 8;

  // Título del repertorio
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(20, 20, 20);
  const titleLines = doc.splitTextToSize(setlist.name || 'Repertorio', CONTENT_W);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 9 + 2;

  // Metadatos (lugar y fecha)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(120, 120, 120);
  const metaParts = [];
  if (setlist.venue) metaParts.push(setlist.venue);
  if (setlist.date) {
    try {
      metaParts.push(new Date(setlist.date + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }));
    } catch { metaParts.push(setlist.date); }
  }
  metaParts.push(`${orderedSongs.length} ${orderedSongs.length === 1 ? 'canción' : 'canciones'}`);
  doc.text(metaParts.join('  ·  '), MARGIN, y);
  y += 10;

  // Línea separadora
  doc.setDrawColor(225, 225, 225);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 8;

  // Lista de canciones
  orderedSongs.forEach((s, i) => {
    if (y > 280) { doc.addPage(); y = MARGIN; }

    const num = String(i + 1).padStart(2, '0');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(142, 154, 175);
    doc.text(num, MARGIN, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    const titleLines = doc.splitTextToSize(s.title || 'Sin título', CONTENT_W - 12);
    doc.text(titleLines, MARGIN + 12, y);

    if (s.artist) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(140, 140, 140);
      doc.text(s.artist, MARGIN + 12, y + 5);
      y += titleLines.length * 5 + 5;
    } else {
      y += titleLines.length * 5;
    }

    // Detalles (tono, BPM, duración)
    const details = [];
    if (s.key) details.push(s.key);
    if (s.bpm) details.push(`${s.bpm} BPM`);
    if (s.duration) details.push(`${Math.round(s.duration / 60)} min`);
    if (details.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(160, 160, 160);
      doc.text(details.join('  ·  '), MARGIN + 12, y + 2);
      y += 5;
    }

    y += 7;
  });

  // Pie con nota de origen
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(170, 170, 170);
    doc.text(`Generado con Atril · atril.base44.app`, MARGIN, 290);
    doc.text(`${p} / ${pages}`, PAGE_W - MARGIN, 290, { align: 'right' });
  }

  const filename = `${(setlist.name || 'repertorio').replace(/[^\w\sáéíóúñ-]/gi, '').trim().replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
  return filename;
}
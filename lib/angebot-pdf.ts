import { jsPDF } from "jspdf";

export interface AngebotPdfData {
  nummer: string;
  betreff: string;
  beschreibung?: string;
  netto: number;
  mwst_satz: number;
  brutto: number;
  created_at: string;
  gueltig_bis?: string;
  kunde?: {
    firma?: string | null;
    ansprechpartner?: string | null;
    strasse?: string | null;
    plz?: string | null;
    ort?: string | null;
  } | null;
  firma?: {
    firmenname?: string | null;
    strasse?: string | null;
    plz?: string | null;
    ort?: string | null;
    telefon?: string | null;
    email?: string | null;
  } | null;
}

function kundeName(kunde: AngebotPdfData["kunde"]): string {
  if (!kunde) return "Kunde";
  return kunde.firma || kunde.ansprechpartner || "Kunde";
}

function kundeAdresse(kunde: AngebotPdfData["kunde"]): string {
  if (!kunde) return "";
  const parts = [kunde.strasse, [kunde.plz, kunde.ort].filter(Boolean).join(" ")].filter(Boolean);
  return parts.join(", ");
}

/** Erzeugt ein Angebots-PDF (Client & Server). */
export function buildAngebotPdf(data: AngebotPdfData): jsPDF {
  const doc = new jsPDF();
  const primaryColor: [number, number, number] = [37, 99, 235];
  const darkColor: [number, number, number] = [15, 23, 42];
  const grayColor: [number, number, number] = [100, 116, 139];

  const brandName = data.firma?.firmenname || "MeisterFlow";

  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(brandName, 15, 20);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Angebot", 15, 28);

  doc.setTextColor(...darkColor);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("ANGEBOT", 15, 55);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayColor);
  doc.text(`Angebotsnummer: ${data.nummer}`, 15, 65);
  doc.text(`Datum: ${new Date(data.created_at).toLocaleDateString("de-DE")}`, 15, 70);
  if (data.gueltig_bis) {
    doc.text(`Gültig bis: ${new Date(data.gueltig_bis).toLocaleDateString("de-DE")}`, 15, 75);
  }

  if (data.kunde) {
    doc.setFillColor(248, 250, 252);
    doc.rect(120, 50, 75, 35, "F");
    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Kunde:", 125, 58);
    doc.setFont("helvetica", "normal");
    doc.text(kundeName(data.kunde), 125, 64);
    if (data.kunde.firma && data.kunde.ansprechpartner && data.kunde.firma !== data.kunde.ansprechpartner) {
      doc.text(data.kunde.ansprechpartner, 125, 69);
    }
    const adresse = kundeAdresse(data.kunde);
    if (adresse) {
      const y = data.kunde.firma && data.kunde.ansprechpartner && data.kunde.firma !== data.kunde.ansprechpartner ? 74 : 69;
      doc.text(adresse, 125, y);
    }
  }

  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(15, 90, 195, 90);

  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Betreff:", 15, 100);
  doc.setFont("helvetica", "normal");
  doc.text(data.betreff, 15, 107);

  const description = data.beschreibung ?? data.betreff;
  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  const splitDesc = doc.splitTextToSize(description, 180);
  doc.text(splitDesc, 15, 118);

  const tableY = 140 + splitDesc.length * 5;

  doc.setFillColor(...primaryColor);
  doc.rect(15, tableY, 180, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Pos.", 20, tableY + 7);
  doc.text("Beschreibung", 40, tableY + 7);
  doc.text("Netto", 140, tableY + 7);
  doc.text("MwSt.", 165, tableY + 7);

  doc.setFillColor(248, 250, 252);
  doc.rect(15, tableY + 10, 180, 10, "F");
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "normal");
  doc.text("1", 20, tableY + 17);
  const shortDesc = description.length > 40 ? description.substring(0, 40) + "..." : description;
  doc.text(shortDesc, 40, tableY + 17);
  doc.text(`${Number(data.netto).toFixed(2)} €`, 140, tableY + 17);
  doc.text(`${data.mwst_satz}%`, 165, tableY + 17);

  const sumY = tableY + 30;
  doc.setFillColor(248, 250, 252);
  doc.rect(120, sumY, 75, 35, "F");

  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.text("Nettosumme:", 125, sumY + 8);
  doc.text(`MwSt. (${data.mwst_satz}%):`, 125, sumY + 16);

  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.text("Gesamtbetrag:", 125, sumY + 28);

  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text(`${Number(data.netto).toFixed(2)} €`, 185, sumY + 8, { align: "right" });
  doc.text(`${(Number(data.brutto) - Number(data.netto)).toFixed(2)} €`, 185, sumY + 16, { align: "right" });

  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`${Number(data.brutto).toFixed(2)} €`, 185, sumY + 28, { align: "right" });

  doc.setDrawColor(...grayColor);
  doc.setLineWidth(0.3);
  doc.line(15, 270, 195, 270);

  doc.setTextColor(...grayColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  if (data.firma?.telefon || data.firma?.email) {
    doc.text(
      [data.firma.telefon, data.firma.email].filter(Boolean).join(" · "),
      15,
      278,
    );
  } else {
    doc.text("Erstellt mit MeisterFlow", 15, 278);
  }
  doc.text("Dieses Dokument wurde automatisch generiert.", 15, 283);

  return doc;
}

export function angebotPdfBytes(data: AngebotPdfData): Uint8Array {
  const doc = buildAngebotPdf(data);
  const arrayBuffer = doc.output("arraybuffer");
  return new Uint8Array(arrayBuffer);
}

"use client";

import { useState } from "react";
import { FileText, Download, Loader2 } from "lucide-react";
import { getKundeName, formatKundeAdresse } from "@/lib/kunde-utils";
import { Kunde } from "@/types";
import toast from "react-hot-toast";

interface PDFExportProps {
  type: "angebot" | "rechnung";
  data: {
    nummer: string;
    betreff: string;
    beschreibung?: string;
    netto: number;
    mwst_satz: number;
    brutto: number;
    created_at: string;
    kunde?: Kunde;
    gueltig_bis?: string;
    faellig_am?: string;
    status?: string;
  };
}

export default function PDFExport({ type, data }: PDFExportProps) {
  const [loading, setLoading] = useState(false);

  const generatePDF = async () => {
    setLoading(true);
    try {
      // Dynamischer Import von jsPDF (Client-side only)
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      const isAngebot = type === "angebot";
      const title = isAngebot ? "ANGEBOT" : "RECHNUNG";
      const subTitle = isAngebot ? "Angebotsnummer" : "Rechnungsnummer";
      const dateLabel = isAngebot ? "Gültig bis" : "Fällig am";
      const dateValue = isAngebot ? data.gueltig_bis : data.faellig_am;

      // Farben
      const primaryColor: [number, number, number] = [37, 99, 235]; // brand-600
      const darkColor: [number, number, number] = [15, 23, 42]; // dark-950
      const grayColor: [number, number, number] = [100, 116, 139]; // dark-500

      // Header
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 35, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("MeisterFlow", 15, 20);

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Ihr Handwerksbetrieb", 15, 28);

      // Titel
      doc.setTextColor(...darkColor);
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text(title, 15, 55);

      // Nummer und Datum
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...grayColor);
      doc.text(`${subTitle}: ${data.nummer}`, 15, 65);
      doc.text(`Datum: ${new Date(data.created_at).toLocaleDateString("de-DE")}`, 15, 70);
      if (dateValue) {
        doc.text(`${dateLabel}: ${new Date(dateValue).toLocaleDateString("de-DE")}`, 15, 75);
      }

      // Kunden-Daten
      if (data.kunde) {
        doc.setFillColor(248, 250, 252);
        doc.rect(120, 50, 75, 35, "F");
        doc.setTextColor(...darkColor);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Kunde:", 125, 58);
        doc.setFont("helvetica", "normal");
        doc.text(getKundeName(data.kunde), 125, 64);
        if (data.kunde.firma && data.kunde.firma !== data.kunde.ansprechpartner) {
          doc.text(data.kunde.firma, 125, 69);
        }
        const adresse = formatKundeAdresse(data.kunde);
        if (adresse) {
          doc.text(adresse, 125, data.kunde.firma && data.kunde.firma !== data.kunde.ansprechpartner ? 74 : 69);
        }
      }

      // Trennlinie
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(15, 90, 195, 90);

      // Betreff
      doc.setTextColor(...darkColor);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Betreff:", 15, 100);
      doc.setFont("helvetica", "normal");
      doc.text(data.betreff, 15, 107);

      const description = data.beschreibung ?? data.betreff;

      // Beschreibung
      doc.setFontSize(10);
      doc.setTextColor(...grayColor);
      const splitDesc = doc.splitTextToSize(description, 180);
      doc.text(splitDesc, 15, 118);

      // Positionen-Tabelle
      const tableY = 140 + (splitDesc.length * 5);

      // Tabellen-Header
      doc.setFillColor(...primaryColor);
      doc.rect(15, tableY, 180, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Pos.", 20, tableY + 7);
      doc.text("Beschreibung", 40, tableY + 7);
      doc.text("Netto", 140, tableY + 7);
      doc.text("MwSt.", 165, tableY + 7);

      // Tabellen-Zeile
      doc.setFillColor(248, 250, 252);
      doc.rect(15, tableY + 10, 180, 10, "F");
      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "normal");
      doc.text("1", 20, tableY + 17);
      const shortDesc = description.length > 40 
        ? description.substring(0, 40) + "..." 
        : description;
      doc.text(shortDesc, 40, tableY + 17);
      doc.text(`${data.netto.toFixed(2)} €`, 140, tableY + 17);
      doc.text(`${data.mwst_satz}%`, 165, tableY + 17);

      // Summen-Box
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
      doc.text(`${data.netto.toFixed(2)} €`, 185, sumY + 8, { align: "right" });
      doc.text(`${(data.brutto - data.netto).toFixed(2)} €`, 185, sumY + 16, { align: "right" });

      doc.setTextColor(...primaryColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`${data.brutto.toFixed(2)} €`, 185, sumY + 28, { align: "right" });

      // Footer
      doc.setDrawColor(...grayColor);
      doc.setLineWidth(0.3);
      doc.line(15, 270, 195, 270);

      doc.setTextColor(...grayColor);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("MeisterFlow - Automatisierung für Handwerker", 15, 278);
      doc.text("Dieses Dokument wurde automatisch generiert.", 15, 283);

      // Speichern
      doc.save(`${title}_${data.nummer}.pdf`);
      toast.success("PDF erfolgreich erstellt!");
    } catch (error) {
      console.error(error);
      toast.error("Fehler beim Erstellen des PDFs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={loading}
      className="p-2 text-dark-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
      title="Als PDF exportieren"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
    </button>
  );
}

"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { getKundeName, formatKundeAdresse } from "@/lib/kunde-utils";
import { useData } from "@/contexts/DataContext";
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
  const { firmenprofil } = useData();

  const generatePDF = async () => {
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      const isAngebot = type === "angebot";
      const title = isAngebot ? "ANGEBOT" : "RECHNUNG";
      const primary: [number, number, number] = [99, 102, 241];
      const dark: [number, number, number] = [15, 23, 42];
      const gray: [number, number, number] = [100, 116, 139];

      const firma = firmenprofil?.firmenname || "Handwerksbetrieb";
      const inhaber = firmenprofil?.inhaber_name || "";
      const strasse = firmenprofil?.strasse || "";
      const plzOrt = [firmenprofil?.plz, firmenprofil?.ort].filter(Boolean).join(" ");
      const telefon = firmenprofil?.telefon || "";
      const email = firmenprofil?.email || "";
      const steuernummer = firmenprofil?.steuernummer || "";
      const ustId = firmenprofil?.ust_id || "";
      const bank = firmenprofil?.bankverbindung || "";
      const hinweis =
        firmenprofil?.rechnungshinweis ||
        "Bitte überweisen Sie den Betrag innerhalb der Zahlungsfrist.";
      const zahlungsziel = firmenprofil?.zahlungsziel_tage ?? 14;

      // Header
      doc.setFillColor(...primary);
      doc.rect(0, 0, 210, 32, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(firma, 15, 14);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const headerLine = [inhaber, strasse, plzOrt, telefon].filter(Boolean).join(" · ");
      if (headerLine) doc.text(headerLine.slice(0, 95), 15, 22);
      if (email) doc.text(email, 15, 28);

      // Titel
      doc.setTextColor(...dark);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(title, 15, 48);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...gray);
      const ausstellungsdatum = new Date(data.created_at).toLocaleDateString("de-DE");
      doc.text(`${isAngebot ? "Angebotsnummer" : "Rechnungsnummer"}: ${data.nummer}`, 15, 56);
      doc.text(`Ausstellungsdatum: ${ausstellungsdatum}`, 15, 61);
      if (isAngebot && data.gueltig_bis) {
        doc.text(`Gültig bis: ${new Date(data.gueltig_bis).toLocaleDateString("de-DE")}`, 15, 66);
      }
      if (!isAngebot && data.faellig_am) {
        doc.text(`Zahlungsziel / Fällig am: ${new Date(data.faellig_am).toLocaleDateString("de-DE")}`, 15, 66);
      } else if (!isAngebot) {
        doc.text(`Zahlungsziel: ${zahlungsziel} Tage`, 15, 66);
      }

      // Leistender (links) – Pflichtangabe
      let y = 78;
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 85, 42, "F");
      doc.setTextColor(...dark);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Leistender (Absender):", 18, y + 7);
      doc.setFont("helvetica", "normal");
      doc.text(firma, 18, y + 14);
      let ly = y + 19;
      if (inhaber) {
        doc.text(inhaber, 18, ly);
        ly += 5;
      }
      if (strasse) {
        doc.text(strasse, 18, ly);
        ly += 5;
      }
      if (plzOrt) {
        doc.text(plzOrt, 18, ly);
        ly += 5;
      }
      if (steuernummer) doc.text(`Steuernr.: ${steuernummer}`, 18, Math.min(ly, y + 38));
      if (ustId) doc.text(`USt-IdNr.: ${ustId}`, 18, Math.min(ly + (steuernummer ? 5 : 0), y + 38));

      // Empfänger
      doc.setFillColor(248, 250, 252);
      doc.rect(110, y, 85, 42, "F");
      doc.setFont("helvetica", "bold");
      doc.text("Leistungsempfänger:", 113, y + 7);
      doc.setFont("helvetica", "normal");
      if (data.kunde) {
        doc.text(getKundeName(data.kunde), 113, y + 14);
        let ry = y + 19;
        if (data.kunde.firma && data.kunde.firma !== data.kunde.ansprechpartner) {
          doc.text(data.kunde.firma, 113, ry);
          ry += 5;
        }
        if (data.kunde.strasse) {
          doc.text(data.kunde.strasse, 113, ry);
          ry += 5;
        }
        const ka = [data.kunde.plz, data.kunde.ort].filter(Boolean).join(" ");
        if (ka) doc.text(ka, 113, ry);
      } else {
        doc.text("—", 113, y + 14);
      }

      y = 128;
      doc.setDrawColor(...primary);
      doc.setLineWidth(0.4);
      doc.line(15, y, 195, y);

      y += 10;
      doc.setTextColor(...dark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Leistungsbeschreibung", 15, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Betreff: ${data.betreff}`, 15, y);
      y += 6;
      const description = data.beschreibung ?? data.betreff;
      const splitDesc = doc.splitTextToSize(description, 180);
      doc.setTextColor(...gray);
      doc.text(splitDesc, 15, y);
      y += splitDesc.length * 5 + 8;

      // Menge/Art Tabelle (§14 UStG)
      doc.setFillColor(...primary);
      doc.rect(15, y, 180, 9, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Pos.", 18, y + 6);
      doc.text("Menge / Art der Leistung", 32, y + 6);
      doc.text("Netto", 150, y + 6);
      doc.text("USt.", 175, y + 6);
      y += 9;
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 10, "F");
      doc.setTextColor(...dark);
      doc.setFont("helvetica", "normal");
      doc.text("1", 18, y + 7);
      const art = (data.betreff || "Handwerksleistung").slice(0, 55);
      doc.text(`1 × ${art}`, 32, y + 7);
      doc.text(`${data.netto.toFixed(2)} EUR`, 150, y + 7);
      doc.text(`${data.mwst_satz}%`, 175, y + 7);

      y += 20;
      const steuer = data.brutto - data.netto;
      doc.setFillColor(248, 250, 252);
      doc.rect(115, y, 80, 32, "F");
      doc.setFontSize(10);
      doc.setTextColor(...gray);
      doc.text("Nettobetrag:", 120, y + 8);
      doc.text(`Umsatzsteuer (${data.mwst_satz}%):`, 120, y + 16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...dark);
      doc.text("Bruttobetrag:", 120, y + 26);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...gray);
      doc.text(`${data.netto.toFixed(2)} EUR`, 190, y + 8, { align: "right" });
      doc.text(`${steuer.toFixed(2)} EUR`, 190, y + 16, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...primary);
      doc.text(`${data.brutto.toFixed(2)} EUR`, 190, y + 26, { align: "right" });

      y += 40;
      if (!isAngebot) {
        doc.setTextColor(...dark);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Zahlungsinformationen", 15, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...gray);
        const payLines = doc.splitTextToSize(hinweis, 180);
        doc.text(payLines, 15, y);
        y += payLines.length * 4 + 4;
        if (bank) {
          doc.text(`Bankverbindung: ${bank}`, 15, y);
          y += 6;
        }
        doc.setFontSize(8);
        doc.setTextColor(...primary);
        doc.text("Rechnung erstellt nach GoBD-Richtlinien / § 14 UStG.", 15, y);
        y += 8;
      }

      // Footer
      doc.setDrawColor(...gray);
      doc.setLineWidth(0.2);
      doc.line(15, 275, 195, 275);
      doc.setTextColor(...gray);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      const footerBits = [firma, steuernummer ? `St.-Nr. ${steuernummer}` : "", ustId ? `USt-Id ${ustId}` : ""]
        .filter(Boolean)
        .join(" · ");
      doc.text(footerBits || "MeisterFlow", 15, 280);
      doc.text("Erstellt mit MeisterFlow", 195, 280, { align: "right" });

      doc.save(`${title}_${data.nummer}.pdf`);
      toast.success("PDF erstellt");
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
      className="p-2 text-dark-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
      title="Als PDF exportieren"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
    </button>
  );
}

export type VideoPackage = {
  id: string;
  created_at: string;
  gewerk: string;
  thema: string;
  laenge_sek: number;
  plattform: string;
  hook: string;
  szenen: { zeit: string; bild: string; text_on_screen: string }[];
  sprechertext: string;
  captions: string[];
  caption_post: string;
  hashtags: string[];
  checklist: string[];
  capcut_tipp: string;
};

export type OutreachDraft = {
  name: string;
  firma: string;
  stadt: string;
  email: string;
  subject: string;
  body: string;
};

export type OutreachLogEntry = {
  at: string;
  email: string;
  subject: string;
  user_id: string;
};

/** Parse "Name;Firma;Stadt;Email" lines */
export function parseOutreachLeads(raw: string): {
  name: string;
  firma: string;
  stadt: string;
  email: string;
}[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(";").map((p) => p.trim());
      if (parts.length >= 4) {
        return { name: parts[0], firma: parts[1], stadt: parts[2], email: parts[3] };
      }
      if (parts.length === 1 && parts[0].includes("@")) {
        return { name: "", firma: "", stadt: "", email: parts[0] };
      }
      return null;
    })
    .filter(
      (x): x is { name: string; firma: string; stadt: string; email: string } =>
        !!x && !!x.email,
    );
}

export function videoPackageToUploadText(pkg: VideoPackage): string {
  return `MEISTERFLOW VIDEO-PAKET
========================
Gewerk: ${pkg.gewerk}
Thema: ${pkg.thema}
Länge: ${pkg.laenge_sek}s | Plattform: ${pkg.plattform}
Erstellt: ${pkg.created_at}

HOOK
----
${pkg.hook}

SZENEN / SHOTLIST
-----------------
${pkg.szenen
  .map((s, i) => `${i + 1}. [${s.zeit}] ${s.bild}\n   On-Screen: ${s.text_on_screen}`)
  .join("\n\n")}

SPRECHERTEXT
------------
${pkg.sprechertext}

CAPTIONS (On-Screen Zeilen)
---------------------------
${pkg.captions.map((c, i) => `${i + 1}. ${c}`).join("\n")}

POST-CAPTION (kopieren)
-----------------------
${pkg.caption_post}

HASHTAGS
--------
${pkg.hashtags.join(" ")}

UPLOAD-CHECKLISTE
-----------------
${pkg.checklist.map((c) => `☐ ${c}`).join("\n")}

CAPCUT-TIPP
-----------
${pkg.capcut_tipp}
`;
}

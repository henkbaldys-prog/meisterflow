import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { FotoAngebotData, SpracheAngebotData, SpracheTerminData } from "@/types";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o-mini";

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY fehlt");
  return new OpenAI({ apiKey });
}

export function parseJsonFromLLM<T>(text: string): T {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw) as T;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createChatCompletion(
  prompt: string,
  maxTokens: number,
  temperature: number
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY fehlt");

  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI API Fehler ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      return data?.choices?.[0]?.message?.content || "";
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(500 * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("OpenAI Request fehlgeschlagen");
}

export async function generateAngebot(beschreibung: string, kundenName: string): Promise<string> {
  const prompt = `Du bist ein erfahrener Handwerker und schreibst professionelle Angebote auf Deutsch.

Erstelle ein professionelles Angebot basierend auf folgender Beschreibung:
"${beschreibung}"

Das Angebot sollte enthalten:
- Eine freundliche Einleitung
- Eine detaillierte Beschreibung der Leistungen
- Einen Preisrahmen (wenn möglich)
- Zahlungsbedingungen
- Gültigkeitsdauer

Formatiere es als professionelles Geschäftsangebot an ${kundenName}.`;

  return createChatCompletion(prompt, 1500, 0.7);
}

export async function generateRechnungText(angebotBeschreibung: string): Promise<string> {
  const prompt = `Wandle folgende Angebotsbeschreibung in eine professionelle Rechnungsposition um:
"${angebotBeschreibung}"

Erstelle eine klare, einzeilige Position mit kurzer Beschreibung.`;

  return createChatCompletion(prompt, 200, 0.3);
}

export async function generateEmailAntwort(
  emailInhalt: string,
  kundenName: string,
  kontext: string
): Promise<string> {
  const prompt = `Du bist ein freundlicher Handwerker. Beantworte folgende E-Mail professionell auf Deutsch:

Kunde: ${kundenName}
Kontext: ${kontext}
E-Mail: "${emailInhalt}"

Schreibe eine höfliche, professionelle Antwort.`;

  return createChatCompletion(prompt, 800, 0.7);
}

export async function generateWhatsAppAntwort(nachricht: string, kundenName: string): Promise<string> {
  const prompt = `Du bist ein Handwerker und antwortest kurz und freundlich auf WhatsApp auf Deutsch.

Kunde: ${kundenName}
Nachricht: "${nachricht}"

Antworte in 1-3 Sätzen, locker und freundlich.`;

  return createChatCompletion(prompt, 200, 0.8);
}

export async function generateTagesuebersicht(
  zahlen: Record<string, number>,
  aeltesteOffeneAngebote: unknown[],
  ueberfaelligeRechnungen: unknown[],
  ungeöffneteAngebote: unknown[] = [],
): Promise<string> {
  const prompt = `Du bist Geschäftsführer-Assistent für einen Handwerker.

Aktuelle Zahlen: ${JSON.stringify(zahlen)}
Liste der 3 ältesten offenen Angebote (Entwürfe): ${JSON.stringify(aeltesteOffeneAngebote)}
Versendete Angebote, die der Kunde noch NICHT geöffnet hat: ${JSON.stringify(ungeöffneteAngebote)}
Liste der überfälligen Rechnungen: ${JSON.stringify(ueberfaelligeRechnungen)}

Gib EINE konkrete, pragmatische Handlungsempfehlung in 1-2 Sätzen.
Priorität: ungeöffnete Angebote nachfassen > überfällige Rechnungen > Entwürfe abschicken.
Beispiele:
- "3 Angebote noch nicht geöffnet – bei Müller nachfassen?"
- "Angebot Nr. 14 für Müller Bau sollten Sie heute abschicken – wartet seit 5 Tagen."
- "Rechnung Nr. 7 über 2.450 € ist seit 3 Tagen überfällig – Mahnung prüfen?"

Sei direkt, nicht zu formell. Max. 2 Sätze.`;

  return createChatCompletion(prompt, 200, 0.6);
}

export async function transcribeAudio(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  const openai = getOpenAIClient();
  const file = await toFile(buffer, filename, { type: mimeType });
  const result = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "de",
  });
  return result.text?.trim() || "";
}

export async function extractSpracheAngebot(transcript: string): Promise<SpracheAngebotData> {
  const prompt = `Du bist Handwerker-Experte. Aus diesem Sprachnotiz extrahiere:
- kunde_name (oder null)
- leistung (Hauptarbeit)
- material (benötigtes Material)
- menge (Fläche, Stückzahl, Länge – mit Einheit)
- besonderheiten (Altlasten, schwer erreichbar, etc. oder null)
- geschätzte_dauer_stunden (oder null)
- zusammenfassung (1 Satz für den Nutzer)

Text: '${transcript.replace(/'/g, "''")}'

Antworte NUR als gültiges JSON. Kein Markdown, kein Code-Block.`;

  const raw = await createChatCompletion(prompt, 500, 0.2);
  return parseJsonFromLLM<SpracheAngebotData>(raw);
}

export async function extractSpracheTermin(transcript: string): Promise<SpracheTerminData> {
  const today = new Date().toISOString().split("T")[0];
  const prompt = `Du bist Handwerker-Assistent. Heute ist ${today}.
Aus dieser Sprachnotiz extrahiere:
- kunde_name (oder null)
- titel (was ist der Termin?)
- datum (ISO YYYY-MM-DD wenn erkennbar; "morgen", "heute" etc. in Datum umrechnen, sonst null)
- uhrzeit_von (HH:MM 24h wenn genannt, sonst null)
- uhrzeit_bis (HH:MM 24h wenn genannt, sonst null)
- ort (wenn genannt, sonst null)
- notizen (sonstige Infos oder null)
- zusammenfassung (1 Satz für den Nutzer)

Text: '${transcript.replace(/'/g, "''")}'

Antworte NUR als gültiges JSON. Kein Markdown, kein Code-Block.`;

  const raw = await createChatCompletion(prompt, 500, 0.2);
  return parseJsonFromLLM<SpracheTerminData>(raw);
}

export async function analyzeBaustellenFoto(
  base64: string,
  mimeType: string,
): Promise<FotoAngebotData> {
  const prompt = `Du bist erfahrener Handwerker. Analysiere dieses Baustellenfoto.

Beschreibe:
1. Was ist auf dem Foto zu sehen? (Raum, Zustand, Materialien)
2. Welche Arbeiten sind nötig?
3. Welche Materialien werden wahrscheinlich benötigt?
4. Geschätzter Zeitaufwand?

WICHTIG: Weise ausdrücklich darauf hin, dass dies nur eine KI-Schätzung ist und vor Ort geprüft werden muss.

Antworte als JSON:
{
  "beschreibung": "...",
  "arbeiten": ["...", "..."],
  "materialien": ["...", "..."],
  "geschätzter_aufwand": "...",
  "hinweis": "Dies ist eine KI-Schätzung. Bitte vor Ort prüfen.",
  "angebotsvorschlag": "Professioneller Text für ein Angebot basierend auf dem Foto"
}`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY fehlt");

  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64}`,
                    detail: "low",
                  },
                },
              ],
            },
          ],
          max_tokens: 1200,
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI API Fehler ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || "";
      return parseJsonFromLLM<FotoAngebotData>(content);
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(500 * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Vision-Analyse fehlgeschlagen");
}

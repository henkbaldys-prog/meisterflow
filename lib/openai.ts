const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o-mini";

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

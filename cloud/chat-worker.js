// Cloud-Funktion für den ReRoom-Chatbot (Cloudflare Workers, Gratis-Tarif reicht zum Ausprobieren).
// Der API-Schlüssel steht nur hier als Secret (ANTHROPIC_API_KEY), nie in der App.
//
// So geht es:
//   1. Konto bei Cloudflare und bei Anthropic anlegen, einen API-Schlüssel erzeugen.
//   2. `npx wrangler deploy cloud/chat-worker.js --name reroom-chat` und `npx wrangler secret put ANTHROPIC_API_KEY`.
//   3. Die Adresse des Workers als VITE_CHAT_URL in den GitHub-Einstellungen (Variables) eintragen und neu bauen.
// Die KI-Nutzung kostet Geld. Ohne diese Schritte nutzt die App den lokalen Chatbot.

const ERLAUBT = "https://fizzbeats.github.io";
const MODELL = "claude-haiku-5-5";

const SYSTEM = `Du bist der Assistent von ReRoom, einer App zum Einrichten. Du bekommst die Frage eines Kunden, die Maße seines Raums und einen Katalog mit Möbeln.
Empfiehl höchstens 3 Möbel aus dem Katalog, die zu Frage, Budget, Stil und Farbe passen und in den Raum und durch die Tür passen.
Antworte kurz, freundlich und auf Deutsch. Erfinde keine Möbel und keine Preise. Antworte NUR mit JSON: {"text": "...", "moebelIds": ["id1", "id2"]}.`;

export default {
  async fetch(request, env) {
    const kopf = {
      "access-control-allow-origin": ERLAUBT,
      "access-control-allow-headers": "content-type",
      "content-type": "application/json",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: kopf });
    if (request.method !== "POST") return new Response("{}", { status: 405, headers: kopf });
    if (request.headers.get("origin") !== ERLAUBT) return new Response("{}", { status: 403, headers: kopf });

    let eingabe;
    try {
      eingabe = await request.json();
    } catch {
      return new Response("{}", { status: 400, headers: kopf });
    }
    const frage = String(eingabe.frage ?? "").slice(0, 500);
    if (!frage || !Array.isArray(eingabe.katalog) || eingabe.katalog.length > 200) return new Response("{}", { status: 400, headers: kopf });

    const antwort = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODELL,
        max_tokens: 400,
        system: SYSTEM,
        messages: [{ role: "user", content: JSON.stringify({ frage, raum: eingabe.raum ?? null, katalog: eingabe.katalog }) }],
      }),
    });
    if (!antwort.ok) return new Response("{}", { status: 502, headers: kopf });
    const daten = await antwort.json();
    const text = daten.content?.[0]?.text ?? "";
    try {
      const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
      return new Response(JSON.stringify({ text: String(json.text ?? ""), moebelIds: Array.isArray(json.moebelIds) ? json.moebelIds : [] }), { headers: kopf });
    } catch {
      return new Response("{}", { status: 502, headers: kopf });
    }
  },
};

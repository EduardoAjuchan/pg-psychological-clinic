import { google } from "googleapis";
import * as configService from "../services/config.service";

const SCOPES = (process.env.GOOGLE_SCOPES || "https://www.googleapis.com/auth/calendar.events").split(",");

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// URL de consentimiento
export function getAuthUrl() {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

// Intercambio code -> tokens y guardado en BD
export async function exchangeCodeForTokens(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  await configService.set("google_tokens_json", JSON.stringify(tokens), "json", "Tokens OAuth Google Calendar");
  return tokens;
}

// === FALTABA: crear cliente autorizado leyendo tokens desde BD ===
export async function getAuthorizedClient() {
  const client = getOAuth2Client();
  const tokensJson = await configService.get("google_tokens_json");
  if (!tokensJson) throw new Error("No hay tokens guardados en configuración. Conecta primero /api/google/connect.");
  const tokens = JSON.parse(tokensJson);
  client.setCredentials(tokens);

  // si Google refresca tokens, los persistimos
  client.on("tokens", async (newTokens) => {
    if (newTokens.refresh_token || newTokens.access_token) {
      const merged = { ...tokens, ...newTokens };
      await configService.set("google_tokens_json", JSON.stringify(merged), "json", "Tokens OAuth Google Calendar (refreshed)");
    }
  });

  return client;
}

// === FALTABA: helper para insertar un evento ===
export async function insertCalendarEvent(opts: {
  summary: string;
  description?: string;
  startDateTimeISO: string; // "YYYY-MM-DDTHH:mm:ss"
  endDateTimeISO: string;   // idem
  timeZone?: string;
  attendees?: Array<{ email: string }>;
}) {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: "v3", auth });
  const calendarId = (await configService.get("google_calendar_id")) || "primary";
  const timeZone = opts.timeZone || process.env.DEFAULT_TZ || "America/Guatemala";

  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: opts.summary,
      description: opts.description,
      start: { dateTime: opts.startDateTimeISO, timeZone },
      end:   { dateTime: opts.endDateTimeISO,   timeZone },
      attendees: opts.attendees,
    },
  });

  return res.data; // id, htmlLink, etc.
}
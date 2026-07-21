/* ================= ETHIO KIRAY — DAILY CHANNEL DIGEST =================
   Triggered once a day by Vercel Cron (see vercel.json) and posts 3-5
   listings to your Telegram channel automatically — no manual posting.

   ONE-TIME SETUP:
   1. Create a Telegram channel (Telegram app -> pencil icon -> New Channel).
   2. Add this bot as an ADMIN of that channel with "Post Messages" allowed
      (Channel -> channel name -> Administrators -> Add Admin -> your bot).
      This step can't be done from code — it's a Telegram app action.
   3. Add two environment variables on Vercel:
        KIRAY_CHANNEL_ID — the channel's @username (public channels — easiest),
                            or its numeric id like -1001234567890 (private
                            channels; see README-TELEGRAM.md for how to find it)
        CRON_SECRET      — any random string, 16+ characters
   4. Deploy. Vercel reads vercel.json and registers the daily schedule
      automatically — nothing else to run or trigger by hand.

   Reuses the same TELEGRAM_BOT_TOKEN / KIRAY_APP_URL as the main bot, and
   the same LISTINGS data as the app, so prices/photos/pins always match
   what's live in the app.

   Button design note: unlike the private-chat bot, channel posts can only
   use plain "url" buttons — Telegram restricts callback_data replies and
   web_app buttons to private chats. "Open Ethio Kiray" links straight to
   the app instead, and works for every viewer regardless of whether
   they've started the bot.

   Selection is deterministic per UTC day (seeded by today's date), so if
   Vercel's cron ever fires twice in the same day — a known possibility,
   not a guarantee of exactly-once delivery — both runs post the same
   content rather than two different, confusing digests. It does NOT
   prevent an actual duplicate post; that would need a persistent store
   (e.g. Vercel KV) to remember "already posted today", which isn't set up.
*/
import { LISTINGS } from "../src/data/listings.js";

const API = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const APP_URL = process.env.KIRAY_APP_URL;
const CHANNEL_ID = process.env.KIRAY_CHANNEL_ID;

const birr = (n) => `${n.toLocaleString("en-US")} ETB/month`;

// Every Telegram call goes through here so failures are never silently
// swallowed — a wrong/missing admin permission on the channel, for example,
// makes Telegram return HTTP 200 or 403 with { ok: false, description }
// rather than throwing, so a plain try/catch around fetch() would miss it.
const errors = [];
async function call(method, body, label) {
  let data;
  try {
    const res = await fetch(`${API()}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    data = await res.json();
  } catch (e) {
    data = { ok: false, description: e.message };
  }
  if (!data.ok) errors.push({ step: label, method, error: data.description || "unknown error" });
  return data;
}

/* ---------- deterministic "pick of the day" ---------- */

function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(h, 31) + seed.charCodeAt(i)) | 0;
  return () => {
    h = (Math.imul(h ^ (h >>> 15), 1 | h) + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 7), 61 | h);
    t = (t ^ (t + Math.imul(t ^ (t >>> 7), t | 61))) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickDailyListings() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
  const rand = seededRandom(today);
  const shuffled = [...LISTINGS].sort(() => rand() - 0.5);
  const count = 3 + Math.floor(rand() * 3); // 3, 4, or 5 — varies day to day
  return { today, picks: shuffled.slice(0, count) };
}

/* ---------- Telegram API calls (channel-safe subset) ---------- */

async function sendMessage(chatId, text, extra = {}, label = "message") {
  return call("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...extra }, label);
}

async function sendVenuePin(chatId, l) {
  if (typeof l.lat !== "number" || typeof l.lng !== "number") return;
  await call(
    "sendVenue",
    { chat_id: chatId, latitude: l.lat, longitude: l.lng, title: l.title, address: `${l.hood}, ${l.city}` },
    `listing ${l.id} venue pin`
  );
}

async function sendPhotoAlbum(chatId, l) {
  const photos = (l.photos || []).slice(0, 7);
  if (photos.length === 0) return;
  if (photos.length === 1) {
    await call("sendPhoto", { chat_id: chatId, photo: photos[0], caption: l.title }, `listing ${l.id} photo`);
    return;
  }
  await call(
    "sendMediaGroup",
    { chat_id: chatId, media: photos.map((url, i) => ({ type: "photo", media: url, ...(i === 0 ? { caption: l.title } : {}) })) },
    `listing ${l.id} photo album`
  );
}

function formatListing(l) {
  const lines = [
    `🏠 <b>${l.title}</b>${l.verified ? " ✅" : ""}`,
    `📍 ${l.hood}, ${l.city}`,
    `💰 ${birr(l.price)}`,
  ];
  if (l.beds) lines.push(`🛏 ${l.beds} bed${l.beds > 1 ? "s" : ""} · ${l.size} m²`);
  else lines.push(`📐 ${l.size} m² · ${l.kind}`);
  return lines.join("\n");
}

function listingButtons(l) {
  const rows = [[{ text: "📞 Call · ደውል", url: `tel:${l.phone}` }]];
  if (APP_URL) rows.push([{ text: "🌍 View in app · በመተግበሪያ ይመልከቱ", url: `${APP_URL}?listing=${l.id}` }]);
  return { inline_keyboard: rows };
}

/* ---------- entry point ---------- */

export default async function handler(req, res) {
  errors.length = 0; // module state can survive across warm serverless invocations — start clean each run

  // Vercel attaches this header automatically on cron-triggered requests,
  // once CRON_SECRET exists as an env var on the project.
  if (process.env.CRON_SECRET && req.headers["authorization"] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  if (!CHANNEL_ID) {
    return res.status(500).json({ ok: false, error: "KIRAY_CHANNEL_ID is not set" });
  }

  const { today, picks } = pickDailyListings();

  await sendMessage(
    CHANNEL_ID,
    `📅 <b>${today}</b> — today's ${picks.length} picks on Ethio Kiray 🏠\nየዛሬ ${picks.length} ምርጦች በኢትዮ ኪራይ`,
    {},
    "header"
  );

  for (const l of picks) {
    await sendPhotoAlbum(CHANNEL_ID, l);
    await sendVenuePin(CHANNEL_ID, l);
    await sendMessage(CHANNEL_ID, formatListing(l), { reply_markup: listingButtons(l) }, `listing ${l.id} card`);
  }

  if (APP_URL) {
    await sendMessage(
      CHANNEL_ID,
      "See everything on the map 👇 · ሁሉንም በካርታ ይመልከቱ",
      { reply_markup: { inline_keyboard: [[{ text: "🌍 Open Ethio Kiray", url: APP_URL }]] } },
      "footer"
    );
  }

  return res.status(errors.length ? 502 : 200).json({
    ok: errors.length === 0,
    date: today,
    posted: picks.length,
    listingIds: picks.map((l) => l.id),
    ...(errors.length ? { errors } : {}),
  });
}

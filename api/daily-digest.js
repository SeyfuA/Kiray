/* ================= ETHIO KIRAY — DAILY CHANNEL DIGEST =================
   Triggered once a day by Vercel Cron (see vercel.json) and posts 3-5
   listings to your Telegram channel automatically — no manual posting.

   ONE-TIME SETUP:
   1. Create a Telegram channel (Telegram app -> pencil icon -> New Channel).
   2. Add this bot as an ADMIN of that channel with "Post Messages" allowed
      (Channel -> channel name -> Administrators -> Add Admin -> your bot).
      This step can't be done from code — it's a Telegram app action.
   3. Register a Telegram "Direct Link Mini App" so channel posts can open
      the real app WITH the visitor's profile — message @BotFather ->
      /newapp -> pick this bot -> give it a name, description, and 640x360
      photo (GIF step: send /empty) -> when asked for the Web App URL, use
      the same URL as KIRAY_APP_URL -> choose a short name (e.g. "app").
      Without this step, listings post with NO button at all (the channel
      deliberately only ever links to the app, never to a bot chat — see
      the note by listingButtons() below) — the phone number in the text
      is still there either way.
   4. Add four environment variables on Vercel:
        KIRAY_CHANNEL_ID   — the channel's @username (public channels — easiest),
                             or its numeric id like -1001234567890 (private
                             channels; see README-TELEGRAM.md for how to find it)
        KIRAY_BOT_USERNAME — the bot's @username, WITHOUT the @
                             (e.g. EthioKirayBot) — this is part of the
                             "Open in app" link's URL (t.me/<bot>/<app>),
                             not a separate bot-chat feature
        KIRAY_MINIAPP_SHORTNAME — the short name chosen in step 3 (e.g. "app")
                             — also needed for the "Open in app" link;
                             without either of these two, that button is
                             just omitted
        CRON_SECRET        — any random string, 16+ characters
   5. Deploy. Vercel reads vercel.json and registers the daily schedule
      automatically — nothing else to run or trigger by hand.

   Reuses the same TELEGRAM_BOT_TOKEN as the main bot, and reads listings
   from the same live, shared store as the app and bot (see
   api/_lib/listings-store.js) — a real Addis Ababa listing posted through
   the app is eligible to be picked, not just the original samples.

   Button design note: channel posts can't use a regular Telegram Mini App
   (web_app) button — that's a hard, confirmed platform restriction, tested
   directly against the live API. A plain https:// link to the app would
   open a generic browser tab instead: no profile, no native chrome. Direct
   Link Mini Apps (the t.me/<bot>/<shortname> URLs built above) are the one
   documented exception — Telegram recognizes that specific URL pattern and
   opens the genuine Mini App from a plain "url" button, profile included.
   They can't read or send chat messages (a Telegram limit on Direct Links
   specifically, not something this code restricts) — for an actual private
   conversation, the "Chat on Telegram" button next to it opens a real chat
   with the bot instead. Both are genuine Telegram-native paths; neither is
   a plain external browser link. If the relevant env var isn't set, that
   specific button is simply omitted rather than posting something broken —
   the phone number is always in the message text either way.

   Selection is deterministic per UTC day (seeded by today's date), so if
   Vercel's cron ever fires twice in the same day — a known possibility,
   not a guarantee of exactly-once delivery — both runs post the same
   content rather than two different, confusing digests. It does NOT
   prevent an actual duplicate post; that would need a persistent store
   (e.g. Vercel KV) to remember "already posted today", which isn't set up.
*/
import { getAllListings, realOnly, isVerified } from "./_lib/listings-store.js";

const API = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const CHANNEL_ID = process.env.KIRAY_CHANNEL_ID;
const BOT_USERNAME = process.env.KIRAY_BOT_USERNAME; // e.g. "EthioKirayBot", no "@"
const MINIAPP_SHORTNAME = process.env.KIRAY_MINIAPP_SHORTNAME; // set via BotFather /newapp — see below

// Telegram "Direct Link Mini Apps": a plain t.me/<bot>/<shortname> URL that
// Telegram recognizes and opens as the genuine Mini App — WITH real profile
// access — even though it's just a normal "url" button. This is different
// from our own web_app buttons (which Telegram bans outright in channels)
// and is the one way a channel post can open the real app, profile and all.
// One-time setup: message @BotFather -> /newapp -> pick this bot -> give it
// a name/description/photo -> when asked for the Web App URL, use the same
// URL as KIRAY_APP_URL -> choose a short name (e.g. "app") and set it here
// as KIRAY_MINIAPP_SHORTNAME. The channel deliberately only ever links to
// the app now, not to a bot chat — chatting with the actual poster happens
// from inside the app itself, via their real Telegram handle when known.
function miniAppLink(payload) {
  if (!BOT_USERNAME || !MINIAPP_SHORTNAME) return null;
  return `https://t.me/${BOT_USERNAME}/${MINIAPP_SHORTNAME}${payload ? `?startapp=${payload}` : ""}`;
}

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

// Change this to widen/narrow the digest to a different city or region later.
const DIGEST_CITY = "Addis Ababa";

function pickDailyListings(listings) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
  const rand = seededRandom(today);
  const pool = listings.filter((l) => l.city === DIGEST_CITY && !l.rented);
  const shuffled = [...pool].sort(() => rand() - 0.5);
  const count = Math.min(3 + Math.floor(rand() * 3), shuffled.length); // 3-5, capped to what's available
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
    { chat_id: chatId, latitude: l.lat, longitude: l.lng, title: l.title, address: `${l.area || l.hood}, ${l.city}` },
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

function formatListing(l, allListings) {
  const lines = [
    `🏠 <b>${l.title}</b>${isVerified(l, allListings || [l]) ? " ✅" : ""}`,
    `📍 ${l.area || l.hood}, ${l.city}`,
    `💰 ${birr(l.price)}`,
  ];
  if (l.beds) lines.push(`🛏 ${l.beds} bed${l.beds > 1 ? "s" : ""} · ${l.size} m²`);
  else lines.push(`📐 ${l.size} m² · ${l.kind}`);
  // Telegram rejects "tel:" links as inline-button URLs outright (confirmed
  // directly against the live API), so the number goes in the message text
  // instead — Telegram auto-detects and makes phone numbers tappable there.
  // The Telegram handle doesn't get that treatment two different ways in a
  // row, now confirmed (plain "@username" isn't auto-linked, and an HTML
  // <a> tag around it didn't render as tappable either) — it's a real
  // inline keyboard button below instead, in listingButtons().
  lines.push(`📞 Call · ደውል: ${l.phone}`);
  if (l.sample) lines.push("🧪 Sample listing · የማሳያ ማስታወቂያ");
  return lines.join("\n");
}

// The channel can't use a real Telegram Mini App button (that's a
// private-chat-only feature — see the note at the top of this file), so a
// plain https:// link here would just open a regular browser tab, not the
// native in-app experience. Rather than pass that off as "the app," the
// only button is the genuine Telegram path — chatting with the bot, where
// the real Mini App and Contact & chat features do work. The phone number
// is already in the message text above for anyone who'd rather just call.
function listingButtons(l) {
  const ml = miniAppLink(`listing_${l.id}`);
  return ml ? { inline_keyboard: [[{ text: "🌍 Open in app · መተግበሪያ ክፈት", url: ml }]] } : undefined;
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

  const listings = realOnly(await getAllListings()); // real users only — no sample listings
  const { today, picks } = pickDailyListings(listings);

  if (picks.length === 0) {
    // Nothing real to post yet (e.g. right after launch, before any real
    // Addis Ababa listings exist) — skip the post entirely rather than
    // sending a broken "today's 0 picks" message to the channel.
    return res.status(200).json({ ok: true, date: today, posted: 0, note: "No real listings available to post yet." });
  }

  await sendMessage(
    CHANNEL_ID,
    `📅 <b>${today}</b> — today's ${picks.length} picks on Ethio Kiray 🏠\nየዛሬ ${picks.length} ምርጦች በኢትዮ ኪራይ`,
    {},
    "header"
  );

  for (const l of picks) {
    await sendPhotoAlbum(CHANNEL_ID, l);
    await sendVenuePin(CHANNEL_ID, l);
    await sendMessage(CHANNEL_ID, formatListing(l, listings), { reply_markup: listingButtons(l) }, `listing ${l.id} card`);
  }

  const fullMiniAppLink = miniAppLink();
  if (fullMiniAppLink) {
    await sendMessage(
      CHANNEL_ID,
      "Browse the full listings and map, right in the app 👇\nሙሉ ማስታወቂያዎችን እና ካርታውን በመተግበሪያው ይመልከቱ 👇",
      { reply_markup: { inline_keyboard: [[{ text: "🌍 Open Ethio Kiray app", url: fullMiniAppLink }]] } },
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

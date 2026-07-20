/* ================= KIRAY TELEGRAM BOT =================
   Vercel serverless function. Telegram POSTs every message AND every button
   tap (as a "callback_query") here — see README-TELEGRAM.md for setup.
   Env vars required on Vercel:
     TELEGRAM_BOT_TOKEN    — from @BotFather
     TELEGRAM_SECRET_TOKEN — any random string you invent
   Optional:
     KIRAY_APP_URL         — e.g. https://kiray-nine.vercel.app
                              (enables the "Open Web App" button)
*/
import { LISTINGS } from "../src/data/listings.js";

const API = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const APP_URL = process.env.KIRAY_APP_URL;
const TOP_COUNT = 5;

const birr = (n) => `${n.toLocaleString("en-US")} ETB/month`;

/* ---------- data helpers ---------- */

function searchListings(query) {
  const q = query.trim().toLowerCase();
  if (!q) return LISTINGS;
  return LISTINGS.filter((l) =>
    [l.city, l.region, l.hood, l.kind, l.type, l.title]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(q))
  );
}

// "Top" = verified listers first, then most recently posted.
function rankListings(list) {
  return [...list].sort(
    (a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0) || new Date(b.posted) - new Date(a.posted)
  );
}

// For the no-search-term view: one best listing per city, so results span
// the country instead of clustering wherever the data happens to be densest.
function topAcrossCities(list, n) {
  const bestPerCity = new Map();
  for (const l of rankListings(list)) {
    if (!bestPerCity.has(l.city)) bestPerCity.set(l.city, l);
  }
  return rankListings([...bestPerCity.values()]).slice(0, n);
}

function findListing(id) {
  return LISTINGS.find((l) => l.id === Number(id));
}

// Region -> city/town hierarchy, derived straight from the listings data
// (so it's always in sync — no separate list to maintain).
function getRegions() {
  return [...new Set(LISTINGS.map((l) => l.region))].sort((a, b) => a.localeCompare(b));
}
function getCities(region) {
  return [...new Set(LISTINGS.filter((l) => l.region === region).map((l) => l.city))].sort((a, b) =>
    a.localeCompare(b)
  );
}
function countListings(region, city) {
  return LISTINGS.filter((l) => l.region === region && (!city || l.city === city)).length;
}

/* ---------- formatting ---------- */

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

function listingKeyboard(l) {
  return {
    inline_keyboard: [
      [{ text: "📞 Contact & chat", callback_data: `contact_${l.id}` }],
    ],
  };
}

function startKeyboard() {
  const rows = [];
  if (APP_URL) rows.push([{ text: "🌍 Open Web App", web_app: { url: APP_URL } }]);
  rows.push([{ text: "💬 Browse listings here", callback_data: "browse" }]);
  return { inline_keyboard: rows };
}

/* ---------- Telegram API calls ---------- */

async function sendMessage(chatId, text, extra = {}) {
  await fetch(`${API()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
}

async function answerCallbackQuery(id, options = {}) {
  await fetch(`${API()}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: id, ...options }),
  });
}

async function sendRegionMenu(chatId) {
  const rows = getRegions().map((r, i) => [
    { text: `${r} (${countListings(r)})`, callback_data: `reg_${i}` },
  ]);
  await sendMessage(chatId, "📍 Choose a region:", { reply_markup: { inline_keyboard: rows } });
}

async function sendCityMenu(chatId, regionIdx) {
  const regions = getRegions();
  const region = regions[regionIdx];
  if (!region) return sendRegionMenu(chatId);

  const rows = getCities(region).map((c, i) => [
    { text: `${c} (${countListings(region, c)})`, callback_data: `city_${regionIdx}_${i}` },
  ]);
  rows.push([{ text: "⬅ Back to regions", callback_data: "back_regions" }]);
  await sendMessage(chatId, `📍 <b>${region}</b> — choose a city or town:`, {
    reply_markup: { inline_keyboard: rows },
  });
}

async function sendCityListings(chatId, regionIdx, cityIdx) {
  const regions = getRegions();
  const region = regions[regionIdx];
  if (!region) return sendRegionMenu(chatId);
  const cities = getCities(region);
  const city = cities[cityIdx];
  if (!city) return sendCityMenu(chatId, regionIdx);

  const results = rankListings(LISTINGS.filter((l) => l.region === region && l.city === city));
  const shown = results.slice(0, TOP_COUNT);

  await sendMessage(
    chatId,
    `🏙 <b>${city}, ${region}</b> — ${results.length} listing${results.length !== 1 ? "s" : ""}${
      results.length > shown.length ? ` (showing ${shown.length})` : ""
    }:`
  );
  for (const l of shown) {
    await sendMessage(chatId, formatListing(l), { reply_markup: listingKeyboard(l) });
  }
  await sendMessage(chatId, "Want another area?", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "⬅ Back to cities", callback_data: `back_cities_${regionIdx}` }],
        [{ text: "📍 Back to regions", callback_data: "back_regions" }],
      ],
    },
  });
}

/* ---------- shared actions ---------- */

async function sendTopListings(chatId, query = "") {
  const matches = searchListings(query);
  const results = query ? rankListings(matches) : topAcrossCities(matches, LISTINGS.length);

  if (results.length === 0) {
    await sendMessage(
      chatId,
      `No listings found for “${query}” yet. Try a city (Addis Ababa, Hawassa, Bahir Dar…), a neighbourhood, or a type (shop, office, villa).`
    );
    return;
  }

  const shown = results.slice(0, TOP_COUNT);
  await sendMessage(
    chatId,
    `Top listing${shown.length > 1 ? "s" : ""}${query ? ` for “${query}”` : ""}${
      results.length > shown.length ? ` — showing ${shown.length} of ${results.length}` : ""
    }:`
  );
  for (const l of shown) {
    await sendMessage(chatId, formatListing(l), { reply_markup: listingKeyboard(l) });
  }
  await sendMessage(
    chatId,
    "🔎 Narrow it down: /listings <city, neighbourhood, or type> — e.g. /listings Bole"
  );
}

async function sendContactCard(chatId, listing) {
  if (!listing) {
    await sendMessage(chatId, "That listing isn't available anymore.");
    return;
  }
  const lines = [
    `📇 <b>Contact for:</b> ${listing.title}`,
    `${listing.lister === "Broker" || listing.lister === "Agent" ? "🤝" : "🏠"} ${listing.name} (${listing.lister})${listing.owner ? ` · on behalf of ${listing.owner}` : ""}`,
    listing.verified ? "✅ Verified lister" : "",
  ].filter(Boolean);

  const rows = [[{ text: "📞 Call", url: `tel:${listing.phone}` }]];
  if (APP_URL) {
    rows.push([{ text: "💬 Chat in Kiray app", web_app: { url: `${APP_URL}?listing=${listing.id}` } }]);
  }

  await sendMessage(chatId, lines.join("\n"), { reply_markup: { inline_keyboard: rows } });
}

/* ---------- webhook entry point ---------- */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, hint: "Kiray Telegram webhook is alive." });
  }

  if (
    req.headers["x-telegram-bot-api-secret-token"] !== process.env.TELEGRAM_SECRET_TOKEN
  ) {
    return res.status(401).json({ ok: false });
  }

  const update = req.body;

  try {
    // --- Button taps ---
    if (update?.callback_query) {
      const cq = update.callback_query;
      const chatId = cq.message?.chat?.id;
      const data = cq.data || "";

      if (data === "browse" || data === "back_regions") {
        await answerCallbackQuery(cq.id);
        if (chatId) await sendRegionMenu(chatId);
      } else if (data.startsWith("back_cities_")) {
        const regionIdx = Number(data.replace("back_cities_", ""));
        await answerCallbackQuery(cq.id);
        if (chatId) await sendCityMenu(chatId, regionIdx);
      } else if (data.startsWith("reg_")) {
        const regionIdx = Number(data.replace("reg_", ""));
        await answerCallbackQuery(cq.id);
        if (chatId) await sendCityMenu(chatId, regionIdx);
      } else if (data.startsWith("city_")) {
        const [, regionIdx, cityIdx] = data.split("_");
        await answerCallbackQuery(cq.id);
        if (chatId) await sendCityListings(chatId, Number(regionIdx), Number(cityIdx));
      } else if (data.startsWith("contact_")) {
        await answerCallbackQuery(cq.id);
        if (chatId) await sendContactCard(chatId, findListing(data.replace("contact_", "")));
      } else {
        await answerCallbackQuery(cq.id);
      }

      return res.status(200).json({ ok: true });
    }

    // --- Text messages ---
    const msg = update?.message;
    if (!msg?.text) return res.status(200).json({ ok: true });

    const chatId = msg.chat.id;
    const text = msg.text.trim();

    if (text.startsWith("/start")) {
      await sendMessage(
        chatId,
        [
          "ሰላም! Welcome to <b>Kiray</b> 🏠",
          "",
          "Find rental homes and business spaces across Ethiopia.",
          "",
          "How would you like to browse?",
        ].join("\n"),
        { reply_markup: startKeyboard() }
      );
    } else if (text.startsWith("/help")) {
      await sendMessage(
        chatId,
        [
          "<b>How to use Kiray</b>",
          "",
          "• /start — browse by region, then city or town",
          "• /listings — top listings right now",
          "• /listings Hawassa — search by city",
          "• /listings Piassa — search by neighbourhood",
          "• /listings office — search by property type",
          "",
          "Tap <b>📞 Contact & chat</b> on any listing to call the owner or broker, or open a chat with them right inside the Kiray app.",
          "✅ means the lister is verified.",
        ].join("\n"),
        { reply_markup: APP_URL ? { inline_keyboard: [[{ text: "🌍 Open Web App", web_app: { url: APP_URL } }]] } : undefined }
      );
    } else if (text.startsWith("/listings")) {
      const query = text.replace("/listings", "").trim();
      await sendTopListings(chatId, query);
    } else {
      await sendMessage(
        chatId,
        "I didn't understand that. Try /listings <city or area>, or /start to see the menu again."
      );
    }
  } catch (err) {
    console.error("Telegram handler error:", err);
  }

  return res.status(200).json({ ok: true });
}

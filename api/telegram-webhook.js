/* ================= KIRAY TELEGRAM BOT =================
   Vercel serverless function. Telegram POSTs every message AND every button
   tap (as a "callback_query") here — see README-TELEGRAM.md for setup.
   Env vars required on Vercel:
     TELEGRAM_BOT_TOKEN    — from @BotFather
     TELEGRAM_SECRET_TOKEN — any random string you invent
   Optional:
     KIRAY_APP_URL         — e.g. https://kiray-nine.vercel.app
                              (enables "Open Web App", "Post a listing", etc.)

   LANGUAGE: every button's callback_data is prefixed "en|" or "am|" so the
   chosen language carries forward through the whole tap-driven conversation
   with no database needed. The very first screen (/start) picks a language
   automatically from the visitor's own Telegram app setting
   (update.from.language_code), with a manual 🌐 toggle to override it.
   Typed commands (/listings, /help) re-detect from that same setting each time.

   OWNER/BROKER DEMO NOTE: "My listings" mirrors the web app's prototype
   behaviour — it shows Ethio Kiray's sample landlord/broker account (there's no
   database yet, so listings aren't tied to individual real Telegram users).
   Posting and full management still happen in the app itself, which is why
   those buttons deep-link into it — including its interactive map pin picker.
*/
import { LISTINGS } from "../src/data/listings.js";

const API = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const APP_URL = process.env.KIRAY_APP_URL;
const TOP_COUNT = 5;

// Mirrors DEMO in src/App.jsx — the prototype's single sample landlord/broker.
const DEMO = { landlord: "W/ro Almaz", broker: "Meskerem B." };

/* ================= STRINGS (English / Amharic) =================
   AI-assisted translations — worth a native-speaker pass before real launch. */
const STR = {
  en: {
    self_lang_label: "🌐 English",
    start:
      "Welcome to <b>Ethio Kiray</b> 🏠\n\nFind rental homes and business spaces across Ethiopia.\n\nWhat would you like to do?",
    btn_open_app: "🌍 Open Web App",
    btn_find_rental: "🔎 Find a place to rent",
    btn_list_property: "🏠 List a property",
    btn_back_main: "⬅ Back to main menu",
    choose_region: "📍 Choose a region:",
    choose_city: (region) => `📍 <b>${region}</b> — choose a city or town:`,
    back_regions: "⬅ Back to regions",
    back_cities: "⬅ Back to cities",
    want_another_area: "Want another area?",
    narrow_down: "🔎 Narrow it down: /listings <city, neighbourhood, or type> — e.g. /listings Bole",
    no_results: (q) =>
      `No listings found for “${q}” yet. Try a city (Addis Ababa, Hawassa, Bahir Dar…), a neighbourhood, or a type (shop, office, villa).`,
    top_listings: (n, q, total) =>
      `Top listing${n > 1 ? "s" : ""}${q ? ` for “${q}”` : ""}${total > n ? ` — showing ${n} of ${total}` : ""}:`,
    city_listings_header: (city, region, total, shown) =>
      `🏙 <b>${city}, ${region}</b> — ${total} listing${total !== 1 ? "s" : ""}${total > shown ? ` (showing ${shown})` : ""}:`,
    contact_btn: "📞 Contact & chat",
    contact_for: (title) => `📇 <b>Contact for:</b> ${title}`,
    verified: "✅ Verified lister",
    call_btn: "📞 Call",
    chat_in_app_btn: "💬 Chat in Ethio Kiray app",
    listing_unavailable: "That listing isn't available anymore.",
    beds: (n) => `${n} bed${n > 1 ? "s" : ""}`,
    etb_month: (n) => `${n.toLocaleString("en-US")} ETB/month`,
    views: (n) => `👁 ${n} views`,
    help: (regionCount) =>
      [
        "<b>How to use Ethio Kiray</b>",
        "",
        "• /start — browse by region, then city or town, or list a property",
        "• /listings — top listings right now",
        "• /listings Hawassa — search by city",
        "• /listings Piassa — search by neighbourhood",
        "• /listings office — search by property type",
        "",
        "Tap <b>📞 Contact & chat</b> on any listing to call the owner or broker, or open a chat with them right inside the Ethio Kiray app.",
        "✅ means the lister is verified.",
        `📍 ${regionCount} regions currently listed.`,
      ].join("\n"),
    unknown_command: "I didn't understand that. Try /listings <city or area>, or /start to see the menu again.",

    // owner / broker section
    owner_menu_title: "🏠 <b>Landlord & broker tools</b>\n\nWhich are you?",
    btn_im_landlord: "🏠 I'm a Landlord",
    btn_im_broker: "🤝 I'm a Broker",
    role_tools_title: (label) => `🏠 <b>${label} tools</b>\n\nWhat would you like to do?`,
    role_landlord_label: "Landlord",
    role_broker_label: "Broker",
    btn_post_listing: "📤 Post a new listing (opens the app)",
    btn_manage_in_app: "🗂 Manage all listings in app",
    btn_view_here: "📋 View my listings here",
    my_listings_header: (name, n) => `📋 <b>${name}'s listings</b> — ${n} propert${n !== 1 ? "ies" : "y"}:`,
    my_listings_empty: "No listings under this demo account yet — post one from the app to see it here.",
    demo_note:
      "ℹ️ Demo note: this shows Ethio Kiray's sample landlord/broker account. Once real accounts are connected to a database, this will show your own listings instead.",
    manage_in_app_btn: "✏️ Manage in app",
  },
  am: {
    self_lang_label: "🌐 አማርኛ",
    start:
      "እንኳን ወደ <b>ኢትዮ ኪራይ</b> በደህና መጡ 🏠\n\nበኢትዮጵያ ውስጥ የመኖሪያና የንግድ ቦታዎችን ይፈልጉ።\n\nምን ማድረግ ይፈልጋሉ?",
    btn_open_app: "🌍 መተግበሪያውን ክፈት",
    btn_find_rental: "🔎 መኖሪያ ቦታ ፈልግ",
    btn_list_property: "🏠 ንብረት አስመዝግብ",
    btn_back_main: "⬅ ወደ ዋና ማውጫ ተመለስ",
    choose_region: "📍 ክልል ይምረጡ፦",
    choose_city: (region) => `📍 <b>${region}</b> — ከተማ ወይም ወረዳ ይምረጡ፦`,
    back_regions: "⬅ ወደ ክልሎች ተመለስ",
    back_cities: "⬅ ወደ ከተሞች ተመለስ",
    want_another_area: "ሌላ አካባቢ ይፈልጋሉ?",
    narrow_down: "🔎 ለማጥበብ፦ /listings <ከተማ ወይም አካባቢ> — ለምሳሌ፦ /listings ቦሌ",
    no_results: (q) =>
      `ለ “${q}” ምንም ውጤት አልተገኘም። ከተማ (አዲስ አበባ፣ ሀዋሳ፣ ባህር ዳር…)፣ ሰፈር ወይም አይነት (ሱቅ፣ ቢሮ፣ ቪላ) ይሞክሩ።`,
    top_listings: (n, q, total) =>
      `${q ? `ለ “${q}” ` : ""}ምርጥ ማስታወቂያዎች${total > n ? ` — ${n} ከ ${total}` : ""}፦`,
    city_listings_header: (city, region, total, shown) =>
      `🏙 <b>${city}, ${region}</b> — ${total} ማስታወቂያ${total !== 1 ? "ዎች" : ""}${total > shown ? ` (${shown} እየታዩ)` : ""}፦`,
    contact_btn: "📞 አግኙ እና ይወያዩ",
    contact_for: (title) => `📇 <b>የመገናኛ መረጃ ለ:</b> ${title}`,
    verified: "✅ የተረጋገጠ አከራይ/ደላላ",
    call_btn: "📞 ደውል",
    chat_in_app_btn: "💬 በመተግበሪያው ውስጥ ይወያዩ",
    listing_unavailable: "ይህ ማስታወቂያ ከአሁን በኋላ አይገኝም።",
    beds: (n) => `${n} መኝታ ቤት${n > 1 ? "ዎች" : ""}`,
    etb_month: (n) => `${n.toLocaleString("en-US")} ብር/ወር`,
    views: (n) => `👁 ${n} ጊዜ ታይቷል`,
    help: (regionCount) =>
      [
        "<b>ኢትዮ ኪራይን እንዴት መጠቀም እንደሚቻል</b>",
        "",
        "• /start — በክልል፣ ከዚያም በከተማ ወይም ወረዳ ይፈልጉ፣ ወይም ንብረት ያስመዝግቡ",
        "• /listings — አሁን ያሉ ምርጥ ማስታወቂያዎች",
        "• /listings ሀዋሳ — በከተማ ይፈልጉ",
        "• /listings ፒያሳ — በሰፈር ይፈልጉ",
        "• /listings ሱቅ — በአይነት ይፈልጉ",
        "",
        "በማንኛውም ማስታወቂያ ላይ <b>📞 አግኙ እና ይወያዩ</b> ን ይጫኑ አከራዩን ወይም ደላላውን ለመደወል ወይም በኢትዮ ኪራይ መተግበሪያ ውስጥ ቀጥታ ለመወያየት።",
        "✅ ማለት ሻጩ/አከራዩ የተረጋገጠ ነው ማለት ነው።",
        `📍 በአሁኑ ጊዜ ${regionCount} ክልሎች ተዘርዝረዋል።`,
      ].join("\n"),
    unknown_command: "አልገባኝም። /listings <ከተማ ወይም አካባቢ> ይሞክሩ ወይም /start ይጫኑ ማውጫውን ለማየት።",

    // owner / broker section
    owner_menu_title: "🏠 <b>ለአከራይና ደላላ አገልግሎቶች</b>\n\nየትኛው ነዎት?",
    btn_im_landlord: "🏠 እኔ አከራይ ነኝ",
    btn_im_broker: "🤝 እኔ ደላላ ነኝ",
    role_tools_title: (label) => `🏠 <b>የ${label} አገልግሎቶች</b>\n\nምን ማድረግ ይፈልጋሉ?`,
    role_landlord_label: "አከራይ",
    role_broker_label: "ደላላ",
    btn_post_listing: "📤 አዲስ ማስታወቂያ ለጥፍ (መተግበሪያውን ይከፍታል)",
    btn_manage_in_app: "🗂 ሁሉንም ማስታወቂያዎች በመተግበሪያው ያስተዳድሩ",
    btn_view_here: "📋 ማስታወቂያዎቼን እዚህ ይመልከቱ",
    my_listings_header: (name, n) => `📋 <b>የ${name} ማስታወቂያዎች</b> — ${n} ንብረት${n !== 1 ? "ዎች" : ""}፦`,
    my_listings_empty: "በዚህ የማሳያ አካውንት ስር ምንም ማስታወቂያ የለም — ከመተግበሪያው አዲስ ይለጥፉ እዚህ ለማየት።",
    demo_note:
      "ℹ️ ማሳሰቢያ፦ ይህ የኢትዮ ኪራይ ናሙና አከራይ/ደላላ አካውንት ያሳያል። ትክክለኛ አካውንቶች ወደፊት ከዳታቤዝ ጋር ሲገናኙ የራስዎን ማስታወቂያዎች ያሳያሉ።",
    manage_in_app_btn: "✏️ በመተግበሪያው ያስተዳድሩ",
  },
};

/* ---------- language plumbing (stateless — no database) ---------- */

function detectLang(update) {
  const code = update?.message?.from?.language_code || update?.callback_query?.from?.language_code || "";
  return code.toLowerCase().startsWith("am") ? "am" : "en";
}

// Every callback_data we generate is "en|action" or "am|action"; parsing
// strips that prefix back off so the chosen language threads through an
// entire tap-driven conversation without needing to store anything.
function parseCallbackData(data) {
  const i = data.indexOf("|");
  return i === -1 ? { lang: null, action: data } : { lang: data.slice(0, i), action: data.slice(i + 1) };
}
const cd = (lang, action) => `${lang}|${action}`;

function langToggleRow(lang) {
  const other = lang === "en" ? "am" : "en";
  return [{ text: STR[other].self_lang_label, callback_data: cd(other, "start") }];
}

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
// Note: listing titles/kind/type are the lister's own content, so — like any
// real classifieds app — those aren't machine-translated, only the app's own
// UI chrome (labels, buttons, units) is.

function formatListing(l, lang) {
  const s = STR[lang];
  const lines = [
    `🏠 <b>${l.title}</b>${l.verified ? " ✅" : ""}`,
    `📍 ${l.hood}, ${l.city}`,
    `💰 ${s.etb_month(l.price)}`,
  ];
  if (l.beds) lines.push(`🛏 ${s.beds(l.beds)} · ${l.size} m²`);
  else lines.push(`📐 ${l.size} m² · ${l.kind}`);
  return lines.join("\n");
}

function listingKeyboard(lang, l) {
  return { inline_keyboard: [[{ text: STR[lang].contact_btn, callback_data: cd(lang, `contact_${l.id}`) }]] };
}

function startKeyboard(lang) {
  const s = STR[lang];
  const rows = [];
  if (APP_URL) rows.push([{ text: s.btn_open_app, web_app: { url: APP_URL } }]);
  rows.push([{ text: s.btn_find_rental, callback_data: cd(lang, "browse") }]);
  rows.push([{ text: s.btn_list_property, callback_data: cd(lang, "owner") }]);
  rows.push(langToggleRow(lang));
  return { inline_keyboard: rows };
}

// Shown alongside every browsing screen (not just /start) so people can
// jump to the full map-based app at any point, not only at the very top.
function openAppRow(lang) {
  return APP_URL ? [{ text: STR[lang].btn_open_app, web_app: { url: APP_URL } }] : null;
}

/* ---------- Telegram API calls ---------- */

async function sendMessage(chatId, text, extra = {}) {
  await fetch(`${API()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
}

// Native Telegram map pin bubble — the in-chat equivalent of the app's
// interactive map marker. Uses the same lat/lng every listing already
// carries for the app's Leaflet map, so both stay in sync automatically.
async function sendVenuePin(chatId, l) {
  if (typeof l.lat !== "number" || typeof l.lng !== "number") return;
  await fetch(`${API()}/sendVenue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      latitude: l.lat,
      longitude: l.lng,
      title: l.title,
      address: `${l.hood}, ${l.city}`,
    }),
  });
}

async function answerCallbackQuery(id, options = {}) {
  await fetch(`${API()}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: id, ...options }),
  });
}

/* ---------- tenant: region -> city -> listings ---------- */

async function sendStartMenu(chatId, lang) {
  await sendMessage(chatId, STR[lang].start, { reply_markup: startKeyboard(lang) });
}

async function sendRegionMenu(chatId, lang) {
  const s = STR[lang];
  const rows = getRegions().map((r, i) => [
    { text: `${r} (${countListings(r)})`, callback_data: cd(lang, `reg_${i}`) },
  ]);
  rows.push([{ text: s.btn_back_main, callback_data: cd(lang, "start") }]);
  if (openAppRow(lang)) rows.push(openAppRow(lang));
  await sendMessage(chatId, s.choose_region, { reply_markup: { inline_keyboard: rows } });
}

async function sendCityMenu(chatId, lang, regionIdx) {
  const s = STR[lang];
  const regions = getRegions();
  const region = regions[regionIdx];
  if (!region) return sendRegionMenu(chatId, lang);

  const rows = getCities(region).map((c, i) => [
    { text: `${c} (${countListings(region, c)})`, callback_data: cd(lang, `city_${regionIdx}_${i}`) },
  ]);
  rows.push([{ text: s.back_regions, callback_data: cd(lang, "back_regions") }]);
  if (openAppRow(lang)) rows.push(openAppRow(lang));
  await sendMessage(chatId, s.choose_city(region), { reply_markup: { inline_keyboard: rows } });
}

async function sendCityListings(chatId, lang, regionIdx, cityIdx) {
  const s = STR[lang];
  const regions = getRegions();
  const region = regions[regionIdx];
  if (!region) return sendRegionMenu(chatId, lang);
  const cities = getCities(region);
  const city = cities[cityIdx];
  if (!city) return sendCityMenu(chatId, lang, regionIdx);

  const results = rankListings(LISTINGS.filter((l) => l.region === region && l.city === city));
  const shown = results.slice(0, TOP_COUNT);

  await sendMessage(chatId, s.city_listings_header(city, region, results.length, shown.length));
  for (const l of shown) {
    await sendVenuePin(chatId, l);
    await sendMessage(chatId, formatListing(l, lang), { reply_markup: listingKeyboard(lang, l) });
  }
  await sendMessage(chatId, s.want_another_area, {
    reply_markup: {
      inline_keyboard: [
        [{ text: s.back_cities, callback_data: cd(lang, `back_cities_${regionIdx}`) }],
        [{ text: s.back_regions, callback_data: cd(lang, "back_regions") }],
        ...(openAppRow(lang) ? [openAppRow(lang)] : []),
      ],
    },
  });
}

async function sendTopListings(chatId, lang, query = "") {
  const s = STR[lang];
  const matches = searchListings(query);
  const results = query ? rankListings(matches) : topAcrossCities(matches, LISTINGS.length);

  if (results.length === 0) {
    await sendMessage(chatId, s.no_results(query));
    return;
  }

  const shown = results.slice(0, TOP_COUNT);
  await sendMessage(chatId, s.top_listings(shown.length, query, results.length));
  for (const l of shown) {
    await sendVenuePin(chatId, l);
    await sendMessage(chatId, formatListing(l, lang), { reply_markup: listingKeyboard(lang, l) });
  }
  await sendMessage(chatId, s.narrow_down, openAppRow(lang) ? { reply_markup: { inline_keyboard: [openAppRow(lang)] } } : {});
}

async function sendContactCard(chatId, lang, listing) {
  const s = STR[lang];
  if (!listing) {
    await sendMessage(chatId, s.listing_unavailable);
    return;
  }
  const lines = [
    s.contact_for(listing.title),
    `${listing.lister === "Broker" || listing.lister === "Agent" ? "🤝" : "🏠"} ${listing.name} (${listing.lister})${listing.owner ? ` · ${listing.owner}` : ""}`,
    listing.verified ? s.verified : "",
  ].filter(Boolean);

  const rows = [[{ text: s.call_btn, url: `tel:${listing.phone}` }]];
  if (APP_URL) {
    rows.push([{ text: s.chat_in_app_btn, web_app: { url: `${APP_URL}?listing=${listing.id}` } }]);
  }
  await sendVenuePin(chatId, listing);
  await sendMessage(chatId, lines.join("\n"), { reply_markup: { inline_keyboard: rows } });
}

/* ---------- landlord / broker section ---------- */

async function sendOwnerMenu(chatId, lang) {
  const s = STR[lang];
  const rows = [
    [{ text: s.btn_im_landlord, callback_data: cd(lang, "ownerlist_landlord") }],
    [{ text: s.btn_im_broker, callback_data: cd(lang, "ownerlist_broker") }],
    [{ text: s.btn_back_main, callback_data: cd(lang, "start") }],
    langToggleRow(lang),
  ];
  await sendMessage(chatId, s.owner_menu_title, { reply_markup: { inline_keyboard: rows } });
}

async function sendRoleTools(chatId, lang, role) {
  const s = STR[lang];
  const label = role === "broker" ? s.role_broker_label : s.role_landlord_label;
  const rows = [];
  if (APP_URL) {
    rows.push([{ text: s.btn_post_listing, web_app: { url: `${APP_URL}?role=${role}&tab=post` } }]);
    rows.push([{ text: s.btn_manage_in_app, web_app: { url: `${APP_URL}?role=${role}&tab=listings` } }]);
  }
  rows.push([{ text: s.btn_view_here, callback_data: cd(lang, `ownerview_${role}`) }]);
  rows.push([{ text: s.btn_back_main, callback_data: cd(lang, "owner") }]);
  await sendMessage(chatId, s.role_tools_title(label), { reply_markup: { inline_keyboard: rows } });
}

async function sendMyListingsPreview(chatId, lang, role) {
  const s = STR[lang];
  const name = DEMO[role];
  const mine = rankListings(LISTINGS.filter((l) => l.name === name));

  if (mine.length === 0) {
    await sendMessage(chatId, s.my_listings_empty);
    return;
  }

  await sendMessage(chatId, s.my_listings_header(name, mine.length));
  for (const l of mine.slice(0, TOP_COUNT)) {
    await sendVenuePin(chatId, l);
    await sendMessage(chatId, `${formatListing(l, lang)}\n${s.views(l.views)}`, {
      reply_markup: APP_URL
        ? { inline_keyboard: [[{ text: s.manage_in_app_btn, web_app: { url: `${APP_URL}?role=${role}&tab=listings` } }]] }
        : undefined,
    });
  }
  await sendMessage(chatId, s.demo_note, {
    reply_markup: { inline_keyboard: [[{ text: s.btn_back_main, callback_data: cd(lang, `ownerlist_${role}`) }]] },
  });
}

/* ---------- webhook entry point ---------- */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, hint: "Ethio Kiray Telegram webhook is alive." });
  }

  if (req.headers["x-telegram-bot-api-secret-token"] !== process.env.TELEGRAM_SECRET_TOKEN) {
    return res.status(401).json({ ok: false });
  }

  const update = req.body;

  try {
    // --- Button taps ---
    if (update?.callback_query) {
      const cq = update.callback_query;
      const chatId = cq.message?.chat?.id;
      const { lang: explicitLang, action: data } = parseCallbackData(cq.data || "");
      const lang = explicitLang || detectLang(update);

      await answerCallbackQuery(cq.id);
      if (!chatId) return res.status(200).json({ ok: true });

      if (data === "start") {
        await sendStartMenu(chatId, lang);
      } else if (data === "browse" || data === "back_regions") {
        await sendRegionMenu(chatId, lang);
      } else if (data.startsWith("back_cities_")) {
        await sendCityMenu(chatId, lang, Number(data.replace("back_cities_", "")));
      } else if (data.startsWith("reg_")) {
        await sendCityMenu(chatId, lang, Number(data.replace("reg_", "")));
      } else if (data.startsWith("city_")) {
        const [, regionIdx, cityIdx] = data.split("_");
        await sendCityListings(chatId, lang, Number(regionIdx), Number(cityIdx));
      } else if (data.startsWith("contact_")) {
        await sendContactCard(chatId, lang, findListing(data.replace("contact_", "")));
      } else if (data === "owner") {
        await sendOwnerMenu(chatId, lang);
      } else if (data.startsWith("ownerlist_")) {
        await sendRoleTools(chatId, lang, data.replace("ownerlist_", ""));
      } else if (data.startsWith("ownerview_")) {
        await sendMyListingsPreview(chatId, lang, data.replace("ownerview_", ""));
      }

      return res.status(200).json({ ok: true });
    }

    // --- Text messages ---
    const msg = update?.message;
    if (!msg?.text) return res.status(200).json({ ok: true });

    const chatId = msg.chat.id;
    const text = msg.text.trim();
    const lang = detectLang(update);

    if (text.startsWith("/start")) {
      await sendStartMenu(chatId, lang);
    } else if (text.startsWith("/help")) {
      await sendMessage(chatId, STR[lang].help(getRegions().length), {
        reply_markup: APP_URL ? { inline_keyboard: [[{ text: STR[lang].btn_open_app, web_app: { url: APP_URL } }]] } : undefined,
      });
    } else if (text.startsWith("/listings")) {
      const query = text.replace("/listings", "").trim();
      await sendTopListings(chatId, lang, query);
    } else {
      await sendMessage(chatId, STR[lang].unknown_command);
    }
  } catch (err) {
    console.error("Telegram handler error:", err);
  }

  return res.status(200).json({ ok: true });
}

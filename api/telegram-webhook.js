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

   DATA: listings now come from getAllListings() (api/_lib/listings-store.js)
   — the same live, shared store the app and channel digest read from — not
   the static sample file directly. A listing posted through the app shows
   up here too. Fetched once per request and threaded through as a plain
   parameter, since these are simple synchronous helpers over an array.

   OWNERSHIP: "My listings" filters by the real Telegram user chatting with
   the bot (their user id) when a listing has that id attached — i.e. when
   it was posted by that same person, signed in via the app's Telegram
   Mini App. Listings with no owner id (the original samples, or anything
   posted as a guest) fall back to matching Ethio Kiray's demo landlord/
   broker account, same prototype behaviour as before.
*/
import { getAllListings, realOnly, isVerified } from "./_lib/listings-store.js";

const API = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const APP_URL = process.env.KIRAY_APP_URL;
const TOP_COUNT = 5;

// Mirrors DEMO in src/App.jsx — the fallback identity for listings with no
// real owner attached (the original samples, or anything posted as a guest).
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
    view_in_app_btn: "🌍 View full listing in app",
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
        "Tap <b>📞 Contact & chat</b> on any listing to see the owner's or broker's phone number, or view the full listing in the app.",
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
    my_listings_empty: "No listings found for you yet — post one from the app to see it here.",
    demo_note:
      "ℹ️ Showing Ethio Kiray's sample landlord/broker account — sign in via the app's \"Open Web App\" button and post a listing there to see your own listings here instead.",
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
    view_in_app_btn: "🌍 ሙሉ ማስታወቂያ በመተግበሪያው ይመልከቱ",
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
        "በማንኛውም ማስታወቂያ ላይ <b>📞 አግኙ እና ይወያዩ</b> ን ይጫኑ የአከራዩን ወይም የደላላውን ስልክ ቁጥር ለማየት፣ ወይም ሙሉ ማስታወቂያውን በመተግበሪያው ለማየት።",
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
    my_listings_empty: "ለእርስዎ ምንም ማስታወቂያ አልተገኘም — ከመተግበሪያው አዲስ ይለጥፉ እዚህ ለማየት።",
    demo_note:
      "ℹ️ የኢትዮ ኪራይ ናሙና አከራይ/ደላላ አካውንት እያሳየ ነው — በመተግበሪያው \"መተግበሪያውን ክፈት\" በኩል ይግቡ እና ማስታወቂያ ይለጥፉ የራስዎን ማስታወቂያዎች እዚህ ለማየት።",
    manage_in_app_btn: "✏️ በመተግበሪያው ያስተዳድሩ",
  },
};

/* ---------- language plumbing (stateless — no database needed for this part) ---------- */

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

/* ---------- data helpers (all take the live listings array as a parameter) ---------- */

function searchListings(listings, query) {
  const q = query.trim().toLowerCase();
  if (!q) return listings;
  return listings.filter((l) =>
    [l.city, l.region, l.hood, l.area, l.kind, l.type, l.title]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(q))
  );
}

// "Top" = verified listers first, then most recently posted. allListings
// (defaults to list itself if not given) is what verification is actually
// computed against — a person's total listing count, not just however
// many happen to be in this particular filtered subset.
function rankListings(list, allListings = list) {
  return [...list].sort(
    (a, b) => (isVerified(b, allListings) ? 1 : 0) - (isVerified(a, allListings) ? 1 : 0) || new Date(b.posted) - new Date(a.posted)
  );
}

// For the no-search-term view: one best listing per city, so results span
// the country instead of clustering wherever the data happens to be densest.
function topAcrossCities(list, n, allListings = list) {
  const bestPerCity = new Map();
  for (const l of rankListings(list, allListings)) {
    if (!bestPerCity.has(l.city)) bestPerCity.set(l.city, l);
  }
  return rankListings([...bestPerCity.values()], allListings).slice(0, n);
}

function findListing(listings, id) {
  return listings.find((l) => l.id === Number(id));
}

// Region -> city/town hierarchy, derived straight from the live listings
// data (so it's always in sync — no separate list to maintain, and it
// automatically includes any new region/city a real listing introduces).
function getRegions(listings) {
  return [...new Set(listings.map((l) => l.region))].sort((a, b) => a.localeCompare(b));
}
function getCities(listings, region) {
  return [...new Set(listings.filter((l) => l.region === region).map((l) => l.city))].sort((a, b) =>
    a.localeCompare(b)
  );
}
function countListings(listings, region, city) {
  return listings.filter((l) => l.region === region && (!city || l.city === city)).length;
}

/* ---------- formatting ---------- */
// Note: listing titles/kind/type are the lister's own content, so — like any
// real classifieds app — those aren't machine-translated, only the app's own
// UI chrome (labels, buttons, units) is.

function formatListing(l, lang, allListings) {
  const s = STR[lang];
  const lines = [
    `🏠 <b>${l.title}</b>${isVerified(l, allListings || [l]) ? " ✅" : ""}`,
    `📍 ${l.area || l.hood}, ${l.city}`,
    `💰 ${s.etb_month(l.price)}`,
  ];
  if (l.beds) lines.push(`🛏 ${s.beds(l.beds)} · ${l.size} m²`);
  else lines.push(`📐 ${l.size} m² · ${l.kind}`);
  if (l.sample) lines.push("🧪 " + (lang === "am" ? "የማሳያ ማስታወቂያ" : "Sample listing — for demo purposes"));
  return lines.join("\n");
}

function listingKeyboard(lang, l) {
  const rows = [[{ text: STR[lang].contact_btn, callback_data: cd(lang, `contact_${l.id}`) }]];
  if (APP_URL) rows.push([{ text: STR[lang].view_in_app_btn, web_app: { url: `${APP_URL}?listing=${l.id}` } }]);
  return { inline_keyboard: rows };
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
      address: `${l.area || l.hood}, ${l.city}`,
    }),
  });
}

// Sends up to 7 photos for a listing — as a single photo if there's only
// one, or as a native Telegram album (sendMediaGroup) if there are more.
// Same photos array the app's PostForm/gallery use, so both stay in sync.
async function sendPhotoAlbum(chatId, l) {
  const photos = (l.photos || []).slice(0, 7);
  if (photos.length === 0) return;
  if (photos.length === 1) {
    await fetch(`${API()}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, photo: photos[0], caption: l.title }),
    });
    return;
  }
  await fetch(`${API()}/sendMediaGroup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      media: photos.map((url, i) => ({ type: "photo", media: url, ...(i === 0 ? { caption: l.title } : {}) })),
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

async function sendRegionMenu(chatId, lang, listings) {
  listings = listings.filter((l) => !l.rented); // tenant-facing browse: available only
  const s = STR[lang];
  const rows = getRegions(listings).map((r, i) => [
    { text: `${r} (${countListings(listings, r)})`, callback_data: cd(lang, `reg_${i}`) },
  ]);
  rows.push([{ text: s.btn_back_main, callback_data: cd(lang, "start") }]);
  if (openAppRow(lang)) rows.push(openAppRow(lang));
  await sendMessage(chatId, s.choose_region, { reply_markup: { inline_keyboard: rows } });
}

async function sendCityMenu(chatId, lang, regionIdx, listings) {
  listings = listings.filter((l) => !l.rented); // tenant-facing browse: available only
  const s = STR[lang];
  const regions = getRegions(listings);
  const region = regions[regionIdx];
  if (!region) return sendRegionMenu(chatId, lang, listings);

  const rows = getCities(listings, region).map((c, i) => [
    { text: `${c} (${countListings(listings, region, c)})`, callback_data: cd(lang, `city_${regionIdx}_${i}`) },
  ]);
  rows.push([{ text: s.back_regions, callback_data: cd(lang, "back_regions") }]);
  if (openAppRow(lang)) rows.push(openAppRow(lang));
  await sendMessage(chatId, s.choose_city(region), { reply_markup: { inline_keyboard: rows } });
}

async function sendCityListings(chatId, lang, regionIdx, cityIdx, listings) {
  listings = listings.filter((l) => !l.rented); // tenant-facing browse: available only
  const s = STR[lang];
  const regions = getRegions(listings);
  const region = regions[regionIdx];
  if (!region) return sendRegionMenu(chatId, lang, listings);
  const cities = getCities(listings, region);
  const city = cities[cityIdx];
  if (!city) return sendCityMenu(chatId, lang, regionIdx, listings);

  const results = rankListings(listings.filter((l) => l.region === region && l.city === city), listings);
  const shown = results.slice(0, TOP_COUNT);

  await sendMessage(chatId, s.city_listings_header(city, region, results.length, shown.length));
  for (const l of shown) {
    await sendPhotoAlbum(chatId, l);
    await sendVenuePin(chatId, l);
    await sendMessage(chatId, formatListing(l, lang, listings), { reply_markup: listingKeyboard(lang, l) });
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

async function sendTopListings(chatId, lang, query, listings) {
  listings = listings.filter((l) => !l.rented); // tenant-facing browse: available only
  const s = STR[lang];
  const matches = searchListings(listings, query);
  const results = query ? rankListings(matches, listings) : topAcrossCities(matches, listings.length, listings);

  if (results.length === 0) {
    await sendMessage(chatId, s.no_results(query));
    return;
  }

  const shown = results.slice(0, TOP_COUNT);
  await sendMessage(chatId, s.top_listings(shown.length, query, results.length));
  for (const l of shown) {
    await sendPhotoAlbum(chatId, l);
    await sendVenuePin(chatId, l);
    await sendMessage(chatId, formatListing(l, lang, listings), { reply_markup: listingKeyboard(lang, l) });
  }
  await sendMessage(chatId, s.narrow_down, openAppRow(lang) ? { reply_markup: { inline_keyboard: [openAppRow(lang)] } } : {});
}

async function sendContactCard(chatId, lang, listing, allListings) {
  const s = STR[lang];
  if (!listing) {
    await sendMessage(chatId, s.listing_unavailable);
    return;
  }
  // Telegram rejects "tel:" links as inline-button URLs outright (a hard
  // platform restriction, confirmed directly against the live API — not
  // just a formatting issue). Phone numbers in plain message text are
  // auto-detected and tappable-to-dial on Telegram's own clients instead,
  // so the number goes in the text rather than a button. The Telegram
  // handle doesn't get that same free treatment two different ways in a
  // row now confirmed: plain "@username" text isn't auto-linked, and even
  // wrapping it in a real HTML <a> tag didn't render as tappable either.
  // Rather than keep fighting text parsing, this uses a real inline
  // keyboard button instead — the same url-button mechanism already
  // proven reliable elsewhere in this bot for t.me links.
  const lines = [
    s.contact_for(listing.title),
    `${listing.lister === "Broker" || listing.lister === "Agent" ? "🤝" : "🏠"} ${listing.name} (${listing.lister})${listing.owner ? ` · ${listing.owner}` : ""}`,
    isVerified(listing, allListings || [listing]) ? s.verified : "",
    `${s.call_btn}: ${listing.phone}`,
  ].filter(Boolean);

  const rows = listing.telegramUsername
    ? [[{ text: `💬 Chat with ${listing.name.split(" ")[0]} on Telegram`, url: `https://t.me/${listing.telegramUsername}` }]]
    : [];

  await sendMessage(chatId, lines.join("\n"), rows.length ? { reply_markup: { inline_keyboard: rows } } : {});
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

// ownerTelegramId = whoever is actually tapping the button right now. If we
// know exactly who they are (they've signed in via the app's Mini App at
// some point), show only their real listings — even if that's none yet.
// Only a true guest (no Telegram identity at all) falls back to the shared
// demo account, same prototype behaviour as before.
async function sendMyListingsPreview(chatId, lang, role, listings, ownerTelegramId) {
  const s = STR[lang];

  if (ownerTelegramId) {
    const mine = rankListings(listings.filter((l) => l.ownerId === ownerTelegramId), listings);
    if (mine.length === 0) {
      await sendMessage(chatId, s.my_listings_empty);
      return;
    }
    await sendMessage(chatId, s.my_listings_header(mine[0].name, mine.length));
    for (const l of mine.slice(0, TOP_COUNT)) {
      await sendPhotoAlbum(chatId, l);
      await sendVenuePin(chatId, l);
      await sendMessage(chatId, `${formatListing(l, lang, listings)}\n${s.views(l.views)}`, {
        reply_markup: APP_URL
          ? { inline_keyboard: [[{ text: s.manage_in_app_btn, web_app: { url: `${APP_URL}?role=${role}&tab=listings` } }]] }
          : undefined,
      });
    }
    return;
  }

  const name = DEMO[role];
  const mine = rankListings(listings.filter((l) => l.name === name && !l.ownerId), listings);
  if (mine.length === 0) {
    await sendMessage(chatId, s.my_listings_empty);
    return;
  }
  await sendMessage(chatId, s.my_listings_header(name, mine.length));
  for (const l of mine.slice(0, TOP_COUNT)) {
    await sendPhotoAlbum(chatId, l);
    await sendVenuePin(chatId, l);
    await sendMessage(chatId, `${formatListing(l, lang, listings)}\n${s.views(l.views)}`, {
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

      // Fetched once per request, straight from the live shared store —
      // includes anything posted through the app, not just the samples.
      const listings = realOnly(await getAllListings()); // real users only — no sample listings

      if (data === "start") {
        await sendStartMenu(chatId, lang);
      } else if (data === "browse" || data === "back_regions") {
        await sendRegionMenu(chatId, lang, listings);
      } else if (data.startsWith("back_cities_")) {
        await sendCityMenu(chatId, lang, Number(data.replace("back_cities_", "")), listings);
      } else if (data.startsWith("reg_")) {
        await sendCityMenu(chatId, lang, Number(data.replace("reg_", "")), listings);
      } else if (data.startsWith("city_")) {
        const [, regionIdx, cityIdx] = data.split("_");
        await sendCityListings(chatId, lang, Number(regionIdx), Number(cityIdx), listings);
      } else if (data.startsWith("contact_")) {
        await sendContactCard(chatId, lang, findListing(listings, data.replace("contact_", "")), listings);
      } else if (data === "owner") {
        await sendOwnerMenu(chatId, lang);
      } else if (data.startsWith("ownerlist_")) {
        await sendRoleTools(chatId, lang, data.replace("ownerlist_", ""));
      } else if (data.startsWith("ownerview_")) {
        await sendMyListingsPreview(chatId, lang, data.replace("ownerview_", ""), listings, cq.from?.id);
      }

      return res.status(200).json({ ok: true });
    }

    // --- Text messages ---
    const msg = update?.message;
    if (!msg?.text) return res.status(200).json({ ok: true });

    const chatId = msg.chat.id;
    const text = msg.text.trim();
    const lang = detectLang(update);
    const listings = realOnly(await getAllListings()); // real users only — no sample listings

    if (text.startsWith("/start")) {
      // Deep link from the channel digest: "t.me/BotName?start=listing_16"
      // arrives here as the text "/start listing_16" — show that listing
      // first (with working Contact & chat), then the usual menu below it.
      const payload = text.replace("/start", "").trim();
      const match = payload.match(/^listing_(\d+)$/);
      const linkedListing = match ? findListing(listings, match[1]) : null;
      if (linkedListing) {
        await sendPhotoAlbum(chatId, linkedListing);
        await sendVenuePin(chatId, linkedListing);
        await sendMessage(chatId, formatListing(linkedListing, lang, listings), { reply_markup: listingKeyboard(lang, linkedListing) });
      }
      await sendStartMenu(chatId, lang);
    } else if (text.startsWith("/help")) {
      await sendMessage(chatId, STR[lang].help(getRegions(listings).length), {
        reply_markup: APP_URL ? { inline_keyboard: [[{ text: STR[lang].btn_open_app, web_app: { url: APP_URL } }]] } : undefined,
      });
    } else if (text.startsWith("/listings")) {
      const query = text.replace("/listings", "").trim();
      await sendTopListings(chatId, lang, query, listings);
    } else {
      await sendMessage(chatId, STR[lang].unknown_command);
    }
  } catch (err) {
    console.error("Telegram handler error:", err);
  }

  return res.status(200).json({ ok: true });
}

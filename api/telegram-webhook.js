/* ================= KIRAY TELEGRAM BOT =================
   Vercel serverless function. Telegram POSTs every message here
   (after you register the webhook — see README-TELEGRAM.md).
   Env vars required on Vercel:
     TELEGRAM_BOT_TOKEN    — from @BotFather
     TELEGRAM_SECRET_TOKEN — any random string you invent
   Optional:
     KIRAY_APP_URL         — e.g. https://kiray.vercel.app (adds a button to replies)
*/
import { LISTINGS } from "../src/data/listings.js";

const API = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

const birr = (n) => `${n.toLocaleString("en-US")} ETB/month`;

function searchListings(query) {
  const q = query.trim().toLowerCase();
  if (!q) return LISTINGS;
  return LISTINGS.filter((l) =>
    [l.city, l.region, l.hood, l.kind, l.type, l.title]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(q))
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
  lines.push(`📞 ${l.name} (${l.lister}): ${l.phone}`);
  return lines.join("\n");
}

async function sendMessage(chatId, text, extra = {}) {
  await fetch(`${API()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, hint: "Kiray Telegram webhook is alive." });
  }

  // Only accept requests that carry the secret we registered with setWebhook
  if (
    req.headers["x-telegram-bot-api-secret-token"] !== process.env.TELEGRAM_SECRET_TOKEN
  ) {
    return res.status(401).json({ ok: false });
  }

  const update = req.body;
  const msg = update?.message;
  if (!msg?.text) return res.status(200).json({ ok: true });

  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const appUrl = process.env.KIRAY_APP_URL;
  const appButton = appUrl
    ? { reply_markup: { inline_keyboard: [[{ text: "Open Kiray 🌍", url: appUrl }]] } }
    : {};

  try {
    if (text.startsWith("/start")) {
      await sendMessage(
        chatId,
        [
          "ሰላም! Welcome to <b>Kiray</b> 🏠",
          "",
          "Find rental homes and business spaces across Ethiopia.",
          "",
          "Try:",
          "• /listings — everything available",
          "• /listings Addis Ababa — by city",
          "• /listings Bole — by neighbourhood",
          "• /listings shop — by property type",
          "• /help — how this works",
        ].join("\n"),
        appButton
      );
    } else if (text.startsWith("/help")) {
      await sendMessage(
        chatId,
        [
          "<b>How to use Kiray</b>",
          "",
          "Search with /listings followed by a city, neighbourhood, or property type:",
          "• /listings Hawassa",
          "• /listings Piassa",
          "• /listings office",
          "",
          "✅ means the lister is verified. Contact them directly on the phone number shown.",
        ].join("\n"),
        appButton
      );
    } else if (text.startsWith("/listings")) {
      const query = text.replace("/listings", "").trim();
      const results = searchListings(query);

      if (results.length === 0) {
        await sendMessage(
          chatId,
          `No listings found for “${query}” yet. Try a city (Addis Ababa, Hawassa, Bahir Dar…), a neighbourhood, or a type (shop, office, villa).`
        );
      } else {
        const shown = results.slice(0, 5);
        await sendMessage(
          chatId,
          `Found <b>${results.length}</b> listing${results.length > 1 ? "s" : ""}${
            query ? ` for “${query}”` : ""
          }${results.length > 5 ? " — showing the first 5" : ""}:`
        );
        for (const l of shown) {
          await sendMessage(chatId, formatListing(l), appButton);
        }
      }
    } else {
      await sendMessage(
        chatId,
        "I didn't understand that. Try /listings <city or area> — for example: /listings Addis Ababa"
      );
    }
  } catch (err) {
    console.error("Telegram handler error:", err);
  }

  // Always 200 so Telegram doesn't retry the same update forever
  return res.status(200).json({ ok: true });
}

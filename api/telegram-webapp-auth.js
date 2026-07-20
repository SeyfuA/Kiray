/* ================= TELEGRAM MINI APP VERIFICATION =================
   When Kiray is opened inside Telegram, the client sends us tg.initData —
   a signed snapshot of the visitor's profile. We recompute the signature
   with the bot token; if it matches, we return the verified user profile.
   Docs: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
   Uses the same TELEGRAM_BOT_TOKEN env var as the bot webhook. */
import crypto from "crypto";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "POST only" });
  }

  const initData = req.body?.initData;
  if (!initData || typeof initData !== "string") {
    return res.status(400).json({ ok: false, error: "Missing initData" });
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return res.status(400).json({ ok: false, error: "Missing hash" });
  params.delete("hash");

  // Data-check string: remaining fields sorted alphabetically, key=value, \n-joined
  const checkString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  // Mini App scheme: secret = HMAC_SHA256(bot_token) keyed with "WebAppData"
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(process.env.TELEGRAM_BOT_TOKEN)
    .digest();

  const computed = crypto
    .createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex");

  const valid =
    computed.length === hash.length &&
    crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));

  if (!valid) {
    return res.status(401).json({ ok: false, error: "Invalid signature" });
  }

  // Reject stale data (older than 24h)
  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate) || Date.now() / 1000 - authDate > 86400) {
    return res.status(401).json({ ok: false, error: "Session expired" });
  }

  let user = null;
  try {
    user = JSON.parse(params.get("user"));
  } catch {
    return res.status(400).json({ ok: false, error: "Malformed user data" });
  }

  return res.status(200).json({ ok: true, user });
}

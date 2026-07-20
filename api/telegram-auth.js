/* ================= TELEGRAM LOGIN VERIFICATION =================
   The Telegram Login Widget sends the user's profile plus a `hash` signed
   with the bot token. We recompute the signature server-side; if it matches,
   the login is genuine and untampered.
   Docs: https://core.telegram.org/widgets/login#checking-authorization
   Uses the same TELEGRAM_BOT_TOKEN env var as the bot webhook. */
import crypto from "crypto";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "POST only" });
  }

  const data = req.body || {};
  const { hash, ...fields } = data;
  if (!hash || !fields.id || !fields.auth_date) {
    return res.status(400).json({ ok: false, error: "Missing auth fields" });
  }

  // Build the data-check string exactly as Telegram specifies:
  // all received fields except hash, sorted alphabetically, joined with \n
  const checkString = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join("\n");

  const secretKey = crypto
    .createHash("sha256")
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

  // Reject logins older than 24h (replay protection)
  const ageSeconds = Date.now() / 1000 - Number(fields.auth_date);
  if (!Number.isFinite(ageSeconds) || ageSeconds > 86400) {
    return res.status(401).json({ ok: false, error: "Login expired" });
  }

  return res.status(200).json({ ok: true });
}

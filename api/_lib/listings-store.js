/* ================= SHARED LISTINGS STORE =================
   Single source of truth for reading and writing live listings data.
   Used by api/listings.js (the app's storage endpoint), the Telegram bot
   (api/telegram-webhook.js), and the channel digest (api/daily-digest.js)
   — so a listing posted from any one of them shows up on all three,
   instead of the bot/channel only ever seeing the original 32 samples.

   Backed by Upstash Redis via Vercel's Storage Marketplace. Note: the
   Vercel-generated env vars for this integration are named
   KV_REST_API_URL / KV_REST_API_TOKEN (a naming convention carried over
   from the old first-party "Vercel KV" product) — confirmed directly
   against what Vercel actually provisions, not the plain
   UPSTASH_REDIS_REST_* names some generic docs mention. Checked for both,
   just in case.

   File lives under api/_lib/ — the underscore prefix tells Vercel not to
   treat this as its own route, only as a module other functions import.
*/
import { Redis } from "@upstash/redis";
import { LISTINGS as SEED_LISTINGS } from "../../src/data/listings.js";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});
const KEY = "kiray:listings";

// Falls back to the bundled sample data on any storage error (not set up
// yet, network hiccup, etc.) so the bot/channel/app keep working either
// way — degraded to sample-only, never broken.
export async function getAllListings() {
  try {
    const stored = await redis.get(KEY);
    if (Array.isArray(stored) && stored.length > 0) return stored;
    await redis.set(KEY, SEED_LISTINGS);
    return SEED_LISTINGS;
  } catch (err) {
    console.error("getAllListings() falling back to sample data:", err.message);
    return SEED_LISTINGS;
  }
}

export async function addListing(partial) {
  const listings = await getAllListings();
  const nextId = Math.max(0, ...listings.map((l) => l.id)) + 1;
  const newListing = { ...partial, id: nextId };
  await redis.set(KEY, [...listings, newListing]);
  return newListing;
}

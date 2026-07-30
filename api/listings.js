/* ================= ETHIO KIRAY — LISTINGS STORAGE =================
   Real persistence for posted listings. Uses Upstash Redis via Vercel's
   Storage Marketplace — Vercel's own first-party "Vercel KV" product was
   discontinued; Upstash (through the Marketplace) is its direct successor
   and works the same way: a small, durable key-value store reachable from
   any serverless function.

   ONE-TIME SETUP (Vercel dashboard — can't be done from code):
   1. Vercel dashboard -> this project -> Storage tab -> Create Database ->
      "Upstash for Redis" -> Free plan -> create -> connect to this
      project.
   2. That automatically adds environment variables named
      KV_REST_API_URL / KV_REST_API_TOKEN (Vercel's naming convention
      here, carried over from the old first-party Vercel KV product —
      not the plain UPSTASH_REDIS_REST_* names some docs mention). Check
      Settings -> Environments -> Environment Variables to confirm they're
      there; the code below checks for both naming styles regardless.
   3. Deploy. The very first request seeds the store with the current 32
      sample listings; every request after that reads and writes real,
      durable data — it survives reloads and future deployments.

   Without step 1 done, every request here fails gracefully (500), and
   the app's frontend already falls back to session-only behaviour in
   that case — nothing breaks, it just isn't persisted yet.

   GET  /api/listings  -> { ok: true, listings: [ ...all listings... ] }
   POST /api/listings  -> body: a listing object without an id
                        -> assigns an id, stores it, returns
                           { ok: true, listing: { id, ...} }
*/
import { Redis } from "@upstash/redis";
import { LISTINGS as SEED_LISTINGS } from "../src/data/listings.js";

// Vercel's Upstash integration names its env vars KV_REST_API_URL / KV_REST_API_TOKEN
// (a naming convention carried over from the old first-party "Vercel KV" product) —
// NOT the plain UPSTASH_REDIS_REST_* names @upstash/redis's fromEnv() looks for by
// default. Confirmed directly against what the integration actually generates, so
// this constructs the client explicitly rather than relying on fromEnv() guessing.
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});
const KEY = "kiray:listings";

async function getAll() {
  const stored = await redis.get(KEY);
  if (Array.isArray(stored) && stored.length > 0) return stored;
  // First-ever request (or an empty store): seed with the sample data.
  await redis.set(KEY, SEED_LISTINGS);
  return SEED_LISTINGS;
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const listings = await getAll();
      return res.status(200).json({ ok: true, listings });
    }

    if (req.method === "POST") {
      const listings = await getAll();
      const nextId = Math.max(0, ...listings.map((l) => l.id)) + 1;
      const newListing = { ...req.body, id: nextId };
      await redis.set(KEY, [...listings, newListing]);
      return res.status(200).json({ ok: true, listing: newListing });
    }

    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (err) {
    console.error("Listings storage error:", err);
    return res.status(500).json({
      ok: false,
      error: "Storage unavailable — check that Upstash is connected and KV_REST_API_URL / KV_REST_API_TOKEN are set.",
    });
  }
}

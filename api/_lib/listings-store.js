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

// Verifies ownership server-side (requesterId must match the listing's
// ownerId) — a hidden edit button on the frontend isn't real security,
// since anyone could call this endpoint directly. id/ownerId can't be
// changed through this, whatever the caller sends for them is ignored.
export async function updateListing(id, updates, requesterId) {
  const listings = await getAllListings();
  const idx = listings.findIndex((l) => l.id === Number(id));
  if (idx === -1) {
    const err = new Error("Listing not found");
    err.status = 404;
    throw err;
  }
  const existing = listings[idx];
  if (!requesterId || !existing.ownerId || existing.ownerId !== requesterId) {
    const err = new Error("Not authorized to edit this listing");
    err.status = 403;
    throw err;
  }
  const updated = { ...existing, ...updates, id: existing.id, ownerId: existing.ownerId, sample: existing.sample };
  const next = [...listings];
  next[idx] = updated;
  await redis.set(KEY, next);
  return updated;
}

// The 32 bundled sample listings (sample: true) still seed a brand-new,
// empty store — keeps id numbering and map reference data sane — but real
// users should only ever see genuine posts. Anything that displays
// listings to an end user should filter through this; anything doing
// internal bookkeeping (like id assignment in addListing above) uses the
// full unfiltered list instead.
export function realOnly(listings) {
  return listings.filter((l) => !l.sample);
}

// Verification threshold: a lister is verified once they have at least
// this many listings of their own. Computed live from the current data
// every time, rather than stored as a flag on each listing — a person who
// drops back under 5 (deletes listings) correctly loses verified status
// again, and changing the threshold later is a one-line change here, not
// a data migration across every existing listing.
const VERIFIED_THRESHOLD = 5;

export function isVerified(listing, allListings) {
  if (!listing.ownerId) return false; // no stable identity to count listings by (guest/legacy post)
  return allListings.filter((l) => l.ownerId === listing.ownerId).length >= VERIFIED_THRESHOLD;
}

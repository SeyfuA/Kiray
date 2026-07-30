/* ================= ETHIO KIRAY — LISTINGS STORAGE (app-facing) =================
   Thin HTTP wrapper around api/_lib/listings-store.js — the actual storage
   logic is shared with the Telegram bot and channel digest so all three
   surfaces see the same live data. See that file for the Upstash setup
   notes (env vars, one-time Vercel dashboard steps).

   GET  /api/listings  -> { ok: true, listings: [ ...all listings... ] }
   POST /api/listings  -> body: a listing object without an id
                        -> assigns an id, stores it, returns
                           { ok: true, listing: { id, ...} }
*/
import { getAllListings, addListing, realOnly } from "./_lib/listings-store.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // getAllListings() already falls back to sample data on any storage
    // error, but that fallback is for keeping the endpoint alive, not for
    // showing fake listings to real users — realOnly() strips them either way.
    const listings = await getAllListings();
    return res.status(200).json({ ok: true, listings: realOnly(listings) });
  }

  if (req.method === "POST") {
    try {
      const newListing = await addListing(req.body);
      return res.status(200).json({ ok: true, listing: newListing });
    } catch (err) {
      console.error("Listings storage error:", err);
      return res.status(500).json({
        ok: false,
        error: "Storage unavailable — check that Upstash is connected and KV_REST_API_URL / KV_REST_API_TOKEN are set.",
      });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}

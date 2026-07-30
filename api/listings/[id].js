/* ================= ETHIO KIRAY — EDIT A LISTING =================
   PATCH /api/listings/:id
     body: { requesterId: <telegramId>, updates: { ...fields to change } }
     -> { ok: true, listing: {...updated} }

   requesterId must match the listing's ownerId (checked server-side in
   updateListing(), not just by hiding the edit button on the frontend —
   that alone wouldn't stop someone calling this endpoint directly).

   Used for both real edits (price, description, phone, features, photos)
   and for marking a listing rented/available again — that's just
   { updates: { rented: true } } through the same endpoint.
*/
import { updateListing } from "../_lib/listings-store.js";

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ ok: false, error: "PATCH only" });
  }

  const { id } = req.query;
  const { requesterId, updates } = req.body || {};

  if (!requesterId) {
    return res.status(400).json({ ok: false, error: "Missing requesterId" });
  }

  try {
    const listing = await updateListing(id, updates || {}, requesterId);
    return res.status(200).json({ ok: true, listing });
  } catch (err) {
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

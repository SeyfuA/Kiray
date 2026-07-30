/* ================= ETHIO KIRAY — PHOTO UPLOAD =================
   Real, persistent hosting for listing photos via Vercel Blob (a live,
   actively maintained Vercel product — unlike the old "Vercel KV," this
   one hasn't been discontinued). Previously, "uploaded" photos were just
   URL.createObjectURL() references — local to that one browser tab, never
   actually stored anywhere, so they broke the moment anyone else opened
   the listing. This gives them a real, permanent, publicly-viewable URL.

   ONE-TIME SETUP (Vercel dashboard — can't be done from code):
   1. This project -> Storage tab -> Create Database -> "Blob" ->
      access: Public -> create -> connect to this project.
   2. That automatically adds an environment variable: BLOB_READ_WRITE_TOKEN
      Check Settings -> Environments -> Environment Variables to confirm.
   3. Deploy.

   The frontend compresses/resizes each photo in the browser before
   sending it here (see the resizeImage() helper in PostForm), which keeps
   uploads comfortably under Vercel's ~4.5MB server-upload body limit and
   makes them faster on slower connections.

   POST /api/upload-photo
     body: { dataUrl: "data:image/jpeg;base64,...", filename: "photo.jpg" }
     -> { ok: true, url: "https://....public.blob.vercel-storage.com/..." }
*/
import { put } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "POST only" });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ ok: false, error: "Photo storage isn't set up yet (BLOB_READ_WRITE_TOKEN missing)." });
  }

  try {
    const { dataUrl, filename } = req.body || {};
    if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
      return res.status(400).json({ ok: false, error: "Missing or invalid dataUrl" });
    }

    const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ ok: false, error: "dataUrl must be a base64-encoded image" });
    }
    const [, contentType, base64] = match;
    const buffer = Buffer.from(base64, "base64");

    // Cap at ~6MB post-decode as a sanity check — the client-side resize
    // should already keep this well under that, this just guards against
    // something unexpected slipping through.
    if (buffer.length > 6 * 1024 * 1024) {
      return res.status(413).json({ ok: false, error: "Image too large" });
    }

    const safeName = (filename || "photo.jpg").replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const pathname = `listings/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

    const blob = await put(pathname, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });

    return res.status(200).json({ ok: true, url: blob.url });
  } catch (err) {
    console.error("Photo upload error:", err);
    return res.status(500).json({ ok: false, error: "Upload failed" });
  }
}

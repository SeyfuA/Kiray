import { useState, useMemo, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LISTINGS } from "./data/listings.js";

/* ================= DESIGN TOKENS ================= */
const T = {
  ink: "#152019",
  forest: "#0E3B2E",
  leaf: "#2FA36B",
  leafSoft: "#E3F3EA",
  gold: "#D9A62E",
  goldSoft: "#FBF3DC",
  paper: "#F7F6F2",
  card: "#FFFFFF",
  line: "#E2E0D8",
  mute: "#6C7A70",
  danger: "#B4472F",
  blueSoft: "#E7EEF8",
  blue: "#2C5A8C",
};
const displayFont = "'Trebuchet MS', 'Segoe UI', system-ui, sans-serif";
const bodyFont = "'Segoe UI', system-ui, -apple-system, sans-serif";

/* ================= LOCATION DATA ================= */
const LOCATIONS = [
  {
    region: "Addis Ababa",
    cities: [
      {
        name: "Addis Ababa", tier: "Federal capital", lat: 9.02, lng: 38.75,
        hoods: ["Bole Medhanealem", "Kazanchis", "Piassa", "Merkato", "CMC", "Ayat", "Gerji", "Sarbet", "Mexico", "Megenagna", "Summit", "Old Airport", "Jemo", "Lebu"],
      },
    ],
  },
  {
    region: "Oromia",
    cities: [
      { name: "Adama", tier: "Regional capital", lat: 8.54, lng: 39.27, hoods: ["Franko", "Boku", "Dembela", "Migira"] },
      { name: "Bishoftu", tier: "Zonal capital", lat: 8.75, lng: 38.98, hoods: ["Babogaya", "Piassa", "Kebele 01"] },
      { name: "Jimma", tier: "Zonal capital", lat: 7.67, lng: 36.83, hoods: ["Ginjo", "Hermata", "Bishishe"] },
      { name: "Shashemene", tier: "Zonal capital", lat: 7.2, lng: 38.6, hoods: ["Arada", "Alelu", "Awasho"] },
      { name: "Nekemte", tier: "Zonal capital", lat: 9.09, lng: 36.53, hoods: ["Bake Jama", "Darge", "Cheleleki"] },
    ],
  },
  {
    region: "Amhara",
    cities: [
      { name: "Bahir Dar", tier: "Regional capital", lat: 11.59, lng: 37.39, hoods: ["Tana Lakeside", "Gish Abay", "Shum Abo", "Kebele 14"] },
      { name: "Gondar", tier: "Zonal capital", lat: 12.6, lng: 37.46, hoods: ["Piassa", "Azezo", "Maraki"] },
      { name: "Dessie", tier: "Zonal capital", lat: 11.13, lng: 39.63, hoods: ["Arada", "Segno Gebeya", "Buanbua Wuha"] },
      { name: "Debre Birhan", tier: "Zonal capital", lat: 9.68, lng: 39.53, hoods: ["Piassa", "Kebele 04", "Tebase"] },
      { name: "Debre Markos", tier: "Zonal capital", lat: 10.33, lng: 37.72, hoods: ["Piassa", "Kebele 07", "Menkorer"] },
    ],
  },
  {
    region: "Tigray",
    cities: [
      { name: "Mekelle", tier: "Regional capital", lat: 13.49, lng: 39.47, hoods: ["Ayder", "Hawelti", "Adi Haki", "Kedamay Weyane"] },
      { name: "Adigrat", tier: "Zonal capital", lat: 14.28, lng: 39.46, hoods: ["Piassa", "Kebele 02"] },
    ],
  },
  {
    region: "Sidama",
    cities: [
      { name: "Hawassa", tier: "Regional capital", lat: 7.06, lng: 38.48, hoods: ["Piassa", "Tabor", "Menaharia", "Amora Gedel Lakeside"] },
    ],
  },
  {
    region: "South Ethiopia",
    cities: [
      { name: "Wolaita Sodo", tier: "Regional capital", lat: 6.85, lng: 37.75, hoods: ["Merkato", "Arada", "Gido"] },
      { name: "Arba Minch", tier: "Zonal capital", lat: 6.04, lng: 37.55, hoods: ["Sikela", "Shecha"] },
      { name: "Dilla", tier: "Zonal capital", lat: 6.41, lng: 38.31, hoods: ["Piassa", "Haro Welabu"] },
    ],
  },
  {
    region: "Central Ethiopia",
    cities: [{ name: "Hosaena", tier: "Regional capital", lat: 7.55, lng: 37.85, hoods: ["Arada", "Sech Duna"] }],
  },
  {
    region: "South West Ethiopia",
    cities: [{ name: "Bonga", tier: "Regional capital", lat: 7.28, lng: 36.23, hoods: ["Piassa", "Kebele 01"] }],
  },
  {
    region: "Afar",
    cities: [{ name: "Semera", tier: "Regional capital", lat: 11.79, lng: 41.01, hoods: ["Central", "Airport Road"] }],
  },
  {
    region: "Somali",
    cities: [{ name: "Jigjiga", tier: "Regional capital", lat: 9.35, lng: 42.8, hoods: ["Central", "Kebele 05", "University Area"] }],
  },
  {
    region: "Harari",
    cities: [{ name: "Harar", tier: "Regional capital", lat: 9.31, lng: 42.12, hoods: ["Jugol (Old Town)", "Shenkor", "Aboker"] }],
  },
  {
    region: "Dire Dawa",
    cities: [{ name: "Dire Dawa", tier: "Federal city", lat: 9.6, lng: 41.85, hoods: ["Kezira", "Megala", "Sabian"] }],
  },
  {
    region: "Benishangul-Gumuz",
    cities: [{ name: "Assosa", tier: "Regional capital", lat: 10.07, lng: 34.52, hoods: ["Central", "Kebele 03"] }],
  },
  {
    region: "Gambela",
    cities: [{ name: "Gambela", tier: "Regional capital", lat: 8.25, lng: 34.59, hoods: ["Central", "Newland"] }],
  },
];


/* Demo accounts: the landlord demo signs in as W/ro Almaz, the broker demo as Meskerem B. */
const DEMO = { landlord: "W/ro Almaz", broker: "Meskerem B." };
const TENANT_ME = "You (visitor)";

/* Options for the posting form */
const PROPERTY_KINDS = {
  Residential: ["Room in shared compound", "Condominium", "Apartment", "Studio", "Villa / private house", "Other"],
  Business: ["Shop", "Office", "Warehouse", "Café / restaurant", "Guesthouse", "Other"],
};
const FEATURE_OPTIONS = ["Ceramic floor", "Cement floor", "Private bathroom", "Shared bathroom", "Private kitchen", "Water tank", "Own electric meter", "Furnished", "Parking", "Guarded compound", "Balcony", "Backup generator"];

/* ================= SEED CHAT THREADS =================
   Each thread: { id: `${listingId}:${tenant}`, listingId, tenant, tenantPhone, messages: [{from, text, at}] }
   from is "tenant" or "lister". */
const SEED_CHATS = [
  { id: "2:Biniam G.", listingId: 2, tenant: "Biniam G.", tenantPhone: "+251900000101", messages: [
    { from: "tenant", text: "Is the shop still available? I run a mobile accessories business and can move in on Hamle 1.", at: "2026-07-11T07:10:00" },
  ]},
  { id: "4:Selam Tech PLC", listingId: 4, tenant: "Selam Tech PLC", tenantPhone: "+251900000102", messages: [
    { from: "tenant", text: "We are a 15-person software company. Could we visit the office floor this week?", at: "2026-07-11T04:30:00" },
  ]},
  { id: "4:Hana M.", listingId: 4, tenant: "Hana M.", tenantPhone: "+251900000103", messages: [
    { from: "tenant", text: "Is the price negotiable for a 2-year contract paid quarterly?", at: "2026-07-10T09:15:00" },
    { from: "lister", text: "Selam Hana, for a 2-year contract we can discuss. Which floor size do you need?", at: "2026-07-10T11:40:00" },
  ]},
  { id: "1:Dawit A.", listingId: 1, tenant: "Dawit A.", tenantPhone: "+251900000104", messages: [
    { from: "tenant", text: "Does the rent include water and the condo service fee?", at: "2026-07-11T06:00:00" },
  ]},
  { id: "5:Ruth & family", listingId: 5, tenant: "Ruth & family", tenantPhone: "+251900000105", messages: [
    { from: "tenant", text: "We'd like to view the villa Saturday morning. Is parking inside the compound?", at: "2026-07-10T14:20:00" },
  ]},
  { id: "3:Yared K.", listingId: 3, tenant: "Yared K.", tenantPhone: "+251900000106", messages: [
    { from: "tenant", text: "Student at AAU — is a 6-month contract possible?", at: "2026-07-09T16:45:00" },
  ]},
];

/* ================= HELPERS ================= */
const fmtETB = (n) => "ETB " + n.toLocaleString("en-US");
const allCities = LOCATIONS.flatMap((r) => r.cities);
const fmtPhone = (p) => p.replace("+251", "+251 ").replace(/(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3");

function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d} day${d > 1 ? "s" : ""} ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w} week${w > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fullDate(iso) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/* ================= MAP (Leaflet + OpenStreetMap — free, no API key) ================= */
const pinIcon = (color, selected) =>
  L.divIcon({
    className: "",
    html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 1C7.8 1 2 6.6 2 13.6 2 23 15 39 15 39s13-16 13-25.4C28 6.6 22.2 1 15 1z"
        fill="${color}" stroke="${selected ? "#152019" : "#ffffff"}" stroke-width="${selected ? 3 : 2}"/>
      <circle cx="15" cy="13.5" r="4.5" fill="#ffffff"/>
    </svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 38],
    popupAnchor: [0, -34],
  });

function FitToResults({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.flyTo(points[0], 14, { duration: 0.8 });
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 13 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points)]);
  return null;
}

function MapPanel({ results, selected, setSelected, subtitle }) {
  const points = results.map((l) => [l.lat, l.lng]);
  return (
    <section style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, overflow: "hidden", position: "sticky", top: 12 }}>
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.line}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <strong style={{ fontFamily: displayFont, fontSize: 14 }}>Map view</strong>
        <span style={{ fontSize: 11, color: T.mute }}>{subtitle || "OpenStreetMap — pins are approximate"}</span>
      </div>
      <MapContainer center={[9.02, 38.75]} zoom={6} scrollWheelZoom={true} style={{ height: 460, width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToResults points={points} />
        {results.map((l) => (
          <Marker
            key={l.id}
            position={[l.lat, l.lng]}
            icon={pinIcon(l.type === "Business" ? T.gold : T.leaf, selected === l.id)}
            eventHandlers={{ click: () => setSelected(selected === l.id ? null : l.id) }}
          >
            <Popup>
              <div style={{ fontFamily: bodyFont, minWidth: 170 }}>
                <strong style={{ fontSize: 13 }}>{l.title}</strong>
                <div style={{ fontSize: 12, color: T.mute, margin: "2px 0" }}>{l.hood}, {l.city}</div>
                <div style={{ fontSize: 13, color: T.forest, fontWeight: 700 }}>{fmtETB(l.price)}/mo</div>
                <div style={{ fontSize: 11, color: T.mute }}>Posted {timeAgo(l.posted)}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div style={{ display: "flex", gap: 16, padding: "8px 14px", fontSize: 11, color: T.mute, borderTop: `1px solid ${T.line}` }}>
        <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: T.leaf, marginRight: 5 }} />Residential</span>
        <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: T.gold, marginRight: 5 }} />Business</span>
        <span style={{ marginLeft: "auto" }}>Tap a pin for details</span>
      </div>
    </section>
  );
}

/* ================= SMALL PIECES ================= */
function Chip({ children, active, onClick, small }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: bodyFont, fontSize: small ? 12 : 13,
      padding: small ? "4px 10px" : "6px 14px", borderRadius: 999,
      border: `1px solid ${active ? T.forest : T.line}`,
      background: active ? T.forest : T.card, color: active ? "#fff" : T.ink,
      cursor: "pointer", transition: "all .15s ease", whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

function Badge({ kind }) {
  const isOwner = kind === "Owner";
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
      background: isOwner ? T.leafSoft : T.goldSoft,
      color: isOwner ? T.forest : "#8A6410",
    }}>{isOwner ? "Owner · ባለቤት" : "Broker · ደላላ"}</span>
  );
}

function TypeTag({ type }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
      background: type === "Business" ? T.goldSoft : T.leafSoft,
      color: type === "Business" ? "#8A6410" : T.forest,
    }}>{type}</span>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.mute, marginBottom: 5, letterSpacing: 0.3, textTransform: "uppercase" }}>{label}</div>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.line}`,
  fontFamily: bodyFont, fontSize: 14, color: T.ink, background: "#fff", boxSizing: "border-box",
};

const btnPrimary = { padding: "8px 14px", borderRadius: 8, border: "none", background: T.forest, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: bodyFont };
const btnGhost = { padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.forest}`, background: "#fff", color: T.forest, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: bodyFont };

/* Call button — a real tel: link. On a phone it opens the dialer with the number ready. */
function CallButton({ phone, label }) {
  return (
    <a href={`tel:${phone}`} style={{ ...btnPrimary, textDecoration: "none", display: "inline-block" }}>
      📞 {label || "Call / ደውል"}
    </a>
  );
}

/* ================= CHAT MODAL =================
   me = "tenant" | "lister". Messages live in shared root state, so a message
   sent as a tenant shows up in the landlord/broker Inquiries after switching roles. */
function ChatModal({ thread, listing, me, onSend, onClose }) {
  const [text, setText] = useState("");
  const scrollRef = useRef(null);
  const messages = thread?.messages || [];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };

  const other = me === "tenant" ? listing.name : thread.tenant;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(21,32,25,.45)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: T.card, borderRadius: 16, width: "100%", maxWidth: 440,
        display: "flex", flexDirection: "column", maxHeight: "85vh", overflow: "hidden",
        boxShadow: "0 20px 50px rgba(0,0,0,.3)", fontFamily: bodyFont,
      }}>
        {/* Header */}
        <div style={{ background: T.forest, color: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.leaf, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 }}>
            {other.charAt(0)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{other}</div>
            <div style={{ fontSize: 11, opacity: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {listing.title} · {fmtETB(listing.price)}/mo
            </div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px 14px 6px", background: T.paper, minHeight: 220 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", color: T.mute, fontSize: 13, padding: "30px 10px" }}>
              Start the conversation — ask about availability, viewing times, or the neighbourhood.
            </div>
          )}
          {messages.map((m, i) => {
            const isMine = m.from === me;
            return (
              <div key={i} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 8 }}>
                <div style={{
                  maxWidth: "78%", padding: "8px 12px", fontSize: 13.5, lineHeight: 1.45,
                  background: isMine ? T.forest : "#fff",
                  color: isMine ? "#fff" : T.ink,
                  border: isMine ? "none" : `1px solid ${T.line}`,
                  borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                }}>
                  {m.text}
                  <div style={{ fontSize: 10, opacity: 0.65, marginTop: 3, textAlign: "right" }}>{timeAgo(m.at)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Prototype hint */}
        <div style={{ padding: "6px 14px", fontSize: 11, color: T.mute, background: T.paper, borderTop: `1px dashed ${T.line}` }}>
          💡 Prototype: messages are shared across roles in this session — send one, then "⇄ Switch role" to reply from the other side.
        </div>

        {/* Input */}
        <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderTop: `1px solid ${T.line}`, background: T.card }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message… / መልእክት ይጻፉ…"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={send} style={{ ...btnPrimary, padding: "10px 16px" }}>Send</button>
        </div>
      </div>
    </div>
  );
}

/* ================= ROLE SELECTION (first screen) ================= */
function RoleGate({ onPick }) {
  const roles = [
    { key: "tenant", icon: "🔑", en: "I'm looking to rent", am: "ተከራይ", desc: "Search homes and business spaces by region, city, and neighbourhood. Save favourites and contact listers." },
    { key: "landlord", icon: "🏠", en: "I own property", am: "አከራይ / ባለቤት", desc: "List your houses or commercial spaces, manage inquiries, and rent directly — no middleman needed." },
    { key: "broker", icon: "🤝", en: "I'm a broker / intermediary", am: "ደላላ / አገናኝ", desc: "Manage a portfolio for multiple owners, track inquiries and commissions, and build a verified reputation." },
  ];
  return (
    <div style={{ minHeight: "100vh", background: T.forest, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: bodyFont }}>
      <div style={{ textAlign: "center", marginBottom: 34 }}>
        <div style={{ fontFamily: displayFont, fontSize: 44, fontWeight: 700, color: "#fff", letterSpacing: -1 }}>
          Kiray <span style={{ fontSize: 26, opacity: 0.85, fontWeight: 400 }}>ኪራይ</span>
        </div>
        <div style={{ color: "rgba(255,255,255,.8)", fontSize: 15, marginTop: 6 }}>
          Rentals across Ethiopia — every capital, every neighbourhood
        </div>
        <div style={{ color: T.gold, fontSize: 14, marginTop: 18, fontWeight: 600 }}>
          Who are you? · ማን ነዎት?
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, maxWidth: 880, width: "100%" }}>
        {roles.map((r) => (
          <button key={r.key} onClick={() => onPick(r.key)} style={{
            background: T.card, border: "none", borderRadius: 16, padding: "26px 22px",
            textAlign: "left", cursor: "pointer", transition: "transform .15s ease, box-shadow .15s ease",
            boxShadow: "0 6px 20px rgba(0,0,0,.18)",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ fontSize: 34, marginBottom: 10 }}>{r.icon}</div>
            <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 17, color: T.ink }}>{r.en}</div>
            <div style={{ color: T.leaf, fontWeight: 600, fontSize: 14, margin: "2px 0 10px" }}>{r.am}</div>
            <div style={{ fontSize: 13, color: T.mute, lineHeight: 1.5 }}>{r.desc}</div>
            <div style={{ marginTop: 16, color: T.forest, fontWeight: 700, fontSize: 13 }}>Continue →</div>
          </button>
        ))}
      </div>
      <div style={{ color: "rgba(255,255,255,.55)", fontSize: 12, marginTop: 30 }}>
        You can switch roles anytime from the top bar. Prototype — sample data only.
      </div>
    </div>
  );
}

/* ================= REGISTRATION / SIGN IN =================
   Simple registration: users provide their name and a phone number or email.
   No verification message is sent. In production, add a database (e.g.
   Supabase) so accounts persist, and optionally add OTP verification later. */
function AuthGate({ role, onDone, onSkip, onBack }) {
  const [method, setMethod] = useState("phone");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");

  const roleLabel = { tenant: "Tenant · ተከራይ", landlord: "Landlord · አከራይ", broker: "Broker · ደላላ" }[role];
  const contactOk = method === "phone"
    ? /^(\+251|0)9\d{8}$/.test(contact.replace(/[\s-]/g, ""))
    : /^\S+@\S+\.\S+$/.test(contact.trim());

  const submit = () => {
    if (name.trim().length < 2) return setError("Please enter your full name.");
    if (!contactOk) return setError(method === "phone" ? "Enter a valid Ethiopian mobile, e.g. +251 9… or 09…" : "Enter a valid email address.");
    onDone({ name: name.trim(), method, contact: contact.trim() });
  };

  return (
    <div style={{ minHeight: "100vh", background: T.forest, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: bodyFont }}>
      <div style={{ background: T.card, borderRadius: 16, padding: "26px 26px 22px", width: "100%", maxWidth: 400, boxShadow: "0 10px 30px rgba(0,0,0,.25)" }}>
        <div style={{ fontFamily: displayFont, fontSize: 23, fontWeight: 700, color: T.forest }}>Create your account</div>
        <div style={{ fontSize: 13, color: T.mute, margin: "4px 0 18px" }}>
          Registering as <strong>{roleLabel}</strong>{" · "}
          <button onClick={onBack} style={{ background: "none", border: "none", color: T.leaf, cursor: "pointer", fontSize: 13, padding: 0, textDecoration: "underline" }}>change</button>
        </div>

        <Field label="Full name / ሙሉ ስም">
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Negus" />
        </Field>
        <Field label="Register with">
          <div style={{ display: "flex", gap: 8 }}>
            <Chip active={method === "phone"} onClick={() => { setMethod("phone"); setContact(""); setError(""); }}>📱 Phone</Chip>
            <Chip active={method === "email"} onClick={() => { setMethod("email"); setContact(""); setError(""); }}>✉️ Email</Chip>
          </div>
        </Field>
        <Field label={method === "phone" ? "Mobile number" : "Email address"}>
          <input style={inputStyle} value={contact} onChange={(e) => setContact(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={method === "phone" ? "+251 9… or 09…" : "name@example.com"}
            inputMode={method === "phone" ? "tel" : "email"} />
        </Field>
        {error && <div style={{ color: T.danger, fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
        <button onClick={submit} style={{ ...btnPrimary, width: "100%", padding: 12, fontSize: 14 }}>Create account · ተመዝገብ</button>
        {role === "tenant" && (
          <button onClick={onSkip} style={{ background: "none", border: "none", color: T.mute, fontSize: 12.5, cursor: "pointer", marginTop: 14, width: "100%", textAlign: "center", textDecoration: "underline" }}>
            Skip for now — browse as guest
          </button>
        )}
      </div>
    </div>
  );
}

/* ================= SHARED HEADER ================= */
function Header({ role, tabs, tab, setTab, onSwitchRole, account }) {
  const roleLabel = { tenant: "Tenant · ተከራይ", landlord: "Landlord · አከራይ", broker: "Broker · ደላላ" }[role];
  return (
    <header style={{ background: T.forest, color: "#fff", padding: "12px 22px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: displayFont, fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>Kiray</span>
        <span style={{ fontSize: 14, opacity: 0.85 }}>ኪራይ</span>
      </div>
      <span style={{ fontSize: 11.5, background: "rgba(255,255,255,.14)", padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,.25)" }}>
        {roleLabel}
      </span>
      <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.85)" }}>
        👤 {account ? account.name : "Guest"}
      </span>
      <nav style={{ display: "flex", gap: 6, marginLeft: 8, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
            border: "1px solid rgba(255,255,255,.3)",
            background: tab === t.key ? "#fff" : "transparent",
            color: tab === t.key ? T.forest : "#fff",
          }}>{t.label}</button>
        ))}
      </nav>
      <button onClick={onSwitchRole} style={{ marginLeft: "auto", padding: "7px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "1px solid rgba(255,255,255,.3)", background: "transparent", color: "rgba(255,255,255,.85)" }}>
        ⇄ Switch role
      </button>
    </header>
  );
}

/* ================= LISTING CARD (shared) ================= */
function ListingCard({ l, selected, onSelect, saved, onToggleSave, tenantMode, onChat }) {
  const isSel = selected === l.id;
  return (
    <article onClick={() => onSelect(isSel ? null : l.id)} style={{
      background: T.card, borderRadius: 14, padding: "14px 16px", cursor: "pointer",
      border: `1.5px solid ${isSel ? T.forest : T.line}`,
      boxShadow: isSel ? "0 4px 14px rgba(14,59,46,.12)" : "none",
      transition: "all .15s ease",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
        <h3 style={{ margin: 0, fontFamily: displayFont, fontSize: 15.5, fontWeight: 700 }}>{l.title}</h3>
        <strong style={{ color: T.forest, whiteSpace: "nowrap", fontSize: 15 }}>
          {fmtETB(l.price)}<span style={{ fontSize: 11, color: T.mute, fontWeight: 400 }}>/mo</span>
        </strong>
      </div>
      <div style={{ fontSize: 12.5, color: T.mute, margin: "4px 0 8px" }}>
        {l.hood}, {l.city} · {l.region}
        <span style={{ margin: "0 6px" }}>·</span>
        <span title={fullDate(l.posted)}>🕐 Posted {timeAgo(l.posted)}</span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 12 }}>
        <TypeTag type={l.type} />
        {l.kind && <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: T.blueSoft, color: T.blue }}>{l.kind}</span>}
        {l.beds != null && <span style={{ color: T.mute }}>{l.beds} room{l.beds > 1 ? "s" : ""}</span>}
        <span style={{ color: T.mute }}>{l.size} m²</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <Badge kind={l.lister} />
          {tenantMode && (
            <button onClick={(e) => { e.stopPropagation(); onToggleSave(l.id); }} title="Save"
              style={{ border: "none", background: "none", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>
              {saved ? "❤️" : "🤍"}
            </button>
          )}
        </span>
      </div>
      {isSel && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.line}`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {l.features && l.features.length > 0 && (
            <div style={{ width: "100%", display: "flex", gap: 6, flexWrap: "wrap" }}>
              {l.features.map((f) => (
                <span key={f} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999, background: T.paper, border: `1px solid ${T.line}`, color: T.mute }}>✓ {f}</span>
              ))}
            </div>
          )}
          <div style={{ fontSize: 13 }}>
            Listed by <strong>{l.name}</strong>{" "}
            {l.verified
              ? <span style={{ color: T.forest, fontSize: 12 }}>✓ ID verified</span>
              : <span style={{ color: T.danger, fontSize: 12 }}>unverified</span>}
            <div style={{ fontSize: 12, color: T.mute, marginTop: 2 }}>
              Posted on {fullDate(l.posted)} · 📱 {fmtPhone(l.phone)}
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }} onClick={(e) => e.stopPropagation()}>
            <CallButton phone={l.phone} />
            <button style={btnGhost} onClick={() => onChat && onChat(l)}>💬 Chat in app</button>
          </div>
        </div>
      )}
    </article>
  );
}

/* ================= POST FORM (landlord & broker) ================= */
/* Helpers for the live location picker */
function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}
function FlyTo({ pos, trigger }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo([pos.lat, pos.lng], 17, { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  return null;
}

function PostForm({ role, onDone, account }) {
  const [posted, setPosted] = useState(false);
  const [ptype, setPtype] = useState("Residential");
  const [kind, setKind] = useState(PROPERTY_KINDS.Residential[0]);
  const [regionSel, setRegionSel] = useState(LOCATIONS[0].region);
  const [citySel, setCitySel] = useState(LOCATIONS[0].cities[0].name);
  const [feat, setFeat] = useState([]);
  const [coords, setCoords] = useState(null);      // { lat, lng } of the property
  const [confirmed, setConfirmed] = useState(false); // lister confirmed the pin
  const [geoMsg, setGeoMsg] = useState("");
  const [geoTrigger, setGeoTrigger] = useState(0);
  const [formErr, setFormErr] = useState("");
  const isBroker = role === "broker";
  const toggleFeat = (f) => setFeat((s) => s.includes(f) ? s.filter((x) => x !== f) : [...s, f]);
  const regionCities = (LOCATIONS.find((r) => r.region === regionSel) || LOCATIONS[0]).cities;
  const cityObj = regionCities.find((c) => c.name === citySel) || regionCities[0];
  const pickType = (t) => { setPtype(t); setKind(PROPERTY_KINDS[t][0]); };
  const pickRegion = (r) => {
    setRegionSel(r);
    setCitySel(LOCATIONS.find((x) => x.region === r).cities[0].name);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return setGeoMsg("Location is not supported in this browser — tap the map to place the pin manually.");
    setGeoMsg("Getting your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setConfirmed(false);
        setGeoMsg("");
        setGeoTrigger((t) => t + 1);
      },
      (err) => setGeoMsg(err.code === 1
        ? "Location permission denied — tap the map to place the pin manually."
        : "Couldn't get a GPS fix — tap the map to place the pin manually."),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const submitListing = () => {
    if (!coords) return setFormErr("Set the property location: tap “Use my current location” or tap the map to place the pin.");
    if (!confirmed) return setFormErr("Please confirm that the pin marks the actual location of the property.");
    setFormErr("");
    setPosted(true);
  };
  if (posted) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 40 }}>✓</div>
        <h2 style={{ fontFamily: displayFont, margin: "8px 0 6px" }}>Listing submitted</h2>
        <p style={{ color: T.mute, fontSize: 14, maxWidth: 380, margin: "0 auto" }}>
          Submitted {fullDate(new Date().toISOString())}{coords ? <> with location pin confirmed at <strong>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</strong></> : ""}. In production this enters review: phone / Fayda ID verification{isBroker ? " plus the owner's consent confirmation" : ""}, then it goes live on the map in the chosen neighbourhood.
        </p>
        <button onClick={onDone} style={{ ...btnPrimary, marginTop: 14, padding: "10px 18px" }}>View my listings</button>
      </div>
    );
  }
  return (
    <>
      <h2 style={{ fontFamily: displayFont, margin: "0 0 4px", fontSize: 20 }}>List a property</h2>
      <p style={{ color: T.mute, fontSize: 13, margin: "0 0 18px" }}>
        {isBroker
          ? "Brokers must record the owner's details — tenants see your name, the owner stays private until contract stage."
          : "You're listing as the owner. Verified owners get a badge and rank higher in search."}
      </p>
      {isBroker && (
        <div style={{ background: T.goldSoft, border: `1px solid ${T.gold}`, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#8A6410", marginBottom: 8 }}>OWNER DETAILS (kept private)</div>
          <Field label="Owner full name"><input style={inputStyle} placeholder="e.g. Ato Dawit Bekele" /></Field>
          <Field label="Owner phone"><input style={inputStyle} placeholder="+251 9…" /></Field>
          <Field label="Your commission"><select style={inputStyle}><option>1 month's rent (standard)</option><option>Half month's rent</option><option>Custom agreement</option></select></Field>
        </div>
      )}
      <Field label="Property type">
        <div style={{ display: "flex", gap: 8 }}>
          <Chip active={ptype === "Residential"} onClick={() => pickType("Residential")}>Residential · መኖሪያ</Chip>
          <Chip active={ptype === "Business"} onClick={() => pickType("Business")}>Business · ንግድ</Chip>
        </div>
      </Field>
      <Field label="Kind of property">
        <select style={inputStyle} value={kind} onChange={(e) => setKind(e.target.value)}>
          {PROPERTY_KINDS[ptype].map((k) => <option key={k}>{k}</option>)}
        </select>
      </Field>
      <Field label="Number of rooms">
        <select style={inputStyle}>
          <option>1 room</option><option>2 rooms</option><option>3 rooms</option><option>4 rooms</option><option>5+ rooms</option>
          <option>Not applicable (shop / office / warehouse)</option>
        </select>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Floor">
          <select style={inputStyle}>
            <option>Ground floor</option><option>1st floor</option><option>2nd floor</option><option>3rd floor</option>
            <option>4th floor</option><option>5th floor</option><option>6th floor or higher</option><option>Not applicable</option>
          </select>
        </Field>
        <Field label="Block / building no. (optional)">
          <input style={inputStyle} placeholder="e.g. Block B12" />
        </Field>
      </div>
      <Field label="Area in square metres (m²)">
        <input style={inputStyle} type="number" min="1" placeholder="e.g. 85" />
      </Field>
      <Field label="Features — select all that apply">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FEATURE_OPTIONS.map((f) => (
            <Chip key={f} small active={feat.includes(f)} onClick={() => toggleFeat(f)}>{feat.includes(f) ? "✓ " : ""}{f}</Chip>
          ))}
        </div>
      </Field>
      <Field label="Description / ዝርዝር መግለጫ">
        <textarea rows={4} style={{ ...inputStyle, resize: "vertical" }}
          placeholder="e.g. Ground floor, 2 rooms in a quiet shared compound near the bus station. Water comes daily, separate electric meter, 10 minutes walk to the market…" />
      </Field>
      <Field label="Region">
        <select style={inputStyle} value={regionSel} onChange={(e) => pickRegion(e.target.value)}>
          {LOCATIONS.map((r) => <option key={r.region} value={r.region}>{r.region}</option>)}
        </select>
      </Field>
      <Field label="City / town">
        <select style={inputStyle} value={citySel} onChange={(e) => setCitySel(e.target.value)}>
          {regionCities.map((c) => <option key={c.name} value={c.name}>{c.name} — {c.tier}</option>)}
        </select>
      </Field>
      <Field label="Neighbourhood / ሰፈር">
        <input style={inputStyle} placeholder={`e.g. ${cityObj.hoods[0]}`} list="hood-suggestions" />
        <datalist id="hood-suggestions">
          {cityObj.hoods.map((h) => <option key={h} value={h} />)}
        </datalist>
      </Field>
      <Field label="Monthly rent (ETB)"><input style={inputStyle} type="number" placeholder="e.g. 25000" /></Field>
      <Field label="Title"><input style={inputStyle} placeholder={`e.g. 2-room ${kind.toLowerCase()} in ${cityObj.hoods[0]}, ${citySel}`} /></Field>
      <Field label="Contact phone for this listing (optional)">
        <input style={inputStyle} inputMode="tel" placeholder="+251 9…" />
        <div style={{ fontSize: 11.5, color: T.mute, marginTop: 4, lineHeight: 1.4 }}>
          Leave empty to use your registered contact{account ? <> (<strong>{account.contact}</strong>)</> : ""}. Fill this only if tenants should reach you on a different number for this property.
        </div>
      </Field>
      <Field label="Property location — set the pin">
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" onClick={useMyLocation} style={{ ...btnPrimary, padding: "8px 12px" }}>📍 Use my current location</button>
          <span style={{ fontSize: 12, color: T.mute }}>or tap the map to place the pin, then drag it to adjust</span>
        </div>
        {geoMsg && <div style={{ fontSize: 12.5, color: T.danger, marginBottom: 8 }}>{geoMsg}</div>}
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 10, overflow: "hidden" }}>
          <MapContainer center={[9.02, 38.75]} zoom={6} scrollWheelZoom style={{ height: 260, width: "100%" }}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ClickToPlace onPick={(c) => { setCoords(c); setConfirmed(false); }} />
            <FlyTo pos={coords} trigger={geoTrigger} />
            {coords && (
              <Marker position={[coords.lat, coords.lng]} draggable icon={pinIcon(T.leaf, true)}
                eventHandlers={{ dragend: (e) => { const p = e.target.getLatLng(); setCoords({ lat: p.lat, lng: p.lng }); setConfirmed(false); } }} />
            )}
          </MapContainer>
        </div>
        {coords && (
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 10, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} style={{ marginTop: 2 }} />
            <span>I confirm this pin is the actual location of the property <span style={{ color: T.mute }}>({coords.lat.toFixed(5)}, {coords.lng.toFixed(5)})</span></span>
          </label>
        )}
      </Field>
      {formErr && <div style={{ color: T.danger, fontSize: 13, marginBottom: 10 }}>{formErr}</div>}
      <button onClick={submitListing} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: T.gold, color: T.ink, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
        Submit for verification
      </button>
    </>
  );
}

/* ================= TENANT EXPERIENCE ================= */
function TenantApp({ tab, chats, sendMessage, meName }) {
  const [region, setRegion] = useState(null);
  const [city, setCity] = useState(null);
  const [hood, setHood] = useState(null);
  const [ptype, setPtype] = useState("All");
  const [maxPrice, setMaxPrice] = useState(150000);
  const [selected, setSelected] = useState(null);
  const [saved, setSaved] = useState([1, 8]);
  const [chatListing, setChatListing] = useState(null);

  const regionObj = LOCATIONS.find((r) => r.region === region);
  const cityObj = regionObj?.cities.find((c) => c.name === city);

  const results = useMemo(() =>
    LISTINGS.filter((l) =>
      (!region || l.region === region) &&
      (!city || l.city === city) &&
      (!hood || l.hood === hood) &&
      (ptype === "All" || l.type === ptype) &&
      l.price <= maxPrice
    ).sort((a, b) => new Date(b.posted) - new Date(a.posted)),
    [region, city, hood, ptype, maxPrice]);

  const toggleSave = (id) => setSaved((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const clearFrom = (level) => {
    if (level <= 0) setRegion(null);
    if (level <= 1) setCity(null);
    if (level <= 2) setHood(null);
    setSelected(null);
  };

  const chatThread = chatListing ? chats.find((t) => t.listingId === chatListing.id && t.tenant === meName) : null;

  const body = tab === "saved" ? (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "22px 20px 50px" }}>
      <h2 style={{ fontFamily: displayFont, fontSize: 20, margin: "0 0 4px" }}>Saved listings</h2>
      <p style={{ color: T.mute, fontSize: 13, margin: "0 0 16px" }}>You'll get a notification if a saved listing's price changes or it's rented out.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {saved.length === 0 && <div style={{ background: T.card, border: `1px dashed ${T.line}`, borderRadius: 14, padding: 30, textAlign: "center", color: T.mute, fontSize: 14 }}>Nothing saved yet — tap the heart on any listing.</div>}
        {LISTINGS.filter((l) => saved.includes(l.id)).map((l) => (
          <ListingCard key={l.id} l={l} selected={selected} onSelect={setSelected} saved onToggleSave={toggleSave} tenantMode onChat={setChatListing} />
        ))}
      </div>
    </div>
  ) : (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "18px 20px 40px" }}>
      {/* Location ladder */}
      <section style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: "16px 18px", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 15 }}>Where?</span>
          <span style={{ fontSize: 12, color: T.mute }}>{region || "Region"} ▸ {city || "City"} ▸ {hood || "Neighbourhood"}</span>
          {(region || city || hood) && (
            <button onClick={() => clearFrom(0)} style={{ marginLeft: "auto", fontSize: 12, color: T.danger, background: "none", border: "none", cursor: "pointer" }}>Clear location</button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: region ? 12 : 0 }}>
          {LOCATIONS.map((r) => (
            <Chip key={r.region} active={region === r.region} onClick={() => { clearFrom(1); setRegion(r.region === region ? null : r.region); }}>{r.region}</Chip>
          ))}
        </div>
        {regionObj && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: city ? 12 : 0, paddingTop: 10, borderTop: `1px dashed ${T.line}` }}>
            {regionObj.cities.map((c) => (
              <Chip key={c.name} small active={city === c.name} onClick={() => { clearFrom(2); setCity(c.name === city ? null : c.name); }}>
                {c.name} <span style={{ opacity: 0.6 }}>· {c.tier}</span>
              </Chip>
            ))}
          </div>
        )}
        {cityObj && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 10, borderTop: `1px dashed ${T.line}` }}>
            {cityObj.hoods.map((h) => (
              <Chip key={h} small active={hood === h} onClick={() => { setHood(h === hood ? null : h); setSelected(null); }}>{h}</Chip>
            ))}
          </div>
        )}
      </section>

      {/* Type + price */}
      <section style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["All", "Residential", "Business"].map((t) => (
            <Chip key={t} active={ptype === t} onClick={() => setPtype(t)}>
              {t === "Residential" ? "Residential · መኖሪያ" : t === "Business" ? "Business · ንግድ" : "All"}
            </Chip>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
          <span style={{ color: T.mute }}>Max rent</span>
          <input type="range" min={5000} max={150000} step={5000} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} style={{ accentColor: T.forest }} />
          <strong>{fmtETB(maxPrice)}/mo</strong>
        </div>
        <span style={{ marginLeft: "auto", fontSize: 13, color: T.mute }}>
          <strong style={{ color: T.ink }}>{results.length}</strong> listing{results.length !== 1 ? "s" : ""} · newest first
        </span>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 1fr) minmax(320px, 1.1fr)", gap: 18, alignItems: "start" }}>
        <MapPanel results={results} selected={selected} setSelected={setSelected} />
        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {results.length === 0 && (
            <div style={{ background: T.card, border: `1px dashed ${T.line}`, borderRadius: 14, padding: 30, textAlign: "center", color: T.mute, fontSize: 14 }}>
              No listings match these filters yet. Widen the price range or clear the neighbourhood filter.
            </div>
          )}
          {results.map((l) => (
            <ListingCard key={l.id} l={l} selected={selected} onSelect={setSelected}
              saved={saved.includes(l.id)} onToggleSave={toggleSave} tenantMode onChat={setChatListing} />
          ))}
        </section>
      </div>
    </div>
  );

  return (
    <>
      {body}
      {chatListing && (
        <ChatModal
          thread={chatThread}
          listing={chatListing}
          me="tenant"
          onSend={(text) => sendMessage(chatListing.id, meName, "tenant", text)}
          onClose={() => setChatListing(null)}
        />
      )}
    </>
  );
}

/* ================= LANDLORD / BROKER EXPERIENCE ================= */
function ManagerApp({ role, tab, setTab, chats, sendMessage, account }) {
  const me = DEMO[role];
  const isBroker = role === "broker";
  const [selected, setSelected] = useState(null);
  const [openThreadId, setOpenThreadId] = useState(null);

  const mine = LISTINGS.filter((l) => l.name === me).sort((a, b) => new Date(b.posted) - new Date(a.posted));
  const myIds = mine.map((l) => l.id);
  const myThreads = chats
    .filter((t) => myIds.includes(t.listingId) && t.messages.length > 0)
    .sort((a, b) => new Date(b.messages[b.messages.length - 1].at) - new Date(a.messages[a.messages.length - 1].at));
  const totalViews = mine.reduce((s, l) => s + l.views, 0);

  const openThread = myThreads.find((t) => t.id === openThreadId);
  const openListing = openThread ? LISTINGS.find((l) => l.id === openThread.listingId) : null;

  let body;
  if (tab === "post") {
    body = (
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "26px 20px 60px" }}>
        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: "22px 24px" }}>
          <PostForm role={role} onDone={() => setTab("listings")} account={account} />
        </div>
      </div>
    );
  } else if (tab === "inquiries") {
    body = (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "22px 20px 50px" }}>
        <h2 style={{ fontFamily: displayFont, fontSize: 20, margin: "0 0 4px" }}>Tenant inquiries</h2>
        <p style={{ color: T.mute, fontSize: 13, margin: "0 0 16px" }}>
          Reply fast — listings that respond within 2 hours rank higher in tenant search.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {myThreads.length === 0 && (
            <div style={{ background: T.card, border: `1px dashed ${T.line}`, borderRadius: 14, padding: 30, textAlign: "center", color: T.mute, fontSize: 14 }}>
              No inquiries yet.
            </div>
          )}
          {myThreads.map((t) => {
            const l = LISTINGS.find((x) => x.id === t.listingId);
            const last = t.messages[t.messages.length - 1];
            const awaiting = last.from === "tenant";
            return (
              <article key={t.id} style={{ background: T.card, border: `1px solid ${awaiting ? T.gold : T.line}`, borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 14 }}>{t.tenant}</strong>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: T.blueSoft, color: T.blue }}>Tenant</span>
                  {awaiting && <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: T.goldSoft, color: "#8A6410" }}>awaiting reply</span>}
                  <span style={{ marginLeft: "auto", fontSize: 12, color: T.mute }}>{timeAgo(last.at)}</span>
                </div>
                <div style={{ fontSize: 12, color: T.mute, margin: "3px 0 8px" }}>Re: {l.title} — {l.hood}, {l.city}</div>
                <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.5 }}>
                  {last.from === "lister" && <em style={{ color: T.mute }}>You: </em>}{last.text}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={btnPrimary} onClick={() => setOpenThreadId(t.id)}>💬 Open chat ({t.messages.length})</button>
                  {t.tenantPhone && <CallButton phone={t.tenantPhone} label={`Call ${fmtPhone(t.tenantPhone)}`} />}
                  {isBroker && <button style={{ ...btnGhost, marginLeft: "auto", borderColor: T.gold, color: "#8A6410" }}>Schedule viewing</button>}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  } else {
    body = (
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "22px 20px 50px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
          <h2 style={{ fontFamily: displayFont, fontSize: 20, margin: 0 }}>
            {isBroker ? "My portfolio" : "My properties"}
          </h2>
          <span style={{ fontSize: 13, color: T.mute }}>Signed in as <strong>{me}</strong> <span style={{ color: T.forest }}>✓ verified</span></span>
        </div>
        <p style={{ color: T.mute, fontSize: 13, margin: "0 0 16px" }}>
          {isBroker ? "Listings you manage on behalf of owners. Owner details stay private to you." : "Listings you own and manage directly."}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { n: mine.length, l: "Active listings" },
            { n: totalViews, l: "Views this month" },
            { n: myThreads.length, l: "Open inquiries" },
            isBroker
              ? { n: new Set(mine.map((x) => x.owner)).size, l: "Owner clients" }
              : { n: mine.filter((x) => x.type === "Business").length, l: "Business units" },
          ].map((s) => (
            <div key={s.l} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontFamily: displayFont, fontSize: 24, fontWeight: 700, color: T.forest }}>{s.n}</div>
              <div style={{ fontSize: 12, color: T.mute }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 1.1fr) minmax(280px, 1fr)", gap: 18, alignItems: "start" }}>
          <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mine.map((l) => {
              const inq = myThreads.filter((t) => t.listingId === l.id).length;
              return (
                <article key={l.id} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                    <h3 style={{ margin: 0, fontFamily: displayFont, fontSize: 15, fontWeight: 700 }}>{l.title}</h3>
                    <strong style={{ color: T.forest, whiteSpace: "nowrap", fontSize: 14.5 }}>{fmtETB(l.price)}/mo</strong>
                  </div>
                  <div style={{ fontSize: 12.5, color: T.mute, margin: "4px 0 8px" }}>
                    {l.hood}, {l.city}
                    <span style={{ margin: "0 6px" }}>·</span>
                    <span title={fullDate(l.posted)}>🕐 Posted {timeAgo(l.posted)}</span>
                    {isBroker && l.owner && <> · Owner: <strong style={{ color: T.ink }}>{l.owner}</strong> 🔒</>}
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12, color: T.mute, flexWrap: "wrap" }}>
                    <TypeTag type={l.type} />
                    <span>👁 {l.views} views</span>
                    <span>✉ {inq} inquiries</span>
                    <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                      <button style={{ ...btnGhost, padding: "5px 10px", fontSize: 12 }}>Edit</button>
                      <button style={{ ...btnGhost, padding: "5px 10px", fontSize: 12, borderColor: T.danger, color: T.danger }}>Mark rented</button>
                    </span>
                  </div>
                  {isBroker && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${T.line}`, fontSize: 12, color: "#8A6410" }}>
                      Commission on deal: <strong>1 month's rent — {fmtETB(l.price)}</strong>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
          <MapPanel results={mine} selected={selected} setSelected={setSelected}
            subtitle={isBroker ? "Your managed portfolio" : "Your properties"} />
        </div>
      </div>
    );
  }

  return (
    <>
      {body}
      {openThread && openListing && (
        <ChatModal
          thread={openThread}
          listing={openListing}
          me="lister"
          onSend={(text) => sendMessage(openThread.listingId, openThread.tenant, "lister", text)}
          onClose={() => setOpenThreadId(null)}
        />
      )}
    </>
  );
}

/* ================= ROOT ================= */
export default function KirayApp() {
  const [role, setRole] = useState(null);
  const [pendingRole, setPendingRole] = useState(null); // role chosen, awaiting registration
  const [account, setAccount] = useState(null);
  const [tab, setTab] = useState("browse");
  /* Chat state lives at the root so it survives role switches within a session.
     In production this is a database + real-time updates (e.g. Supabase/Firebase). */
  const [chats, setChats] = useState(SEED_CHATS);

  const sendMessage = (listingId, tenant, from, text) => {
    const msg = { from, text, at: new Date().toISOString() };
    setChats((prev) => {
      const id = `${listingId}:${tenant}`;
      const existing = prev.find((t) => t.id === id);
      if (existing) {
        return prev.map((t) => t.id === id ? { ...t, messages: [...t.messages, msg] } : t);
      }
      return [...prev, { id, listingId, tenant, tenantPhone: account?.method === "phone" ? account.contact : null, messages: [msg] }];
    });
  };

  const enterAs = (r) => { setRole(r); setTab(r === "tenant" ? "browse" : "listings"); setPendingRole(null); };

  if (!role) {
    if (pendingRole) {
      return (
        <AuthGate
          role={pendingRole}
          onBack={() => setPendingRole(null)}
          onSkip={() => enterAs("tenant")}
          onDone={(acct) => { setAccount(acct); enterAs(pendingRole); }}
        />
      );
    }
    return <RoleGate onPick={(r) => { if (account) { enterAs(r); } else { setPendingRole(r); } }} />;
  }

  const tabsByRole = {
    tenant: [{ key: "browse", label: "Find a rental" }, { key: "saved", label: "Saved ❤" }],
    landlord: [{ key: "listings", label: "My properties" }, { key: "inquiries", label: "Inquiries" }, { key: "post", label: "+ New listing" }],
    broker: [{ key: "listings", label: "My portfolio" }, { key: "inquiries", label: "Inquiries" }, { key: "post", label: "+ New listing" }],
  };

  return (
    <div style={{ fontFamily: bodyFont, background: T.paper, minHeight: "100vh", color: T.ink }}>
      <Header role={role} tabs={tabsByRole[role]} tab={tab} setTab={setTab} onSwitchRole={() => setRole(null)} account={account} />
      {role === "tenant"
        ? <TenantApp tab={tab} chats={chats} sendMessage={sendMessage} meName={account ? account.name : TENANT_ME} />
        : <ManagerApp role={role} tab={tab} setTab={setTab} chats={chats} sendMessage={sendMessage} account={account} />}
      <footer style={{ textAlign: "center", padding: "14px 0 26px", fontSize: 12, color: T.mute }}>
        Kiray · ኪራይ — prototype. Listings and phone numbers are sample data. Map © OpenStreetMap contributors.
      </footer>
    </div>
  );
}

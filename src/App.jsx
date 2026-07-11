import { useState, useMemo } from "react";

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

/* ================= LOCATION DATA =================
   Region -> City (federal / regional / zonal capital) -> Neighbourhoods */
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

/* ================= MOCK LISTINGS ================= */
const LISTINGS = [
  { id: 1, title: "2-bedroom condominium, furnished", type: "Residential", city: "Addis Ababa", region: "Addis Ababa", hood: "Bole Medhanealem", price: 45000, beds: 2, size: 85, lister: "Broker", name: "Meskerem B.", owner: "Ato Dawit", verified: true, views: 214, jx: 0.6, jy: -0.4 },
  { id: 2, title: "Ground-floor shop on main road", type: "Business", city: "Addis Ababa", region: "Addis Ababa", hood: "Merkato", price: 60000, beds: null, size: 48, lister: "Owner", name: "W/ro Almaz", owner: null, verified: true, views: 158, jx: -0.8, jy: 0.2 },
  { id: 3, title: "Studio near Megenagna roundabout", type: "Residential", city: "Addis Ababa", region: "Addis Ababa", hood: "Megenagna", price: 15000, beds: 1, size: 38, lister: "Broker", name: "Meskerem B.", owner: "W/ro Hanna", verified: true, views: 96, jx: 0.9, jy: 0.5 },
  { id: 4, title: "Office floor, elevator building", type: "Business", city: "Addis Ababa", region: "Addis Ababa", hood: "Kazanchis", price: 120000, beds: null, size: 220, lister: "Owner", name: "W/ro Almaz", owner: null, verified: true, views: 342, jx: -0.2, jy: -0.9 },
  { id: 5, title: "3-bedroom villa with compound", city: "Addis Ababa", region: "Addis Ababa", hood: "CMC", type: "Residential", price: 80000, beds: 3, size: 180, lister: "Broker", name: "Meskerem B.", owner: "Ato Dawit", verified: true, views: 187, jx: 0.3, jy: 0.9 },
  { id: 6, title: "Lake-view apartment, 2 bedrooms", type: "Residential", city: "Bahir Dar", region: "Amhara", hood: "Tana Lakeside", price: 18000, beds: 2, size: 90, lister: "Owner", name: "Ato Mulugeta", owner: null, verified: true, views: 73, jx: 0.4, jy: -0.5 },
  { id: 7, title: "Café / restaurant space, Piassa corner", type: "Business", city: "Bahir Dar", region: "Amhara", hood: "Shum Abo", price: 35000, beds: null, size: 110, lister: "Broker", name: "Abay Brokers", owner: "Ato Kassahun", verified: false, views: 51, jx: -0.6, jy: 0.6 },
  { id: 8, title: "1-bedroom near Hawassa University", type: "Residential", city: "Hawassa", region: "Sidama", hood: "Tabor", price: 9000, beds: 1, size: 45, lister: "Owner", name: "W/ro Tigist", owner: null, verified: true, views: 129, jx: 0.5, jy: 0.3 },
  { id: 9, title: "Retail unit facing lakeside walkway", type: "Business", city: "Hawassa", region: "Sidama", hood: "Amora Gedel Lakeside", price: 28000, beds: null, size: 60, lister: "Broker", name: "Sidama Homes", owner: "Ato Bekele", verified: true, views: 88, jx: -0.4, jy: -0.6 },
  { id: 10, title: "Family house with service quarter", type: "Residential", city: "Adama", region: "Oromia", hood: "Boku", price: 20000, beds: 3, size: 160, lister: "Broker", name: "Adama Link", owner: "W/ro Chaltu", verified: true, views: 64, jx: 0.7, jy: 0.1 },
  { id: 11, title: "Warehouse near expressway exit", type: "Business", city: "Adama", region: "Oromia", hood: "Migira", price: 55000, beds: null, size: 400, lister: "Owner", name: "Oromia Logistics", owner: null, verified: true, views: 47, jx: -0.5, jy: 0.8 },
  { id: 12, title: "2-bedroom apartment, Ayder", type: "Residential", city: "Mekelle", region: "Tigray", hood: "Ayder", price: 12000, beds: 2, size: 78, lister: "Owner", name: "Ato Gebre", owner: null, verified: false, views: 39, jx: 0.2, jy: -0.7 },
  { id: 13, title: "Guesthouse compound in Jugol", type: "Business", city: "Harar", region: "Harari", hood: "Jugol (Old Town)", price: 40000, beds: 6, size: 300, lister: "Broker", name: "Harar Heritage", owner: "Ato Abdi", verified: true, views: 112, jx: -0.3, jy: 0.4 },
  { id: 14, title: "Shop row unit, Kezira market", type: "Business", city: "Dire Dawa", region: "Dire Dawa", hood: "Kezira", price: 22000, beds: null, size: 35, lister: "Owner", name: "Ato Ahmed", owner: null, verified: true, views: 58, jx: 0.6, jy: 0.6 },
  { id: 15, title: "New 1-bedroom, university area", type: "Residential", city: "Jigjiga", region: "Somali", hood: "University Area", price: 7000, beds: 1, size: 50, lister: "Owner", name: "Faysa A.", owner: null, verified: false, views: 25, jx: -0.7, jy: -0.3 },
  { id: 16, title: "3-bedroom house, Ginjo", type: "Residential", city: "Jimma", region: "Oromia", hood: "Ginjo", price: 11000, beds: 3, size: 140, lister: "Broker", name: "Jimma Homes", owner: "Ato Tesfaye", verified: true, views: 71, jx: 0.1, jy: 0.8 },
];

/* Demo accounts: the landlord demo signs in as W/ro Almaz, the broker demo as Meskerem B. */
const DEMO = { landlord: "W/ro Almaz", broker: "Meskerem B." };

const INQUIRIES = [
  { id: 1, listingId: 2, from: "Biniam G.", role: "Tenant", msg: "Is the shop still available? I run a mobile accessories business and can move in on Hamle 1.", when: "2h ago", phone: "+251 91 —" },
  { id: 2, listingId: 4, from: "Selam Tech PLC", role: "Tenant", msg: "We are a 15-person software company. Could we visit the office floor this week?", when: "5h ago", phone: "+251 92 —" },
  { id: 3, listingId: 4, from: "Hana M.", role: "Tenant", msg: "Is the price negotiable for a 2-year contract paid quarterly?", when: "1d ago", phone: "+251 93 —" },
  { id: 4, listingId: 1, from: "Dawit A.", role: "Tenant", msg: "Does the rent include water and the condo service fee?", when: "3h ago", phone: "+251 94 —" },
  { id: 5, listingId: 5, from: "Ruth & family", role: "Tenant", msg: "We'd like to view the villa Saturday morning. Is parking inside the compound?", when: "1d ago", phone: "+251 96 —" },
  { id: 6, listingId: 3, from: "Yared K.", role: "Tenant", msg: "Student at AAU — is a 6-month contract possible?", when: "2d ago", phone: "+251 97 —" },
];

/* ================= MAP PROJECTION ================= */
const MAP_W = 640, MAP_H = 520;
const px = (lng) => ((lng - 33) / (48 - 33)) * MAP_W;
const py = (lat) => ((15.0 - lat) / (15.0 - 3.4)) * MAP_H;
const ETHIOPIA_OUTLINE = [
  [14.85, 37.6], [14.4, 40.0], [12.5, 42.4], [11.1, 42.9], [10.9, 43.3],
  [9.4, 46.2], [8.0, 48.0], [4.45, 45.0], [3.5, 41.9], [3.6, 39.5],
  [4.45, 36.05], [5.4, 35.3], [6.6, 35.2], [7.6, 33.7], [9.5, 34.1],
  [10.9, 34.95], [12.7, 36.1], [14.3, 36.45],
].map(([lat, lng]) => `${px(lng).toFixed(1)},${py(lat).toFixed(1)}`).join(" ");

const fmtETB = (n) => "ETB " + n.toLocaleString("en-US");
const allCities = LOCATIONS.flatMap((r) => r.cities);

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

const btnPrimary = { padding: "8px 14px", borderRadius: 8, border: "none", background: T.forest, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost = { padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.forest}`, background: "#fff", color: T.forest, fontSize: 13, fontWeight: 600, cursor: "pointer" };

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

/* ================= SHARED HEADER ================= */
function Header({ role, tabs, tab, setTab, onSwitchRole }) {
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
function ListingCard({ l, selected, onSelect, saved, onToggleSave, tenantMode }) {
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
      <div style={{ fontSize: 12.5, color: T.mute, margin: "4px 0 8px" }}>{l.hood}, {l.city} · {l.region}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 12 }}>
        <TypeTag type={l.type} />
        {l.beds != null && <span style={{ color: T.mute }}>{l.beds} bed{l.beds > 1 ? "s" : ""}</span>}
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
          <div style={{ fontSize: 13 }}>
            Listed by <strong>{l.name}</strong>{" "}
            {l.verified
              ? <span style={{ color: T.forest, fontSize: 12 }}>✓ ID verified</span>
              : <span style={{ color: T.danger, fontSize: 12 }}>unverified</span>}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button style={btnPrimary}>Call / ደውል</button>
            <button style={btnGhost}>Chat in app</button>
          </div>
        </div>
      )}
    </article>
  );
}

/* ================= MAP PANEL (shared) ================= */
function MapPanel({ results, city, onPickCity, selected, setSelected, subtitle }) {
  return (
    <section style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, overflow: "hidden", position: "sticky", top: 12 }}>
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.line}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <strong style={{ fontFamily: displayFont, fontSize: 14 }}>Map view</strong>
        <span style={{ fontSize: 11, color: T.mute }}>{subtitle || "Prototype map — Google Maps SDK in production"}</span>
      </div>
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ width: "100%", display: "block", background: "#EFF4EE" }}>
        <polygon points={ETHIOPIA_OUTLINE} fill="#DCE9DB" stroke={T.forest} strokeWidth="1.5" strokeLinejoin="round" opacity="0.9" />
        {allCities.map((c) => (
          <g key={c.name} opacity={city && city !== c.name ? 0.25 : 1} style={{ cursor: onPickCity ? "pointer" : "default" }}
            onClick={() => onPickCity && onPickCity(c)}>
            <circle cx={px(c.lng)} cy={py(c.lat)} r={c.tier.includes("Federal") ? 5 : 3.5} fill={T.forest} />
            <text x={px(c.lng) + 7} y={py(c.lat) + 4} fontSize="10" fill={T.ink} fontFamily={bodyFont}>{c.name}</text>
          </g>
        ))}
        {results.map((l) => {
          const c = allCities.find((c) => c.name === l.city);
          if (!c) return null;
          const x = px(c.lng) + l.jx * 14, y = py(c.lat) + l.jy * 14;
          const isSel = selected === l.id;
          return (
            <g key={l.id} style={{ cursor: "pointer" }} onClick={() => setSelected(isSel ? null : l.id)}>
              <path d={`M ${x} ${y} m 0 -14 c -6 0 -9 4.5 -9 8.5 c 0 5 9 14 9 14 c 0 0 9 -9 9 -14 c 0 -4 -3 -8.5 -9 -8.5 z`}
                fill={l.type === "Business" ? T.gold : T.leaf}
                stroke={isSel ? T.ink : "#fff"} strokeWidth={isSel ? 2 : 1.2} />
              <circle cx={x} cy={y - 6.5} r="2.6" fill="#fff" />
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 16, padding: "8px 14px", fontSize: 11, color: T.mute, borderTop: `1px solid ${T.line}` }}>
        <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: T.leaf, marginRight: 5 }} />Residential</span>
        <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: T.gold, marginRight: 5 }} />Business</span>
        <span style={{ marginLeft: "auto" }}>Tap a city or a pin</span>
      </div>
    </section>
  );
}

/* ================= POST FORM (landlord & broker) ================= */
function PostForm({ role, onDone }) {
  const [posted, setPosted] = useState(false);
  const isBroker = role === "broker";
  if (posted) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 40 }}>✓</div>
        <h2 style={{ fontFamily: displayFont, margin: "8px 0 6px" }}>Listing submitted</h2>
        <p style={{ color: T.mute, fontSize: 14, maxWidth: 380, margin: "0 auto" }}>
          In production this enters review: phone / Fayda ID verification{isBroker ? " plus the owner's consent confirmation" : ""}, then it goes live on the map in the chosen neighbourhood.
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
      <Field label="Property type"><div style={{ display: "flex", gap: 8 }}><Chip active>Residential</Chip><Chip>Business</Chip></div></Field>
      <Field label="Region"><select style={inputStyle}>{LOCATIONS.map((r) => <option key={r.region}>{r.region}</option>)}</select></Field>
      <Field label="City"><select style={inputStyle}>{allCities.map((c) => <option key={c.name}>{c.name} — {c.tier}</option>)}</select></Field>
      <Field label="Neighbourhood / ሰፈር"><input style={inputStyle} placeholder="e.g. Bole Medhanealem" /></Field>
      <Field label="Monthly rent (ETB)"><input style={inputStyle} type="number" placeholder="e.g. 25000" /></Field>
      <Field label="Title"><input style={inputStyle} placeholder="e.g. 2-bedroom apartment near stadium" /></Field>
      <Field label="Pin the exact location">
        <div style={{ border: `1px dashed ${T.line}`, borderRadius: 8, padding: 16, textAlign: "center", color: T.mute, fontSize: 13, background: T.paper }}>
          📍 In production: draggable Google Maps pin + Places autocomplete
        </div>
      </Field>
      <button onClick={() => setPosted(true)} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: T.gold, color: T.ink, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
        Submit for verification
      </button>
    </>
  );
}

/* ================= TENANT EXPERIENCE ================= */
function TenantApp({ tab }) {
  const [region, setRegion] = useState(null);
  const [city, setCity] = useState(null);
  const [hood, setHood] = useState(null);
  const [ptype, setPtype] = useState("All");
  const [maxPrice, setMaxPrice] = useState(150000);
  const [selected, setSelected] = useState(null);
  const [saved, setSaved] = useState([1, 8]);

  const regionObj = LOCATIONS.find((r) => r.region === region);
  const cityObj = regionObj?.cities.find((c) => c.name === city);

  const results = useMemo(() => LISTINGS.filter((l) =>
    (!region || l.region === region) &&
    (!city || l.city === city) &&
    (!hood || l.hood === hood) &&
    (ptype === "All" || l.type === ptype) &&
    l.price <= maxPrice
  ), [region, city, hood, ptype, maxPrice]);

  const toggleSave = (id) => setSaved((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const clearFrom = (level) => {
    if (level <= 0) setRegion(null);
    if (level <= 1) setCity(null);
    if (level <= 2) setHood(null);
    setSelected(null);
  };

  if (tab === "saved") {
    const savedListings = LISTINGS.filter((l) => saved.includes(l.id));
    return (
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "22px 20px 50px" }}>
        <h2 style={{ fontFamily: displayFont, fontSize: 20, margin: "0 0 4px" }}>Saved listings</h2>
        <p style={{ color: T.mute, fontSize: 13, margin: "0 0 16px" }}>You'll get a notification if a saved listing's price changes or it's rented out.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {savedListings.length === 0 && <div style={{ background: T.card, border: `1px dashed ${T.line}`, borderRadius: 14, padding: 30, textAlign: "center", color: T.mute, fontSize: 14 }}>Nothing saved yet — tap the heart on any listing.</div>}
          {savedListings.map((l) => (
            <ListingCard key={l.id} l={l} selected={selected} onSelect={setSelected} saved onToggleSave={toggleSave} tenantMode />
          ))}
        </div>
      </div>
    );
  }

  return (
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
          <strong style={{ color: T.ink }}>{results.length}</strong> listing{results.length !== 1 ? "s" : ""} found
        </span>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 1fr) minmax(320px, 1.1fr)", gap: 18, alignItems: "start" }}>
        <MapPanel results={results} city={city} selected={selected} setSelected={setSelected}
          onPickCity={(c) => {
            setRegion(LOCATIONS.find((r) => r.cities.some((x) => x.name === c.name)).region);
            setCity(c.name); setHood(null); setSelected(null);
          }} />
        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {results.length === 0 && (
            <div style={{ background: T.card, border: `1px dashed ${T.line}`, borderRadius: 14, padding: 30, textAlign: "center", color: T.mute, fontSize: 14 }}>
              No listings match these filters yet. Widen the price range or clear the neighbourhood filter.
            </div>
          )}
          {results.map((l) => (
            <ListingCard key={l.id} l={l} selected={selected} onSelect={setSelected}
              saved={saved.includes(l.id)} onToggleSave={toggleSave} tenantMode />
          ))}
        </section>
      </div>
    </div>
  );
}

/* ================= LANDLORD / BROKER EXPERIENCE ================= */
function ManagerApp({ role, tab, setTab }) {
  const me = DEMO[role];
  const isBroker = role === "broker";
  const [selected, setSelected] = useState(null);
  const mine = LISTINGS.filter((l) => l.name === me);
  const myInquiries = INQUIRIES.filter((q) => mine.some((l) => l.id === q.listingId));
  const totalViews = mine.reduce((s, l) => s + l.views, 0);

  if (tab === "post") {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "26px 20px 60px" }}>
        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: "22px 24px" }}>
          <PostForm role={role} onDone={() => setTab("listings")} />
        </div>
      </div>
    );
  }

  if (tab === "inquiries") {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "22px 20px 50px" }}>
        <h2 style={{ fontFamily: displayFont, fontSize: 20, margin: "0 0 4px" }}>Tenant inquiries</h2>
        <p style={{ color: T.mute, fontSize: 13, margin: "0 0 16px" }}>
          Reply fast — listings that respond within 2 hours rank higher in tenant search.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {myInquiries.map((q) => {
            const l = LISTINGS.find((x) => x.id === q.listingId);
            return (
              <article key={q.id} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 14 }}>{q.from}</strong>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: T.blueSoft, color: T.blue }}>{q.role}</span>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: T.mute }}>{q.when}</span>
                </div>
                <div style={{ fontSize: 12, color: T.mute, margin: "3px 0 8px" }}>Re: {l.title} — {l.hood}, {l.city}</div>
                <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.5 }}>{q.msg}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={btnPrimary}>Reply in chat</button>
                  <button style={btnGhost}>Call {q.phone}</button>
                  {isBroker && <button style={{ ...btnGhost, marginLeft: "auto", borderColor: T.gold, color: "#8A6410" }}>Schedule viewing</button>}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  /* Default tab: dashboard / my listings */
  return (
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

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { n: mine.length, l: "Active listings" },
          { n: totalViews, l: "Views this month" },
          { n: myInquiries.length, l: "Open inquiries" },
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
        {/* Listings management list */}
        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mine.map((l) => {
            const inq = INQUIRIES.filter((q) => q.listingId === l.id).length;
            return (
              <article key={l.id} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                  <h3 style={{ margin: 0, fontFamily: displayFont, fontSize: 15, fontWeight: 700 }}>{l.title}</h3>
                  <strong style={{ color: T.forest, whiteSpace: "nowrap", fontSize: 14.5 }}>{fmtETB(l.price)}/mo</strong>
                </div>
                <div style={{ fontSize: 12.5, color: T.mute, margin: "4px 0 8px" }}>
                  {l.hood}, {l.city}
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
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${T.line}`, fontSize: 12, color: "#8A6410", background: "transparent" }}>
                    Commission on deal: <strong>1 month's rent — {fmtETB(l.price)}</strong>
                  </div>
                )}
              </article>
            );
          })}
        </section>
        {/* Map of my portfolio */}
        <MapPanel results={mine} city={null} selected={selected} setSelected={setSelected}
          subtitle={isBroker ? "Your managed portfolio" : "Your properties"} />
      </div>
    </div>
  );
}

/* ================= ROOT ================= */
export default function KirayApp() {
  const [role, setRole] = useState(null);
  const [tab, setTab] = useState("browse");

  if (!role) return <RoleGate onPick={(r) => { setRole(r); setTab(r === "tenant" ? "browse" : "listings"); }} />;

  const tabsByRole = {
    tenant: [{ key: "browse", label: "Find a rental" }, { key: "saved", label: "Saved ❤" }],
    landlord: [{ key: "listings", label: "My properties" }, { key: "inquiries", label: "Inquiries" }, { key: "post", label: "+ New listing" }],
    broker: [{ key: "listings", label: "My portfolio" }, { key: "inquiries", label: "Inquiries" }, { key: "post", label: "+ New listing" }],
  };

  return (
    <div style={{ fontFamily: bodyFont, background: T.paper, minHeight: "100vh", color: T.ink }}>
      <Header role={role} tabs={tabsByRole[role]} tab={tab} setTab={setTab} onSwitchRole={() => setRole(null)} />
      {role === "tenant"
        ? <TenantApp tab={tab} />
        : <ManagerApp role={role} tab={tab} setTab={setTab} />}
      <footer style={{ textAlign: "center", padding: "14px 0 26px", fontSize: 12, color: T.mute }}>
        Kiray · ኪራይ — prototype. Listings shown are sample data.
      </footer>
    </div>
  );
}

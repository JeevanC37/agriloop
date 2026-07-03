import React, { useState, useEffect, useMemo } from "react";

/* ================= AgriLoop Grade & Route — MVP Prototype =================
   Simulates the full seller flow: capture → on-device grading → post lot →
   ranked buyer matches → confirmed pickup. Plus a buyer-side feed.
   CV inference is simulated. Kolar pilot data. EN / Kannada toggle.
=========================================================================== */

const C = {
  ink: "#12281A",
  green: "#1C5E33",
  greenDark: "#143F23",
  leaf: "#2E8B4A",
  bg: "#EFEEE8",
  card: "#FFFFFF",
  line: "#DDDACF",
  soil: "#6B4A2B",
  amber: "#C77700",
  red: "#C6362B",
  tag: "#F2C14E",
  mut: "#6E6A5E",
};

const GRADE = {
  B: { color: "#1C7C3C", bgc: "#E2F2E6", en: "Process-ready", kn: "ಸಂಸ್ಕರಣೆಗೆ ಸಿದ್ಧ", useEn: "Puree · flakes · powder · pickle", useKn: "ಪ್ಯೂರಿ · ಫ್ಲೇಕ್ಸ್ · ಪುಡಿ · ಉಪ್ಪಿನಕಾಯಿ" },
  C: { color: "#C77700", bgc: "#FBEFDC", en: "Feed / extraction", kn: "ಮೇವು / ಸಾರ ತೆಗೆಯುವಿಕೆ", useEn: "Cattle feed · peel extraction", useKn: "ದನದ ಮೇವು · ಸಿಪ್ಪೆ ಸಾರ" },
  D: { color: "#6B4A2B", bgc: "#F0E6DB", en: "Compost / biogas", kn: "ಗೊಬ್ಬರ / ಜೈವಿಕ ಅನಿಲ", useEn: "Biogas feedstock · compost", useKn: "ಜೈವಿಕ ಅನಿಲ · ಕಾಂಪೋಸ್ಟ್" },
};

const CROPS = {
  tomato: {
    en: "Tomato", kn: "ಟೊಮೇಟೊ", fill: "#D9432F", top: "#3E7C33",
    samples: [
      { id: "t1", en: "Size / shape reject", kn: "ಗಾತ್ರ ತಿರಸ್ಕೃತ", grade: "B", conf: 93, shelf: 36, price: [5, 7], blem: 0 },
      { id: "t2", en: "Surface blemish", kn: "ಮೇಲ್ಮೈ ಕಲೆ", grade: "B", conf: 88, shelf: 30, price: [4.5, 6], blem: 1 },
      { id: "t3", en: "Over-ripe / soft", kn: "ಅತಿ ಹಣ್ಣಾದ", grade: "C", conf: 90, shelf: 18, price: [2, 3], blem: 1 },
      { id: "t4", en: "Fungal spotting", kn: "ಶಿಲೀಂಧ್ರ ಕಲೆ", grade: "D", conf: 95, shelf: 12, price: [0.8, 1.5], blem: 2 },
    ],
  },
  onion: {
    en: "Onion", kn: "ಈರುಳ್ಳಿ", fill: "#A65E8A", top: "#7C4368",
    samples: [
      { id: "o1", en: "Outer-skin damage", kn: "ಹೊರ ಸಿಪ್ಪೆ ಹಾನಿ", grade: "B", conf: 91, shelf: 72, price: [4, 6], blem: 1 },
      { id: "o2", en: "Undersize bulbs", kn: "ಸಣ್ಣ ಗಡ್ಡೆ", grade: "B", conf: 94, shelf: 96, price: [3.5, 5], blem: 0 },
      { id: "o3", en: "Sprouted", kn: "ಮೊಳಕೆಯೊಡೆದ", grade: "C", conf: 89, shelf: 48, price: [1.8, 2.6], blem: 1 },
      { id: "o4", en: "Rot patches", kn: "ಕೊಳೆತ ಭಾಗ", grade: "D", conf: 96, shelf: 20, price: [0.7, 1.2], blem: 2 },
    ],
  },
  mango: {
    en: "Mango", kn: "ಮಾವು", fill: "#E8A020", top: "#4C8A3A",
    samples: [
      { id: "m1", en: "Over-ripe (pulp-grade)", kn: "ಅತಿ ಹಣ್ಣಾದ (ಪಲ್ಪ್)", grade: "B", conf: 92, shelf: 24, price: [8, 12], blem: 1 },
      { id: "m2", en: "Size / colour reject", kn: "ಗಾತ್ರ / ಬಣ್ಣ ತಿರಸ್ಕೃತ", grade: "B", conf: 90, shelf: 60, price: [7, 10], blem: 0 },
      { id: "m3", en: "Bruised", kn: "ಜಜ್ಜಿದ", grade: "C", conf: 87, shelf: 20, price: [3, 5], blem: 1 },
      { id: "m4", en: "Spoilage onset", kn: "ಕೆಡಲು ಆರಂಭ", grade: "D", conf: 94, shelf: 10, price: [1, 1.8], blem: 2 },
    ],
  },
};

const BUYERS = [
  { id: "b1", name: "Sri Lakshmi Dehydration Unit", place: "Vemgal", dist: 12, grades: ["B"], crops: ["tomato", "onion"], rate: 6.2, capacity: 900, type: { en: "Dehydration · flakes & powder", kn: "ನಿರ್ಜಲೀಕರಣ ಘಟಕ" } },
  { id: "b2", name: "Kolar Agro Pulp & Pickles", place: "Kolar town", dist: 8, grades: ["B"], crops: ["tomato", "mango"], rate: 5.6, capacity: 600, type: { en: "Pulp · pickle · jam unit", kn: "ಪಲ್ಪ್ · ಉಪ್ಪಿನಕಾಯಿ ಘಟಕ" } },
  { id: "b3", name: "Malur Fruit Processors", place: "Malur", dist: 19, grades: ["B"], crops: ["mango"], rate: 9.4, capacity: 1200, type: { en: "Mango puree line", kn: "ಮಾವಿನ ಪ್ಯೂರಿ ಘಟಕ" } },
  { id: "b4", name: "Nandi Cattle Feeds", place: "Malur", dist: 17, grades: ["C"], crops: ["tomato", "onion", "mango"], rate: 2.3, capacity: 1500, type: { en: "Feed aggregator", kn: "ಮೇವು ಸಂಗ್ರಾಹಕ" } },
  { id: "b5", name: "GreenGas Biodigesters", place: "Narasapura", dist: 5, grades: ["D"], crops: ["tomato", "onion", "mango"], rate: 1.1, capacity: 2000, type: { en: "Biogas plant", kn: "ಜೈವಿಕ ಅನಿಲ ಘಟಕ" } },
  { id: "b6", name: "Kolar FPO Compost Yard", place: "Sugatur", dist: 11, grades: ["C", "D"], crops: ["tomato", "onion", "mango"], rate: 0.9, capacity: 3000, type: { en: "Compost yard", kn: "ಕಾಂಪೋಸ್ಟ್ ಯಾರ್ಡ್" } },
];

const T = {
  en: {
    tagline: "GRADE & ROUTE", pilot: "Kolar pilot · simulated CV model",
    seller: "Packhouse", buyer: "Buyer", today: "Today", diverted: "kg diverted",
    income: "income created", active: "active lots", myLots: "My lots",
    gradeLot: "Grade a lot", open: "Open", matched: "Matched", left: "left",
    expired: "expired", newLot: "New lot", selectCrop: "1 · Select crop",
    capture: "2 · Photograph the rejected lot", captureHint: "Tap a sample — the prototype stands in for the phone camera.",
    qty: "3 · Approx. quantity (kg)", analyze: "Grade this lot",
    analyzing: "Grading on-device…", s1: "Colour histogram", s2: "Surface defect map", s3: "Ripeness estimate", s4: "Grade assignment",
    offline: "Works offline · syncs later", confidence: "confidence",
    estValue: "Est. farm-gate value", channels: "Recommended channels",
    shelf: "Route within", post: "Post lot & find buyers", retake: "Retake",
    matches: "Ranked buyer matches", matchHint: "Scored on price, distance and today's capacity.",
    score: "match", offers: "offers", canTake: "can take", select: "Select buyer",
    confirmed: "Match confirmed", pickup: "Pickup window", payVia: "Payment settled directly via UPI · recorded on platform",
    smsSent: "SMS sent to buyer and packhouse supervisor", backHome: "Back to home",
    feed: "Open lots near you", feedHint: "Sorted by urgency — shortest shelf life first.",
    accept: "Accept & schedule pickup", none: "No open lots right now.",
    km: "km", perKg: "/kg", kgday: "kg today", lotPosted: "Lot posted",
    at: "at", commission: "Platform fee 6% on settlement",
  },
  kn: {
    tagline: "ಗ್ರೇಡ್ & ರೂಟ್", pilot: "ಕೋಲಾರ ಪೈಲಟ್ · ಸಿಮ್ಯುಲೇಟೆಡ್ CV ಮಾದರಿ",
    seller: "ಪ್ಯಾಕ್‌ಹೌಸ್", buyer: "ಖರೀದಿದಾರ", today: "ಇಂದು", diverted: "ಕೆ.ಜಿ ಉಳಿಸಲಾಗಿದೆ",
    income: "ಗಳಿಸಿದ ಆದಾಯ", active: "ಸಕ್ರಿಯ ಲಾಟ್", myLots: "ನನ್ನ ಲಾಟ್‌ಗಳು",
    gradeLot: "ಲಾಟ್ ಗ್ರೇಡ್ ಮಾಡಿ", open: "ತೆರೆದಿದೆ", matched: "ಹೊಂದಾಣಿಕೆ", left: "ಬಾಕಿ",
    expired: "ಅವಧಿ ಮೀರಿದೆ", newLot: "ಹೊಸ ಲಾಟ್", selectCrop: "೧ · ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ",
    capture: "೨ · ತಿರಸ್ಕೃತ ಲಾಟ್ ಫೋಟೋ ತೆಗೆಯಿರಿ", captureHint: "ಮಾದರಿ ಒತ್ತಿ — ಇದು ಕ್ಯಾಮೆರಾ ಬದಲಿಗೆ.",
    qty: "೩ · ಅಂದಾಜು ಪ್ರಮಾಣ (ಕೆ.ಜಿ)", analyze: "ಈ ಲಾಟ್ ಗ್ರೇಡ್ ಮಾಡಿ",
    analyzing: "ಸಾಧನದಲ್ಲೇ ಗ್ರೇಡಿಂಗ್…", s1: "ಬಣ್ಣ ವಿಶ್ಲೇಷಣೆ", s2: "ಮೇಲ್ಮೈ ದೋಷ ನಕ್ಷೆ", s3: "ಹಣ್ಣಾಗುವಿಕೆ ಅಂದಾಜು", s4: "ಗ್ರೇಡ್ ನಿರ್ಧಾರ",
    offline: "ಆಫ್‌ಲೈನ್‌ನಲ್ಲೂ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ", confidence: "ವಿಶ್ವಾಸ",
    estValue: "ಅಂದಾಜು ಬೆಲೆ", channels: "ಶಿಫಾರಸು ಮಾಡಿದ ಮಾರ್ಗಗಳು",
    shelf: "ಇಷ್ಟರೊಳಗೆ ಕಳುಹಿಸಿ", post: "ಲಾಟ್ ಪೋಸ್ಟ್ ಮಾಡಿ", retake: "ಮತ್ತೆ ತೆಗೆಯಿರಿ",
    matches: "ಖರೀದಿದಾರರ ಶ್ರೇಣಿ", matchHint: "ಬೆಲೆ, ದೂರ ಮತ್ತು ಸಾಮರ್ಥ್ಯದ ಮೇಲೆ ಅಂಕ.",
    score: "ಹೊಂದಾಣಿಕೆ", offers: "ಬೆಲೆ", canTake: "ಸಾಮರ್ಥ್ಯ", select: "ಖರೀದಿದಾರ ಆಯ್ಕೆ",
    confirmed: "ಹೊಂದಾಣಿಕೆ ಖಚಿತ", pickup: "ಪಿಕಪ್ ಸಮಯ", payVia: "ಪಾವತಿ ನೇರ UPI ಮೂಲಕ · ವೇದಿಕೆಯಲ್ಲಿ ದಾಖಲು",
    smsSent: "ಖರೀದಿದಾರರಿಗೆ SMS ಕಳುಹಿಸಲಾಗಿದೆ", backHome: "ಮುಖಪುಟಕ್ಕೆ",
    feed: "ಹತ್ತಿರದ ತೆರೆದ ಲಾಟ್‌ಗಳು", feedHint: "ತುರ್ತು ಪ್ರಕಾರ ಜೋಡಿಸಲಾಗಿದೆ.",
    accept: "ಒಪ್ಪಿಕೊಂಡು ಪಿಕಪ್ ನಿಗದಿಪಡಿಸಿ", none: "ಸದ್ಯ ತೆರೆದ ಲಾಟ್ ಇಲ್ಲ.",
    km: "ಕಿ.ಮೀ", perKg: "/ಕೆ.ಜಿ", kgday: "ಕೆ.ಜಿ ಇಂದು", lotPosted: "ಲಾಟ್ ಪೋಸ್ಟ್ ಆಗಿದೆ",
    at: "ಬೆಲೆ", commission: "ವೇದಿಕೆ ಶುಲ್ಕ 6%",
  },
};

/* ---------- tiny SVG produce renderer ---------- */
function Produce({ crop, blem = 0, size = 64 }) {
  const c = CROPS[crop];
  const spots = blem === 0 ? [] : blem === 1 ? [[42, 40, 5]] : [[40, 38, 6], [26, 46, 4], [34, 28, 3]];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      {crop === "tomato" && (<>
        <circle cx="32" cy="36" r="20" fill={c.fill} />
        <circle cx="26" cy="30" r="6" fill="#FFFFFF" opacity="0.22" />
        <path d="M32 16 l-6 -4 4 5 -7 -1 6 3 -5 3 7 -1 -3 5 4 -4 4 4 -3 -5 7 1 -5 -3 6 -3 -7 1 4 -5z" fill={c.top} />
      </>)}
      {crop === "onion" && (<>
        <ellipse cx="32" cy="38" rx="18" ry="17" fill={c.fill} />
        <path d="M20 30 q12 -8 24 0" stroke={c.top} strokeWidth="1.6" fill="none" opacity="0.6" />
        <path d="M18 38 q14 -6 28 0" stroke={c.top} strokeWidth="1.6" fill="none" opacity="0.5" />
        <path d="M32 21 q-2 -8 0 -11 q2 3 0 11z" fill="#C9B88A" />
        <circle cx="27" cy="33" r="5" fill="#FFFFFF" opacity="0.18" />
      </>)}
      {crop === "mango" && (<>
        <ellipse cx="33" cy="38" rx="19" ry="15" fill={c.fill} transform="rotate(-18 33 38)" />
        <circle cx="27" cy="31" r="6" fill="#FFFFFF" opacity="0.25" />
        <path d="M44 24 q6 -6 12 -5 q-4 6 -12 5z" fill={c.top} />
        <path d="M44 25 q-4 -6 -6 -10" stroke="#7A5A2A" strokeWidth="2" fill="none" />
      </>)}
      {spots.map((s, i) => (
        <circle key={i} cx={s[0]} cy={s[1]} r={s[2]} fill="#5B3A1E" opacity="0.75" />
      ))}
    </svg>
  );
}

function GradeTag({ grade, size = 72, lang }) {
  const g = GRADE[grade];
  return (
    <div style={{
      width: size, height: size, background: g.color, color: "#FFF",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Saira Condensed', system-ui", fontWeight: 800,
      fontSize: size * 0.55, borderRadius: 8, transform: "rotate(-4deg)",
      boxShadow: "2px 3px 0 rgba(18,40,26,0.25)", border: "3px dashed rgba(255,255,255,0.55)",
      flexShrink: 0,
    }}>{grade}</div>
  );
}

function ShelfBar({ hoursLeft, shelf, lang }) {
  const pct = Math.max(0, Math.min(100, (hoursLeft / shelf) * 100));
  const urgent = pct < 30;
  return (
    <div>
      <div style={{ height: 6, background: "#E8E5DA", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: urgent ? C.red : C.leaf, borderRadius: 3, transition: "width 1s linear" }} />
      </div>
      <div style={{ fontSize: 11, color: urgent ? C.red : C.mut, marginTop: 3, fontWeight: 600 }}>
        {hoursLeft > 0 ? `${Math.floor(hoursLeft)}h ${T[lang].left}` : T[lang].expired}
      </div>
    </div>
  );
}

/* ---------- main app ---------- */
export default function AgriLoopPrototype() {
  const [lang, setLang] = useState("en");
  const [role, setRole] = useState("seller");
  const [screen, setScreen] = useState("home");
  const [crop, setCrop] = useState("tomato");
  const [sample, setSample] = useState(null);
  const [qty, setQty] = useState(200);
  const [step, setStep] = useState(0);
  const [activeLot, setActiveLot] = useState(null);
  const [chosenBuyer, setChosenBuyer] = useState(null);
  const [now, setNow] = useState(Date.now());
  const t = T[lang];

  const [lots, setLots] = useState(() => {
    const h = 3600e3;
    return [
      { id: 1, crop: "onion", sample: CROPS.onion.samples[0], qty: 350, createdAt: Date.now() - 5 * h, status: "matched", buyer: BUYERS[0], settled: 1960 },
      { id: 2, crop: "tomato", sample: CROPS.tomato.samples[2], qty: 180, createdAt: Date.now() - 2 * h, status: "open" },
    ];
  });

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  /* fake CV pipeline */
  useEffect(() => {
    if (screen !== "grading") return;
    setStep(0);
    const timers = [1, 2, 3, 4].map((i) => setTimeout(() => setStep(i), i * 550));
    const done = setTimeout(() => setScreen("result"), 2600);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, [screen]);

  const hoursLeft = (lot) => lot.sample.shelf - (now - lot.createdAt) / 3600e3;

  const matchesFor = (lot) => {
    const list = BUYERS.filter((b) => b.grades.includes(lot.sample.grade) && b.crops.includes(lot.crop));
    const maxRate = Math.max(...list.map((b) => b.rate), 0.1);
    return list.map((b) => ({
      ...b,
      score: Math.round(100 * (0.4 * (b.rate / maxRate) + 0.35 * (1 - Math.min(b.dist, 30) / 30) + 0.25 * Math.min(b.capacity / 1500, 1))),
    })).sort((a, b) => b.score - a.score);
  };

  const postLot = () => {
    const lot = { id: Date.now(), crop, sample, qty, createdAt: Date.now(), status: "open" };
    setLots((l) => [lot, ...l]);
    setActiveLot(lot);
    setScreen("matches");
  };

  const confirmBuyer = (b) => {
    setChosenBuyer(b);
    setLots((l) => l.map((x) => x.id === activeLot.id ? { ...x, status: "matched", buyer: b, settled: Math.round(x.qty * b.rate) } : x));
    setScreen("confirmed");
  };

  const acceptAsBuyer = (lot) => {
    const b = matchesFor(lot)[0];
    setLots((l) => l.map((x) => x.id === lot.id ? { ...x, status: "matched", buyer: { ...b, name: "You (buyer)" }, settled: Math.round(x.qty * (b ? b.rate : 2)) } : x));
  };

  const stats = useMemo(() => {
    const m = lots.filter((l) => l.status === "matched");
    return {
      kg: m.reduce((s, l) => s + l.qty, 0),
      inr: m.reduce((s, l) => s + (l.settled || 0), 0),
      active: lots.filter((l) => l.status === "open").length,
    };
  }, [lots]);

  const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
  const btn = (bg = C.green) => ({
    width: "100%", padding: "14px 16px", background: bg, color: "#FFF", border: "none",
    borderRadius: 12, fontSize: 16, fontWeight: 700, fontFamily: "'Archivo', 'Noto Sans Kannada', system-ui",
    cursor: "pointer", letterSpacing: 0.2,
  });
  const label = { fontSize: 12, fontWeight: 700, color: C.mut, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 };

  /* ---------- screens ---------- */

  const Home = () => (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { v: stats.kg.toLocaleString("en-IN"), l: t.diverted },
          { v: "₹" + stats.inr.toLocaleString("en-IN"), l: t.income },
          { v: stats.active, l: t.active },
        ].map((s, i) => (
          <div key={i} style={{ ...card, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Saira Condensed', system-ui", fontWeight: 800, fontSize: 24, color: C.ink }}>{s.v}</div>
            <div style={{ fontSize: 10.5, color: C.mut, fontWeight: 600, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <button style={btn()} onClick={() => { setSample(null); setQty(200); setScreen("capture"); }}>
        📷 &nbsp;{t.gradeLot}
      </button>

      <div>
        <div style={label}>{t.myLots}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {lots.map((lot) => (
            <div key={lot.id} style={{ ...card, display: "flex", gap: 12, alignItems: "center" }}>
              <Produce crop={lot.crop} blem={lot.sample.blem} size={46} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: C.ink, fontSize: 14 }}>
                    {CROPS[lot.crop][lang]} · {lot.qty} kg
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 20,
                    background: lot.status === "open" ? "#FBEFDC" : "#E2F2E6",
                    color: lot.status === "open" ? C.amber : "#1C7C3C",
                  }}>{lot.status === "open" ? t.open : t.matched}</span>
                </div>
                <div style={{ fontSize: 12, color: C.mut, margin: "2px 0 6px" }}>
                  <b style={{ color: GRADE[lot.sample.grade].color }}>Grade {lot.sample.grade}</b> · {lot.sample[lang]}
                  {lot.buyer && <> · → {lot.buyer.name}</>}
                </div>
                {lot.status === "open"
                  ? <ShelfBar hoursLeft={hoursLeft(lot)} shelf={lot.sample.shelf} lang={lang} />
                  : <div style={{ fontSize: 12, fontWeight: 700, color: "#1C7C3C" }}>₹{(lot.settled || 0).toLocaleString("en-IN")} · {t.payVia.split("·")[0]}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const Capture = () => (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={label}>{t.selectCrop}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {Object.keys(CROPS).map((k) => (
            <button key={k} onClick={() => { setCrop(k); setSample(null); }} style={{
              ...card, padding: "10px 6px", cursor: "pointer", textAlign: "center",
              border: crop === k ? `2px solid ${C.green}` : `1px solid ${C.line}`,
              background: crop === k ? "#F3F8F3" : C.card,
            }}>
              <Produce crop={k} size={40} />
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginTop: 2 }}>{CROPS[k][lang]}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={label}>{t.capture}</div>
        <div style={{ fontSize: 12, color: C.mut, marginBottom: 8 }}>{t.captureHint}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {CROPS[crop].samples.map((s) => (
            <button key={s.id} onClick={() => setSample(s)} style={{
              ...card, cursor: "pointer", textAlign: "center", padding: 10,
              border: sample?.id === s.id ? `2px solid ${C.green}` : `1px solid ${C.line}`,
              background: sample?.id === s.id ? "#F3F8F3" : C.card,
            }}>
              <Produce crop={crop} blem={s.blem} size={52} />
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, marginTop: 4 }}>{s[lang]}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={label}>{t.qty}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {[-50, -10].map((d) => (
            <button key={d} onClick={() => setQty((q) => Math.max(10, q + d))} style={{ ...card, padding: "10px 14px", cursor: "pointer", fontWeight: 800, color: C.ink }}>{d}</button>
          ))}
          <div style={{ flex: 1, textAlign: "center", fontFamily: "'Saira Condensed', system-ui", fontWeight: 800, fontSize: 30, color: C.ink }}>{qty}<span style={{ fontSize: 15, color: C.mut }}> kg</span></div>
          {[10, 50].map((d) => (
            <button key={d} onClick={() => setQty((q) => q + d)} style={{ ...card, padding: "10px 14px", cursor: "pointer", fontWeight: 800, color: C.ink }}>+{d}</button>
          ))}
        </div>
      </div>

      <button disabled={!sample} onClick={() => setScreen("grading")} style={{ ...btn(sample ? C.green : "#B9B6A9"), cursor: sample ? "pointer" : "not-allowed" }}>
        {t.analyze}
      </button>
      <div style={{ fontSize: 11.5, color: C.mut, textAlign: "center" }}>⚡ {t.offline}</div>
    </div>
  );

  const Grading = () => (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, paddingTop: 40 }}>
      <div style={{ position: "relative", width: 140, height: 140, background: "#FFF", borderRadius: 16, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <Produce crop={crop} blem={sample.blem} size={100} />
        <div className="scanline" />
      </div>
      <div style={{ fontFamily: "'Saira Condensed', system-ui", fontWeight: 700, fontSize: 20, color: C.ink }}>{t.analyzing}</div>
      <div style={{ width: "100%", maxWidth: 260, display: "flex", flexDirection: "column", gap: 8 }}>
        {[t.s1, t.s2, t.s3, t.s4].map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: step > i ? C.ink : "#B9B6A9", fontWeight: 600, transition: "color .3s" }}>
            <span style={{ width: 18, height: 18, borderRadius: 9, background: step > i ? C.leaf : "#E4E1D5", color: "#FFF", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{step > i ? "✓" : ""}</span>
            {s}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: C.mut }}>TFLite · MobileNetV3 · on-device</div>
    </div>
  );

  const Result = () => {
    const g = GRADE[sample.grade];
    return (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ ...card, display: "flex", gap: 14, alignItems: "center", background: g.bgc, border: `1px solid ${g.color}33` }}>
          <GradeTag grade={sample.grade} lang={lang} />
          <div>
            <div style={{ fontFamily: "'Saira Condensed', system-ui", fontWeight: 800, fontSize: 22, color: C.ink }}>
              {CROPS[crop][lang]} · Grade {sample.grade}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: g.color }}>{g[lang === "en" ? "en" : "kn"]}</div>
            <div style={{ fontSize: 12.5, color: C.mut, marginTop: 2 }}>{sample[lang]} · {sample.conf}% {t.confidence}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={card}>
            <div style={label}>{t.estValue}</div>
            <div style={{ fontFamily: "'Saira Condensed', system-ui", fontWeight: 800, fontSize: 24, color: C.ink }}>₹{sample.price[0]}–{sample.price[1]}<span style={{ fontSize: 13, color: C.mut }}>{t.perKg}</span></div>
            <div style={{ fontSize: 12, color: C.mut }}>≈ ₹{Math.round(qty * (sample.price[0] + sample.price[1]) / 2).toLocaleString("en-IN")} · {qty} kg</div>
          </div>
          <div style={card}>
            <div style={label}>{t.shelf}</div>
            <div style={{ fontFamily: "'Saira Condensed', system-ui", fontWeight: 800, fontSize: 24, color: sample.shelf <= 18 ? C.red : C.ink }}>{sample.shelf}h</div>
            <ShelfBar hoursLeft={sample.shelf} shelf={sample.shelf} lang={lang} />
          </div>
        </div>

        <div style={card}>
          <div style={label}>{t.channels}</div>
          <div style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>{g[lang === "en" ? "useEn" : "useKn"]}</div>
        </div>

        <button style={btn()} onClick={postLot}>{t.post} →</button>
        <button style={{ ...btn("#FFF"), color: C.ink, border: `1px solid ${C.line}` }} onClick={() => setScreen("capture")}>{t.retake}</button>
      </div>
    );
  };

  const Matches = () => {
    const ms = matchesFor(activeLot);
    return (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ ...card, background: "#E2F2E6", border: "1px solid #1C7C3C33", fontSize: 13.5, fontWeight: 700, color: "#1C7C3C" }}>
          ✓ {t.lotPosted} — {CROPS[activeLot.crop][lang]} · Grade {activeLot.sample.grade} · {activeLot.qty} kg
        </div>
        <div>
          <div style={label}>{t.matches}</div>
          <div style={{ fontSize: 12, color: C.mut, marginBottom: 8 }}>{t.matchHint}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ms.map((b, i) => (
              <div key={b.id} style={{ ...card, border: i === 0 ? `2px solid ${C.green}` : `1px solid ${C.line}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: C.ink, fontSize: 15 }}>{b.name}</div>
                    <div style={{ fontSize: 12.5, color: C.mut }}>{b.type[lang]} · {b.place} · {b.dist} {t.km}</div>
                  </div>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontFamily: "'Saira Condensed', system-ui", fontWeight: 800, fontSize: 22, color: i === 0 ? C.green : C.ink }}>{b.score}%</div>
                    <div style={{ fontSize: 10, color: C.mut, fontWeight: 700 }}>{t.score}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 14, margin: "8px 0 10px", fontSize: 13 }}>
                  <span><b style={{ color: C.ink }}>₹{b.rate}{t.perKg}</b> <span style={{ color: C.mut }}>{t.offers}</span></span>
                  <span><b style={{ color: C.ink }}>{b.capacity.toLocaleString("en-IN")}</b> <span style={{ color: C.mut }}>{t.kgday} {t.canTake}</span></span>
                </div>
                <button style={{ ...btn(i === 0 ? C.green : "#FFF"), color: i === 0 ? "#FFF" : C.ink, border: i === 0 ? "none" : `1px solid ${C.line}`, padding: "10px 14px", fontSize: 14 }} onClick={() => confirmBuyer(b)}>
                  {t.select} · ₹{Math.round(activeLot.qty * b.rate).toLocaleString("en-IN")}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const Confirmed = () => (
    <div style={{ padding: 16, paddingTop: 36, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
      <div style={{ width: 74, height: 74, borderRadius: 40, background: "#1C7C3C", color: "#FFF", fontSize: 38, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 18px rgba(28,124,60,.35)" }}>✓</div>
      <div style={{ fontFamily: "'Saira Condensed', system-ui", fontWeight: 800, fontSize: 26, color: C.ink }}>{t.confirmed}</div>
      <div style={{ ...card, width: "100%", textAlign: "left" }}>
        <div style={{ fontWeight: 800, color: C.ink }}>{chosenBuyer.name}</div>
        <div style={{ fontSize: 13, color: C.mut, marginBottom: 8 }}>{chosenBuyer.place} · {chosenBuyer.dist} {t.km}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "6px 0", borderTop: `1px solid ${C.line}` }}>
          <span style={{ color: C.mut }}>{CROPS[activeLot.crop][lang]} · Grade {activeLot.sample.grade}</span>
          <b style={{ color: C.ink }}>{activeLot.qty} kg</b>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "6px 0", borderTop: `1px solid ${C.line}` }}>
          <span style={{ color: C.mut }}>{t.at}</span>
          <b style={{ color: C.ink }}>₹{chosenBuyer.rate}{t.perKg} → ₹{Math.round(activeLot.qty * chosenBuyer.rate).toLocaleString("en-IN")}</b>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "6px 0", borderTop: `1px solid ${C.line}` }}>
          <span style={{ color: C.mut }}>{t.pickup}</span>
          <b style={{ color: C.ink }}>{lang === "en" ? "Today, 4–6 pm" : "ಇಂದು, ಸಂಜೆ 4–6"}</b>
        </div>
      </div>
      <div style={{ fontSize: 12, color: C.mut }}>💬 {t.smsSent}<br />💸 {t.payVia}<br />{t.commission}</div>
      <button style={btn()} onClick={() => setScreen("home")}>{t.backHome}</button>
    </div>
  );

  const BuyerFeed = () => {
    const open = lots.filter((l) => l.status === "open").sort((a, b) => hoursLeft(a) - hoursLeft(b));
    return (
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={label}>{t.feed}</div>
          <div style={{ fontSize: 12, color: C.mut }}>{t.feedHint}</div>
        </div>
        {open.length === 0 && <div style={{ ...card, textAlign: "center", color: C.mut, fontSize: 14 }}>{t.none}</div>}
        {open.map((lot) => (
          <div key={lot.id} style={card}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Produce crop={lot.crop} blem={lot.sample.blem} size={48} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: C.ink, fontSize: 15 }}>
                  {CROPS[lot.crop][lang]} · {lot.qty} kg · <span style={{ color: GRADE[lot.sample.grade].color }}>Grade {lot.sample.grade}</span>
                </div>
                <div style={{ fontSize: 12.5, color: C.mut, marginBottom: 6 }}>{lot.sample[lang]} · Kolar APMC · ₹{lot.sample.price[0]}–{lot.sample.price[1]}{t.perKg}</div>
                <ShelfBar hoursLeft={hoursLeft(lot)} shelf={lot.sample.shelf} lang={lang} />
              </div>
            </div>
            <button style={{ ...btn(), marginTop: 10, padding: "10px 14px", fontSize: 14 }} onClick={() => acceptAsBuyer(lot)}>{t.accept}</button>
          </div>
        ))}
      </div>
    );
  };

  const back = () => setScreen(screen === "matches" ? "result" : screen === "result" ? "capture" : "home");
  const showBack = role === "seller" && ["capture", "result", "matches"].includes(screen);

  return (
    <div style={{ minHeight: "100vh", background: "#DCDAD1", display: "flex", justifyContent: "center", padding: "18px 8px", fontFamily: "'Archivo','Noto Sans Kannada',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@600;700;800&family=Archivo:wght@400;500;600;700;800&family=Noto+Sans+Kannada:wght@400;600;700&display=swap');
        .scanline{position:absolute;left:0;right:0;height:3px;background:${C.leaf};box-shadow:0 0 14px ${C.leaf};animation:scan 1.3s ease-in-out infinite;}
        @keyframes scan{0%{top:8%}50%{top:88%}100%{top:8%}}
        @media (prefers-reduced-motion: reduce){.scanline{animation:none;top:50%}}
        button:focus-visible{outline:3px solid ${C.amber};outline-offset:2px;}
      `}</style>

      <div style={{ width: "100%", maxWidth: 400, background: C.bg, borderRadius: 26, overflow: "hidden", boxShadow: "0 18px 50px rgba(18,40,26,0.25)", display: "flex", flexDirection: "column", border: "1px solid #C8C5B8" }}>
        {/* header */}
        <div style={{ background: C.greenDark, color: "#FFF", padding: "14px 16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {showBack && (
                <button onClick={back} aria-label="Back" style={{ background: "rgba(255,255,255,.14)", border: "none", color: "#FFF", width: 30, height: 30, borderRadius: 8, cursor: "pointer", fontSize: 16 }}>←</button>
              )}
              <div>
                <div style={{ fontFamily: "'Saira Condensed', system-ui", fontWeight: 800, fontSize: 22, letterSpacing: 0.5, lineHeight: 1 }}>
                  Agri<span style={{ color: C.tag }}>Loop</span>
                </div>
                <div style={{ fontSize: 9.5, letterSpacing: 2.5, fontWeight: 700, opacity: 0.85 }}>{t.tagline}</div>
              </div>
            </div>
            <button onClick={() => setLang(lang === "en" ? "kn" : "en")} style={{ background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.3)", color: "#FFF", padding: "5px 12px", borderRadius: 20, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
              {lang === "en" ? "ಕನ್ನಡ" : "English"}
            </button>
          </div>
          {/* role tabs */}
          <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
            {["seller", "buyer"].map((r) => (
              <button key={r} onClick={() => { setRole(r); setScreen(r === "seller" ? "home" : "feed"); }} style={{
                flex: 1, padding: "9px 0", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 13.5,
                borderRadius: "10px 10px 0 0", fontFamily: "inherit",
                background: role === r ? C.bg : "rgba(255,255,255,.08)",
                color: role === r ? C.ink : "rgba(255,255,255,.75)",
              }}>{r === "seller" ? "🧺 " + t.seller : "🏭 " + t.buyer}</button>
            ))}
          </div>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {role === "buyer" ? <BuyerFeed /> : (
            screen === "home" ? <Home /> :
            screen === "capture" ? <Capture /> :
            screen === "grading" ? <Grading /> :
            screen === "result" ? <Result /> :
            screen === "matches" ? <Matches /> :
            <Confirmed />
          )}
        </div>

        <div style={{ padding: "8px 16px", borderTop: `1px solid ${C.line}`, fontSize: 10.5, color: C.mut, textAlign: "center", background: "#EAE8E0" }}>
          {t.pilot}
        </div>
      </div>
    </div>
  );
}

# AgriLoop — Grade & Route

**Price discovery for produce that currently has no market.**

AgriLoop is a mobile-first platform that grades rejected horticultural produce in seconds using on-device computer vision, then routes it to the nearest paying buyer — dehydration units, pulp processors, cattle feed makers, and biogas operators — before it rots.

Built for the circular economy challenge on horticultural waste valorisation in Karnataka, with a pilot design targeting **Kolar district** (tomato and mango clusters).

> 🔗 **Live prototype:** interactive React simulation of the full seller and buyer flow (see [Running the prototype](#running-the-prototype))

---

## The problem

Even in well-functioning supply chains, a significant share of Karnataka's horticulture output fails primary market standards — off-grade, over-ripe, blemished, or surplus produce. This material is not worthless: a size-rejected mango is puree feedstock worth ₹8–12/kg, sprouted onions are viable feed, and spoiled produce is biogas feedstock. Yet most of it earns **₹0** and is dumped.

The bottleneck is not processing technology. Dehydrators, pulpers, and biodigesters already exist and often sit under-utilised. The bottleneck is **coordination**:

- A blemished tomato loses roughly half its residual value every 24 hours.
- Surplus appears unpredictably, scattered across thousands of farms and packhouses.
- Nobody knows, on the day it appears, *where* the surplus is, *what grade* it is, *which* nearby unit has capacity, and *what price* makes the trip worthwhile.

AgriLoop solves the matching problem.

## The solution (MVP scope)

The MVP does exactly three things:

1. **Grade** — A packhouse worker or FPO aggregator photographs a rejected lot. An on-device CV model classifies it into secondary-use grades in seconds:

   | Grade | Meaning | Example channels | Indicative value |
   |-------|---------|------------------|------------------|
   | **B** | Process-ready | Puree, flakes, powder, pickle | ₹3.5–12 /kg |
   | **C** | Feed / extraction | Cattle feed, peel extraction | ₹1.8–5 /kg |
   | **D** | Compost / biogas | Biogas feedstock, compost | ₹0.7–1.8 /kg |

2. **Post** — The lot is published with crop, grade, quantity, GPS location, and a time-to-decay countdown derived from crop- and condition-specific shelf-life curves.

3. **Route** — Registered feedstock buyers within range are notified and ranked by a transparent scoring function. The seller picks a buyer; pickup is scheduled; payment settles directly via UPI and is recorded on-platform (6% platform fee on settlement).

Grading domain logic encodes real agronomic nuance — e.g. an **over-ripe mango grades B** (ideal for pulp), while an **over-ripe tomato grades C**.

### Buyer matching

Rule-based routing with a clear upgrade path to learned optimisation:

```
score = 0.40 × (offer_price / max_price)
      + 0.35 × (1 − min(distance, 30 km) / 30 km)
      + 0.25 × min(daily_capacity / 1500 kg, 1)
```

Transparent, debuggable, and explainable to farmers and evaluators alike.

## Prototype features

This repository contains an interactive single-file React prototype simulating the full product flow:

- 📷 **Capture flow** — crop selection (tomato / onion / mango), sample photos standing in for the camera, quantity stepper
- 🤖 **Simulated on-device CV pipeline** — colour histogram → surface defect map → ripeness estimate → grade assignment, with confidence scores
- 🏷️ **Grade result screen** — stencil-style grade tag, estimated farm-gate value, recommended channels, route-within countdown
- 📡 **Ranked buyer matches** — live scoring over a seeded Kolar buyer network (dehydration, pulp, feed, biogas, compost)
- ✅ **Match confirmation** — pickup window, UPI settlement note, SMS confirmation stub
- 🏭 **Buyer-side feed** — open lots sorted by urgency with draining shelf-life bars and one-tap accept
- 🌐 **Bilingual UI** — full English / ಕನ್ನಡ toggle
- 📊 **Live dashboard** — kg diverted, income created, active lots, updating as matches happen

## Running the prototype

The prototype is a single self-contained React component (`agriloop-prototype.jsx`) with no external state or backend.

```bash
# with Vite
npm create vite@latest agriloop-demo -- --template react
cd agriloop-demo
# copy agriloop-prototype.jsx into src/ and render it from App.jsx:
#   import AgriLoopPrototype from "./agriloop-prototype";
#   export default function App() { return <AgriLoopPrototype />; }
npm install
npm run dev
```

No environment variables, no database — all demo data (buyers, crops, grade tables, shelf-life curves) lives in constants at the top of the file for easy editing.

## Production architecture (roadmap)

| Layer | MVP prototype | Production target |
|-------|---------------|-------------------|
| Mobile app | React simulation | **Flutter** (Android-first, Kannada/English) |
| Grading model | Simulated pipeline | **MobileNetV3 / EfficientNet-Lite → TFLite**, on-device, offline-first |
| Backend | In-memory constants | **Supabase** (Postgres, Auth, Realtime, Storage) |
| Matching | Rule-based scoring | Rule-based → learned routing over decay curves |
| Payments | Off-platform UPI, recorded | UPI deep links, platform-recorded settlement |
| Sync | — | Offline grading with background sync for low-connectivity areas |

### Training data plan

No public dataset covers off-grade Indian produce under packhouse lighting. The plan: start with **two crops** (tomato, onion), collect 2,000–3,000 labelled images per crop at APMC yards and packhouses with buyers' own graders labelling alongside, and augment aggressively. Two crops graded well beats seven graded badly — and labelling trips double as customer discovery.

## Pilot design (Kolar, 12 weeks)

- **Onboarding:** 3 packhouses + 2 FPOs (sellers), 10 registered feedstock buyers
- **Cold-start mitigation:** buyers onboarded *first*; human-confirmed matches for month one
- **Targets:**
  - 50 tonnes diverted from disposal
  - ₹3–8/kg average farmer realisation on produce that previously earned ₹0
  - Match-to-pickup time under 24 hours
  - Grading accuracy ≥ 85% against human graders

## Phased roadmap

- **Phase 1 (this MVP):** grading + routing app, one district, two crops
- **Phase 2:** solar-hybrid micro-processing pods (≈500 kg/day) run by FPOs/SHGs as anchor demand, with IoT telemetry (temperature, humidity, throughput) feeding capacity planning
- **Phase 3:** expansion across the seven focus crops (onion, mango, banana, tomato, grapes, pomegranate, pineapple); analytics licensing for horticulture departments and insurers

## Tech stack

`React` · `Flutter (planned)` · `Supabase (planned)` · `TensorFlow Lite (planned)` · `MobileNetV3` · `UPI`

## Project structure

```
.
├── agriloop-prototype.jsx   # complete interactive prototype (UI, data, logic)
└── README.md
```

## Author

**Jeevan C** — MCA, R V College of Engineering, Bengaluru
GitHub: [@JeevanC37](https://github.com/JeevanC37)

## License

MIT — see [LICENSE](LICENSE) for details.

---

*Every kilo routed is income created, not cost avoided.*

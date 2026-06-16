# LifeTracker

A weekly planner that turns into a daily checklist — built to keep one messy student life (study, content creation, streaming, portfolio projects, gym, gaming) and nutrition in one place.

> Self-initiated personal project. Responsive web app (works on phone & laptop) and installable as a PWA ("Add to Home Screen") for a native-app feel.

## The problem

I juggle a lot at once: data-science coursework, building portfolio projects, starting a Valorant stream on TikTok, gym 3×/week, and tracking my food on a cut. Generic to-do apps don't model a *recurring weekly routine* that becomes a *daily checklist*, and they don't tie habits + nutrition together. So I built the tool I actually needed.

## What it does

- **Weekly planner → daily checklist.** Set a recurring routine once per weekday; it auto-appears as a checkable list each day. Tick done / not done.
- **One-off tasks.** Add ad-hoc tasks for a single day without touching the routine.
- **Nutrition tracking.** Log meals with calories + protein against editable daily targets, shown as progress rings.
- **Weekly insight.** Completion rate, productive days, gym-goal progress, tasks-per-day chart, and a per-category breakdown.
- **Offline-first.** All data persists locally on-device (localStorage). No account, no server, nothing leaves the device.

## Categories tracked
Belajar (study) · Project · Ngonten (content) · Live (streaming) · Valorant · Gym.

## Tech stack

- **React 18** + **Vite** — fast SPA build tooling.
- **Recharts** — weekly data visualization.
- **lucide-react** — icon set.
- **vite-plugin-pwa** (Workbox) — installable PWA with offline service worker.
- **localStorage** — client-side persistence, wrapped in a small async layer (`src/storage.js`) so it can be swapped for a real backend later without touching UI code.
- No backend; deployed as static files.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

Build for production:

```bash
npm run build    # output in dist/
npm run preview  # preview the production build
```

## Deploy (Vercel)

1. Push this repo to GitHub.
2. On Vercel: **New Project → import the repo**.
3. Framework preset: **Vite** (auto-detected). Build command `npm run build`, output dir `dist`.
4. Deploy. You get a live HTTPS URL — open it on your phone and **Add to Home Screen**.

Works the same on Netlify or GitHub Pages (static hosting).

## Design notes

- Mobile-first layout capped at 480px, with safe-area insets for iOS notch/home-bar.
- Dark, minimal aesthetic; numeric/data values set in a monospace face for a "dashboard" feel.
- The storage layer is intentionally abstracted (`storage.js`) — the same `get/set` shape maps cleanly onto a future REST API.

## Roadmap (future work)

This MVP is deliberately scoped to ship fast and work offline. Planned next steps, already designed:

- Google account login (OAuth 2.0).
- Two-way **Google Calendar** sync (push notifications + incremental sync).
- Real-time multi-device sync via a FastAPI + PostgreSQL backend.
- Cloud deployment with CI/CD.

## What this project demonstrates

Identifying a real personal problem, scoping an MVP under a deadline, and shipping a polished, installable, offline-capable product end-to-end — with an architecture that leaves a clear path to a full-stack version.

---

Built by Ryan Christopher Setiawan.

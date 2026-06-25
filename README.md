# Ops Console — Daily Reporting & Productivity

A standalone, dependency-free tool for **Core Ops / Cash Ops / Network Ops Team Leaders**
to submit end-of-shift reports, and for management to **track submissions and measure
productivity** across days, weeks and months.

Built as plain HTML/CSS/JS — no build step. Open the files directly or host them anywhere
(GitHub Pages, Netlify, any static host).

## Pages

| File | Who | What |
|------|-----|------|
| `index.html` | Everyone | Landing — choose Submit or Dashboard |
| `submit.html` | Team Leaders | Pick name → **paste report → auto-parse → review/edit → submit** |
| `dashboard.html` | Management | Submission tracker, productivity leaderboard, person history |

## How it works

1. A Team Leader pastes their WhatsApp-style report. The engine (`ops-data.js`) **auto-extracts**:
   - **Metrics** (numbers) grouped into outcome categories — Diamond League, Clear & Sweep,
     Technical Support, Billing, Collections, QA.
   - **Activities** (the prose lines), each **auto-tagged** to a theme (Meetings, QA, Approvals,
     Technical/Field, Customer, Follow-ups, Reporting).
   - Date, shift, time of arrival, role.
2. They **review and correct** the captured data (parsing is best-effort, never silent), then submit.
3. The dashboard reads everything and gives you:
   - **Submission Tracker** — for any date, who submitted vs **who's missing**, late-arrival flags,
     and a 14-day consistency grid per person.
   - **Productivity** — KPIs + a sortable leaderboard (output, tickets, calls, payments, on-time %),
     outcomes-by-category bars, and an activity mix, filtered by **week / month / 30 days / custom**.
   - **Person History** — pick anyone, see their trend for any metric, **monthly summaries**, and
     every past report expandable in full.

## Managing the team (roster)

Edit the `ROSTER` array at the top of [`ops-data.js`](ops-data.js):

```js
var ROSTER = [
  { name: 'Tafadzwa', role: 'core-ops'    },
  { name: 'Abigail',  role: 'cash-ops'    },
  { name: 'Abitania', role: 'network-ops' },
  // add / remove leaders here
];
```

The roster drives the name picker **and** "who hasn't submitted". Adding/removing metrics is
done in the `CATEGORIES` array just below it.

## Storage — demo now, shared later

The app runs in **two modes automatically**:

- **Local demo (default):** data lives in the browser's `localStorage`, pre-seeded with the
  sample reports so the dashboard isn't empty. Single device. Great for trying it out.
- **Shared (Supabase):** all leaders submit to one database; management sees everything centrally.

### Turn on shared mode
1. In Supabase → SQL Editor, run [`schema.sql`](schema.sql) (creates the `ops_reports` table).
2. Confirm the project URL/key in [`ops-config.js`](ops-config.js) point at your Supabase project.
3. Reload. The header badge flips from **“local demo mode”** to **“shared (Supabase)”**.

Offline submissions fall back to local storage and merge in when the database is reachable.

## Security note (POC)

Identity is "pick your name" (zero friction) and the Supabase policies allow the anonymous key
to read/write `ops_reports` only. That's fine for an internal trusted team. To harden:
move to Supabase Auth (one login per leader) and scope the RLS policies to `auth.uid()`.
Outline is in the comments of `schema.sql`.

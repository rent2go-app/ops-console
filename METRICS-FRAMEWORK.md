# Ops Leader Metric Framework

A framework to measure **(1) each leader's productivity** and **(2) the team's overall output** —
built from the actual work in the Core Ops, Cash Ops and Network Ops reports.

---

## 1. Principles

1. **Measure outcomes, not effort.** Count what was *delivered* (tickets resolved, money collected,
   faults closed) — not how many lines someone typed.
2. **Role-fair.** A Cash Ops leader collects money; a Network Ops leader closes faults. We never
   compare their raw numbers. Each role is scored **against its own targets**, so everyone is
   measured as *"% of a good day's work achieved"* — comparable without being a raw-volume race.
3. **Target-based, not a ranking.** Each leader is measured against a standard, not against each
   other. (You asked for no leaderboard — this keeps it.)
4. **Balanced.** Volume alone rewards busywork. We balance four pillars: Throughput, Quality,
   Timeliness, Value.
5. **Daily → weekly → monthly.** Scored every day; rolls up to trends.

---

## 2. The four pillars

| Pillar | Weight | What it answers | Built from |
|---|---|---|---|
| **① Throughput** | 40% | Did they deliver a full day's volume? | tickets resolved/closed/updated, calls, payments, walk-ins, faults, recons |
| **② Quality & Effectiveness** | 25% | Was the work good, not just plentiful? | QA done, **resolution rate** = resolved ÷ (resolved+escalated), credit-note reviews |
| **③ Timeliness & Discipline** | 20% | Reliable and on time? | **report in by 9 PM**, submission consistency (% of days reported), arrival punctuality |
| **④ Value / Revenue** | 15% | Did they move money & retention? | amount collected $, paid clients, collections (Chidzoka), disconnections actioned, aged receivables |

**Leader Productivity Score (0–100)** = 0.40·Throughput + 0.25·Quality + 0.20·Timeliness + 0.15·Value
(each pillar is itself a 0–100 sub-score; metrics are capped at 100% of target so no one games one number).

---

## 3. Role scorecards (with starter daily targets)

Targets below are **starting points drawn from the sample reports** — calibrate them with your team.
Each metric's sub-score = `min(100, actual ÷ target × 100)`. A pillar = average of its metrics.

### 🛠️ Core Ops Leader
| Pillar | Metric | Starter daily target |
|---|---|---|
| Throughput | Tickets resolved | 5 |
| Throughput | Tickets closed + updated | 12 |
| Throughput | Calls handled (in+out+DL) | 12 |
| Throughput | Payments captured | 3 |
| Quality | QA evaluations + credit notes | 5 |
| Quality | Resolution rate (resolved ÷ resolved+escalated) | ≥ 60% |
| Timeliness | Report in by 9 PM | yes/no |
| Timeliness | Reported every working day | 100% |
| Value | Amount collected | $300 |
| Value | Paid clients | 1 |

### 💳 Cash Ops Leader
| Pillar | Metric | Starter daily target |
|---|---|---|
| Throughput | Walk-in customers attended | 6 |
| Throughput | Payments captured + confirmed | 6 |
| Throughput | Bank approvals | 5 |
| Throughput | Calls + WhatsApps handled | 10 |
| Quality | Churn / account reconciliations | 15 |
| Quality | Internal customers served | 3 |
| Timeliness | Report in by 9 PM | yes/no |
| Timeliness | Reported every working day | 100% |
| Value | Cash disbursed | 4 |
| Value | Amount collected / paid clients | $250 / 1 |

### 📡 Network Ops Leader  *(needs countable metrics — see §5)*
| Pillar | Metric | Starter daily target |
|---|---|---|
| Throughput | Faults attended / closed | 4 |
| Throughput | Tasks followed-up & cleared | 8 |
| Throughput | Installations / works validated | 4 |
| Quality | QA checks performed on team work | 5 |
| Quality | Timesheets validated | 2 |
| Timeliness | Report in by 9 PM | yes/no |
| Timeliness | Reported every working day | 100% |
| Value | Fleet requests allocated | (tracked, not targeted) |
| Value | Projects progressed (BTS/solar etc.) | 1 |

---

## 4. Team Output measurement

Two complementary numbers — one for **volume**, one for **health**.

### A. Team Output (absolute throughput)
The raw work the whole function delivered, summed per day / week / month:
**Tickets resolved · Tickets closed · Payments captured · $ Collected · Calls handled · Walk-ins · QA checks · Faults closed.**
→ Shows scale and trend ("we resolved 240 tickets and collected $6,400 this week").

### B. Team Health Score (0–100) — *is the function healthy, not just busy?*
| Component | Weight | Formula |
|---|---|---|
| **Submission rate** | 25% | reports received ÷ (leaders × working days) |
| **On-time rate** | 20% | reports in by 9 PM ÷ reports received |
| **Resolution effectiveness** | 30% | tickets resolved ÷ (resolved + escalated) |
| **Value delivery** | 25% | $ collected + payments vs team target |

A team can be *busy* (high absolute output) but *unhealthy* (late reports, low resolution rate, lots
of escalations). Tracking both stops "busy but not effective" from hiding.

---

## 5. What this needs in the tool

1. **Add Network Ops metrics** (faults attended/closed, QA checks, installs validated, timesheets
   validated, tasks cleared, fleet allocated) so that role is measured on numbers, not prose.
2. **A targets config** (one editable block per role) driving the sub-scores.
3. **Dashboard additions:**
   - Each leader's **Productivity Score** (0–100) with the 4 pillar breakdown, daily + period.
   - **Team Health Score** + the absolute Team Output totals and trend.
   - Keep it transparent: tap a score to see exactly which targets were hit/missed.

---

## 6. Tuning knobs (your calls)

- **Pillar weights** — the 40/25/20/15 split. Push *Value* up if revenue is the priority; push
  *Timeliness* up if discipline is the current battle.
- **Targets** — the numbers in §3. Set them to "a solid day," not "a record day."
- **Resolution-rate floor** — 60% is a starting line.

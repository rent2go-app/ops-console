/* ============================================================================
   AfriversalAI — Core Ops Reporting · Data Engine
   ----------------------------------------------------------------------------
   One file that powers ops-report.html (submission) and ops-dashboard.html.

   Responsibilities:
     1. ROSTER          — the team leaders who submit reports (editable below).
     2. METRIC SCHEMA   — every measurable number, grouped by outcome category.
     3. PARSER          — turn a pasted WhatsApp-style report into structured data.
     4. CATEGORISER     — tag free-text activity lines into outcome themes.
     5. BACKEND         — Supabase when available, localStorage demo otherwise.
     6. SEED            — the sample reports, so the dashboard has data on day one.

   Requires (when using Supabase): supabase-config.js loaded first.
   Safe to load standalone — it falls back to localStorage automatically.
   ============================================================================ */
(function (global) {
  'use strict';

  /* ---- 1. ROSTER -----------------------------------------------------------
     The people who submit. `role` selects which metric sections are relevant
     and drives "who hasn't submitted today". Edit this list to manage the team.
     Roles: 'core-ops' | 'cash-ops' | 'network-ops'                            */
  var ROSTER = [
    // Sorted alphabetically by first name. `name` is the stable matching key
    // used in reports + the database; `fullName` is for display.
    { name: 'Abigail',     fullName: 'Abigail Ncube',        role: 'cash-ops'    },
    { name: 'Abitania',    fullName: 'Abitania Gwara',       role: 'network-ops' },
    { name: 'Almah',       fullName: 'Almah Furayi',         role: 'network-ops' },
    { name: 'Chirwa',      fullName: 'Amos Chirwa',          role: 'governance'  },
    { name: 'Lungile',     fullName: 'Lungile Khanye',       role: 'core-ops'    },
    { name: 'Omniscience', fullName: 'Omniscience Musungah', role: 'core-ops'    },
    { name: 'Rorisang',    fullName: 'Rorisang Mvundla',     role: 'core-ops'    },
    { name: 'Tafadzwa',    fullName: 'Tafadzwa Maribha',     role: 'core-ops'    },
    { name: 'Vanessa',     fullName: 'Vanessa Sakhala',      role: 'governance'  }
  ];

  var ROLES = {
    'core-ops':    { label: 'Core Ops Leader',         icon: '🛠️' },
    'cash-ops':    { label: 'Cash Ops Leader',         icon: '💳' },
    'network-ops': { label: 'Network Ops Leader',      icon: '📡' },
    'governance':  { label: 'Governance & Compliance', icon: '🛡️' }
  };

  // name (matching key) -> full display name
  function fullNameOf(name) {
    var p = ROSTER.filter(function (r) { return r.name === name; })[0];
    return p ? p.fullName : name;
  }

  /* ---- 2. METRIC SCHEMA ----------------------------------------------------
     Categories map to OUTCOMES (what the business cares about). Each metric has
     a stable `key`, a display `label`, parsing `aliases`, and a `section` tag so
     the parser can disambiguate (e.g. "Emails Sent" appears under both Diamond
     League and Clear & Sweep). `roles` limits which roles see the section.       */
  var CATEGORIES = [
    {
      key: 'diamond', label: 'Diamond League', icon: '💎',
      outcome: 'Revenue & Sales',
      headers: ['diamond league', 'diamond'],
      roles: ['core-ops', 'cash-ops', 'governance'],
      metrics: [
        { key: 'paid_clients', label: 'Paid Clients',  aliases: ['paid clients'] },
        { key: 'dl_amount',    label: 'Diamond League Collected ($)', money: true, aliases: ['diamond league collected', 'diamond league collections', 'diamond collected', 'diamond collections', 'dl collected', 'amount collected', 'value collected'] },
        { key: 'dl_emails',    label: 'Emails Sent',   aliases: ['emails sent', 'emails'] },
        { key: 'dl_calls',     label: 'Calls / Contacts Made', aliases: ['calls made', 'contacts made', 'calls'] }
      ]
    },
    {
      key: 'sweep', label: 'Omnichannel', icon: '💬',
      outcome: 'Customer Contact',
      headers: ['omnichannel', 'clear & sweep', 'clear and sweep', 'clear &amp; sweep'],
      roles: ['core-ops', 'cash-ops', 'governance'],
      metrics: [
        { key: 'cs_emails',       label: 'Emails Sent',      aliases: ['emails sent', 'emails'] },
        { key: 'cs_whatsapps',    label: 'WhatsApps Addressed', aliases: ['whatsapps addressed', 'whatsapps sent', 'whatsapps answered', 'whatsapp sent', 'whatsapps', 'whatsapp'] },
        { key: 'tickets_updated', label: 'Tickets Updated',  aliases: ['tickets updated', 'tickets'] },
        { key: 'inbound_calls',   label: 'Inbound Calls',    aliases: ['inbound calls', 'incoming calls'] },
        { key: 'outbound_calls',  label: 'Outbound Calls',   aliases: ['outbound calls'] },
        { key: 'tickets_closed',  label: 'Tickets Closed',   aliases: ['tickets closed'] },
        { key: 'tickets_created', label: 'Tickets Created',  aliases: ['tickets created'] }
      ]
    },
    {
      key: 'tech', label: 'Technical Support & Escalations', icon: '🎫',
      outcome: 'Technical Resolution',
      headers: ['technical support & escalations', 'technical support and escalations', 'technical support'],
      roles: ['core-ops', 'cash-ops', 'governance'],
      metrics: [
        { key: 'second_line',       label: '2nd-Line Tickets Worked', aliases: ['2nd line tickets worked on', 'tickets worked on 2nd line', '2nd line tickets', 'tickets worked on 2nd line', '2nd line'] },
        { key: 'tickets_resolved',  label: 'Tickets Resolved',  aliases: ['tickets resolved'] },
        { key: 'tasks_created',     label: 'Tasks Created',     aliases: ['tasks created'] },
        { key: 'tasks_closed',      label: 'Tasks Closed',      aliases: ['tasks closed'] },
        { key: 'tickets_escalated', label: 'Tickets Escalated', aliases: ['tickets escalated'] },
        { key: 'recons',            label: 'Recons',            aliases: ['recons'] }
      ]
    },
    {
      key: 'billing', label: 'Billing Operations', icon: '💳',
      outcome: 'Billing & Cash',
      headers: ['billing operations', 'billing'],
      roles: ['core-ops', 'cash-ops', 'governance'],
      metrics: [
        // The single "money collected throughout the day" figure for general
        // customers & sales — replaces the redundant Payments Captured / Proofs
        // of Payment counts. Distinct from Diamond League collections.
        { key: 'gp_amount',          label: 'Gen Pop & Sales Collected ($)', money: true, aliases: ['gen pop & sales collected', 'gen pop and sales', 'gen pop collected', 'gen pop collections', 'genpop collected', 'money collected', 'collected today', 'total collected', 'payments captured', 'payments confirmed', 'proofs of payment', 'general collections', 'sales collected', 'gen pop'] },
        { key: 'account_recons',     label: 'Account Reconciliations', aliases: ['account reconciliations', 'accountreconciliations', 'june account reconciliations', 'churn recons', 'reconciliations'] },
        { key: 'bank_approvals',     label: 'Bank Approvals',     aliases: ['bank approvals'] },
        { key: 'cash_disbursed',     label: 'Cash Payments Disbursed', aliases: ['cash payments disbursed', 'cash payments', 'cash disbursed'] },
        { key: 'walkins',            label: 'Walk-in Customers',  aliases: ['walkin customers attended', 'walk-in customers', 'walkin customers', 'walkins', 'walk-in'] },
        { key: 'internal_customers', label: 'Internal Customers', aliases: ['internal customers attended to', 'internal customers'] }
      ]
    },
    {
      key: 'collections', label: 'Collections & Receivables', icon: '📉',
      outcome: 'Collections',
      headers: ['collections', 'collections & receivables'],
      roles: ['core-ops', 'cash-ops', 'governance'],
      metrics: [
        { key: 'chidzoka',         label: 'Chidzoka Collections', aliases: ['chidzoka collections', 'chidzoka'] },
        { key: 'aged_receivables', label: 'Aged Receivables',     aliases: ['aged receivables'] },
        { key: 'disconnections',   label: 'Disconnections',       aliases: ['disconnections'] }
      ]
    },
    {
      key: 'qa', label: 'Quality Assurance', icon: '✅',
      outcome: 'Quality & Compliance',
      headers: ['quality assurance', 'qa'],
      roles: ['core-ops', 'cash-ops', 'network-ops', 'governance'],
      metrics: [
        { key: 'qa_evaluations', label: 'QA Evaluations', aliases: ['quality assurance evaluations', 'qa evaluations'] },
        { key: 'credit_notes',   label: 'Credit Notes Reviewed', aliases: ['credit notes'] },
        { key: 'follow_ups',     label: 'Follow-ups',     aliases: ['follow-ups to clear', 'follow ups', 'follow-ups'] }
      ]
    },
    {
      key: 'network', label: 'Network Operations', icon: '📡',
      outcome: 'Network & Field',
      headers: ['network operations', 'network ops', 'field operations'],
      roles: ['network-ops'],
      metrics: [
        { key: 'faults_attended',     label: 'Faults Attended / Closed',  aliases: ['faults attended', 'faults closed', 'area faults', 'active faults', 'faults resolved'] },
        { key: 'qa_checks',           label: 'QA Checks Performed',       aliases: ['qa checks', 'quality assurance checks'] },
        { key: 'installs_validated',  label: 'Installations Validated',   aliases: ['installations validated', 'installs validated', 'installations completed'] },
        { key: 'timesheets_validated',label: 'Timesheets Validated',      aliases: ['timesheets validated', 'validated timesheets', 'overtime timesheets'] },
        { key: 'tasks_cleared',       label: 'Tasks Followed-up / Cleared', aliases: ['tasks cleared', 'tasks followed up', 'scheduled tasks'] },
        { key: 'fleet_allocated',     label: 'Fleet Requests Allocated',  aliases: ['fleet requests allocated', 'fleet allocated', 'fleet requests'] },
        { key: 'projects_progressed', label: 'Projects Progressed',       aliases: ['projects progressed', 'project updates'] }
      ]
    },
    {
      // The daily Service Delivery & Maintenance field plan (the "command board"):
      // jobs and tasks by network discipline. Open to Network Ops AND Core Ops
      // leaders so field outcomes can be reported by whoever runs the plan.
      key: 'field', label: 'Network Field Plan', icon: '🗼',
      outcome: 'Field Delivery & Maintenance',
      headers: ['network field plan', 'field plan', 'service delivery', 'command board', 'service delivery & maintenance', "today's tasks"],
      roles: ['network-ops', 'core-ops'],
      metrics: [
        { key: 'field_jobs_scheduled', label: 'Jobs Scheduled / Open', aliases: ['jobs scheduled today', 'jobs scheduled', 'total jobs', 'scheduled open', 'jobs open'] },
        { key: 'field_jobs_completed', label: 'Jobs Completed',        aliases: ['jobs completed', 'completed jobs', 'jobs closed', 'jobs delivered'] },
        { key: 'fibre_tasks',          label: 'Fibre / Fibre-related', aliases: ['fibre related', 'fibre-related', 'fibre tasks', 'fibre activities', 'fibre optic', 'fibre'] },
        { key: 'radio_tasks',          label: 'Wimax / LTE / VSat / Radio', aliases: ['wimax / lte / vsat / radio', 'wimax lte vsat radio', 'radio tasks', 'wimax', 'vsat', 'lte', 'radio'] },
        { key: 'lan_tasks',            label: 'LAN / VoIP',            aliases: ['lan / voip', 'lan voip', 'lan tasks', 'lan', 'voip'] },
        { key: 'power_tasks',          label: 'Power, Automation & IoT', aliases: ['power, automation & iot', 'power automation iot', 'power tasks', 'power & automation', 'power and automation', 'automation iot'] }
      ]
    }
  ];

  /* ---- SCORING FRAMEWORK ----------------------------------------------------
     Drives the Productivity Score (per leader) and Team Health Score. Targets
     are a "solid day" — edit them as you calibrate. See METRICS-FRAMEWORK.md.
     Each pillar metric: { label, keys:[...summed...], target } OR a ratio
     { label, ratioNum:[...], ratioDen:[...], target } (e.g. resolution rate).  */
  var SCORE_WEIGHTS = { throughput: 0.40, quality: 0.25, timeliness: 0.20, value: 0.15 };
  var SHIFT_START = '08:30';   // arrival at/under this counts as punctual
  var REPORT_DUE_HOUR = 21;    // 9:00 PM submission cut-off

  var ROLE_SCORECARD = {
    'core-ops': {
      throughput: [
        { label: 'Tickets resolved',        keys: ['tickets_resolved'], target: 5 },
        { label: 'Tickets closed + updated', keys: ['tickets_closed', 'tickets_updated'], target: 12 },
        { label: 'Calls handled',           keys: ['inbound_calls', 'outbound_calls', 'dl_calls'], target: 12 }
      ],
      quality: [
        { label: 'QA done',          keys: ['qa_evaluations', 'credit_notes'], target: 5 },
        { label: 'Resolution rate',  ratioNum: ['tickets_resolved'], ratioDen: ['tickets_resolved', 'tickets_escalated'], target: 0.60 }
      ],
      // Value = collection ACTIVITY & DISCIPLINE (not the lumpy $ amount).
      value: [
        { label: 'Paid clients',                       keys: ['paid_clients'], target: 1 },
        { label: 'Collection follow-ups',              keys: ['follow_ups'], target: 5 },
        { label: 'Disconnections / Chidzoka actioned', keys: ['disconnections', 'chidzoka'], target: 3 }
      ]
    },
    'cash-ops': {
      throughput: [
        { label: 'Walk-ins attended', keys: ['walkins'], target: 6 },
        { label: 'Bank approvals',    keys: ['bank_approvals'], target: 5 },
        { label: 'Calls + WhatsApps', keys: ['inbound_calls', 'outbound_calls', 'cs_whatsapps'], target: 10 }
      ],
      quality: [
        { label: 'Reconciliations',     keys: ['account_recons'], target: 15 },
        { label: 'Internal customers',  keys: ['internal_customers'], target: 3 }
      ],
      // Value = collection/retention discipline (counts of actions, not $).
      value: [
        { label: 'Cash payments disbursed', keys: ['cash_disbursed'], target: 4 },
        { label: 'Paid clients',            keys: ['paid_clients'], target: 1 }
      ]
    },
    'network-ops': {
      throughput: [
        { label: 'Field jobs completed',     keys: ['field_jobs_completed'], target: 6 },
        { label: 'Faults attended / closed', keys: ['faults_attended'], target: 4 },
        { label: 'Tasks cleared',            keys: ['tasks_cleared'], target: 8 },
        { label: 'Installs validated',       keys: ['installs_validated'], target: 4 }
      ],
      quality: [
        { label: 'QA checks',           keys: ['qa_checks', 'qa_evaluations'], target: 5 },
        { label: 'Timesheets validated', keys: ['timesheets_validated'], target: 2 }
      ],
      // Network Ops has no revenue Value pillar — score re-weights across the rest.
      value: []
    },
    'governance': {
      throughput: [
        { label: 'QA evaluations + credit notes', keys: ['qa_evaluations', 'credit_notes'], target: 6 },
        { label: 'Reconciliations reviewed',      keys: ['account_recons'], target: 5 },
        { label: 'Follow-ups cleared',            keys: ['follow_ups'], target: 10 }
      ],
      quality: [
        { label: 'Resolution rate', ratioNum: ['tickets_resolved'], ratioDen: ['tickets_resolved', 'tickets_escalated'], target: 0.60 },
        { label: 'QA coverage',     keys: ['qa_evaluations', 'credit_notes'], target: 6 }
      ],
      // Governance is a compliance role — no revenue Value pillar; the score
      // re-weights across Throughput, Quality and Timeliness.
      value: []
    }
  };

  // Flat lookup: metric key -> {category, metric}
  var METRIC_INDEX = {};
  CATEGORIES.forEach(function (cat) {
    cat.metrics.forEach(function (m) { METRIC_INDEX[m.key] = { category: cat, metric: m }; });
  });

  function metricsForRole(role) {
    return CATEGORIES.filter(function (c) { return c.roles.indexOf(role) !== -1; });
  }

  /* ---- 3. ACTIVITY CATEGORISER --------------------------------------------
     Tags a free-text activity line into one outcome theme. First match wins,
     so order = priority.                                                       */
  var ACTIVITY_THEMES = [
    { key: 'meetings',   label: 'Meetings & Huddles',     icon: '🤝', kw: ['huddle', 'meeting', 'exco', 'met with', 'discussion', 'sd morning', 'dos morning', 'stand-up', 'standup'] },
    { key: 'qa',         label: 'Quality Assurance',      icon: '✅', kw: ['quality assurance', 'qa ', ' qa', 'validated', 'validate', 'verification', 'audit'] },
    { key: 'approvals',  label: 'Approvals',              icon: '🟢', kw: ['approved', 'approval', 'requisition', 'fleet request', 'fleet', 'facilities', 'expense', 'bank approval', 'sign off', 'signed off', 'damage form'] },
    { key: 'technical',  label: 'Technical / Field Support', icon: '🛠️', kw: ['troubleshoot', 'installation', 'install', 'technician', 'link', 'connectivity', 'hotspot', 'fault', 'bts', 'solar', 'equipment', 'remote', 'pop outage', 'cable', 'manhole', 'civil', 'power', 'network', 'relocate'] },
    { key: 'customer',   label: 'Customer Engagement',    icon: '👥', kw: ['walkin', 'walk-in', 'walk in', 'client', 'customer', 'assisted', 'helpdesk', 'helpdesk ticket'] },
    { key: 'followups',  label: 'Follow-ups & Task Mgmt', icon: '⏭️', kw: ['follow up', 'followed up', 'follow-up', 'carried forward', 'carry forward', 'pending', 'reminder', 'escalat', 'outstanding', 'chase'] },
    { key: 'reporting',  label: 'Reporting & Admin',      icon: '📊', kw: ['report', 'eod', 'end-of-day', 'end of day', 'tracker', 'timesheet', 'compiled', 'compile', 'printed', 'distributed', 'prepared', 'updated the'] }
  ];

  function categoriseActivity(text) {
    var t = ' ' + text.toLowerCase() + ' ';
    for (var i = 0; i < ACTIVITY_THEMES.length; i++) {
      var th = ACTIVITY_THEMES[i];
      for (var j = 0; j < th.kw.length; j++) {
        if (t.indexOf(th.kw[j]) !== -1) return th.key;
      }
    }
    return 'other';
  }
  var ACTIVITY_THEME_INDEX = { other: { key: 'other', label: 'Other', icon: '📌' } };
  ACTIVITY_THEMES.forEach(function (t) { ACTIVITY_THEME_INDEX[t.key] = t; });

  /* ---- 4. PARSER -----------------------------------------------------------
     Input: raw pasted report text. Output: structured object the review form
     pre-fills. Section-aware so duplicate labels resolve correctly.            */

  // Strip leading bullets / emoji / list markers from a line.
  function stripBullet(line) {
    return line
      .replace(/^[\s ]*[•\-\*•‣◦⁃∙·]+[\s ]*/, '')
      .replace(/^[\s ]*[✅\u{1F4E6}\u{1F91D}\u{1F465}\u{1F3E2}\u{1F697}\u{1F4DD}\u{1F4CA}\u{1F39F}\u{1F3AB}\u{1F39F}\u{1F6E0}\u{1F4E1}\u{1F4C8}⏭\u{1F4CB}\u{1F4B0}\u{1F4B3}\u{1F6B6}\u{1F6B6}\u{1F3FD}‍♀️\u{1F9F9}\u{1F48E}]+[\s ]*/u, '')
      .replace(/^[\s ]*[•\-\*]+[\s ]*/, '')
      .trim();
  }
  // Remove ALL emoji + leading symbols for matching purposes.
  function cleanForMatch(line) {
    return line
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}✅⏭️‍⃣]/gu, ' ')
      .replace(/^[\s •\-\*•·.]+/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function firstInt(str) {
    var m = str.match(/-?\d+/);
    return m ? parseInt(m[0], 10) : null;
  }

  // The integer whose position is CLOSEST to the matched alias span.
  // Structured lines put the number after the label ("Paid Clients: 2");
  // prose puts it before the noun ("2 account reconciliations"). Closest wins.
  function closestInt(line, aliasStart, aliasEnd) {
    var re = /-?\d+/g, m, best = null, bestDist = Infinity;
    while ((m = re.exec(line)) !== null) {
      var pos = m.index;
      // Skip a digit that is PART of the alias itself (e.g. the "2" in "2nd Line").
      if (pos < aliasEnd && pos + m[0].length > aliasStart) continue;
      // distance from the number to the nearest edge of the alias span
      var dist = pos < aliasStart ? aliasStart - (pos + m[0].length) : pos - aliasEnd;
      if (dist < bestDist) { bestDist = dist; best = parseInt(m[0], 10); }
    }
    return { value: best, dist: bestDist };
  }

  var MONTHS = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 };
  // Detect a date in many formats -> ISO yyyy-mm-dd
  function parseDate(raw) {
    if (!raw) return null;
    var s = raw.trim();
    // dd/mm/yyyy or dd/mm/yy  (these reports use day-first)
    var m = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
    if (m) {
      var d = parseInt(m[1], 10), mo = parseInt(m[2], 10), y = parseInt(m[3], 10);
      if (y < 100) y += 2000;
      // Heuristic: if first number > 12 it's a day; reports are dd/mm. Keep dd/mm.
      if (d > 31 && mo <= 31) { var tmp = d; d = mo; mo = tmp; }
      return iso(y, mo, d);
    }
    // "24 June 2026" / "24 Jun 2026"
    m = s.match(/(\d{1,2})\s+([a-z]{3,})\.?\s+(\d{4})/i);
    if (m && MONTHS[m[2].slice(0, 3).toLowerCase()]) {
      return iso(parseInt(m[3], 10), MONTHS[m[2].slice(0, 3).toLowerCase()], parseInt(m[1], 10));
    }
    // "June 24, 2026" / "June 24 2026"
    m = s.match(/([a-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{4})/i);
    if (m && MONTHS[m[1].slice(0, 3).toLowerCase()]) {
      return iso(parseInt(m[3], 10), MONTHS[m[1].slice(0, 3).toLowerCase()], parseInt(m[2], 10));
    }
    return null;
  }
  function iso(y, mo, d) {
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return y + '-' + p(mo) + '-' + p(d);
  }

  // Detect arrival time -> "HH:MM" 24h
  function parseTime(raw) {
    if (!raw) return null;
    var m = raw.match(/(\d{1,2})[:h\.](\d{2})/i);
    if (m) {
      var h = parseInt(m[1], 10), mn = parseInt(m[2], 10);
      if (h <= 23 && mn <= 59) return (h < 10 ? '0' : '') + h + ':' + (mn < 10 ? '0' : '') + mn;
    }
    // bare "0800hrs"
    m = raw.match(/(\d{3,4})\s*hrs?/i);
    if (m) {
      var n = m[1].padStart(4, '0');
      return n.slice(0, 2) + ':' + n.slice(2);
    }
    return null;
  }

  function matchRosterName(text) {
    var lc = text.toLowerCase();
    var best = null;
    ROSTER.forEach(function (p) {
      if (lc.indexOf(p.name.toLowerCase()) !== -1) {
        if (!best || p.name.length > best.name.length) best = p;
      }
    });
    return best;
  }

  // Role from the report TITLE line (e.g. "NETWORK OPS DAY SHIFT REPORT"),
  // not from incidental body mentions ("...and Cash Office teams").
  function detectRole(text) {
    var lines = text.split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      var lc = lines[i].toLowerCase();
      if (/(report|shift)/.test(lc)) {
        if (/network\s*ops/.test(lc)) return 'network-ops';
        if (/cash\s*ops/.test(lc))    return 'cash-ops';
        if (/core\s*ops/.test(lc))    return 'core-ops';
      }
    }
    return null;
  }

  // Is this clean line a section header? -> category key or null
  function detectSection(clean) {
    var lc = clean.toLowerCase().replace(/[:.]/g, '').trim();
    for (var i = 0; i < CATEGORIES.length; i++) {
      var hs = CATEGORIES[i].headers;
      for (var j = 0; j < hs.length; j++) {
        if (lc === hs[j] || lc.indexOf(hs[j]) === 0 && lc.length < hs[j].length + 4) return CATEGORIES[i].key;
      }
    }
    return null;
  }

  // Try to match a metric on this clean line within the current section.
  // Returns {key, value} or null.
  function matchMetric(clean, sectionKey) {
    var lc = clean.toLowerCase();
    // Candidate metrics: section first (to resolve dupes), then any.
    var ordered = [];
    if (sectionKey) {
      var sc = CATEGORIES.filter(function (c) { return c.key === sectionKey; })[0];
      if (sc) ordered = ordered.concat(sc.metrics);
    }
    CATEGORIES.forEach(function (c) {
      if (c.key !== sectionKey) ordered = ordered.concat(c.metrics);
    });
    // Find the longest alias that appears in the line (avoids "emails" beating "emails sent").
    var bestMetric = null, bestAlias = '';
    ordered.forEach(function (m) {
      m.aliases.forEach(function (a) {
        if (lc.indexOf(a) !== -1 && a.length > bestAlias.length) { bestAlias = a; bestMetric = m; }
      });
    });
    if (!bestMetric) return null;
    var idx = lc.indexOf(bestAlias);
    var hit = closestInt(clean, idx, idx + bestAlias.length);
    var val = hit.value;
    // How "metric-like" is this line? A long prose sentence with a tiny matching
    // word ("...outstanding tickets") must NOT be swallowed as a blank metric.
    // But prose with a number sitting right next to the metric noun
    // ("Conducted 27 follow-ups") IS a real metric worth capturing.
    var hasColon = /[:：]/.test(clean);
    var coverage = bestAlias.length / clean.length;
    var metricLike = hasColon
      ? (clean.length <= 48 || (val !== null && hit.dist <= 4))
      : (coverage > 0.45 || (val !== null && hit.dist <= 4));
    return { key: bestMetric.key, value: val, metricLike: metricLike };
  }

  // Lines that are pure metadata / headers and should NOT become activities.
  function isNoise(clean) {
    var lc = clean.toLowerCase();
    if (!lc) return true;
    if (/^(date|shift|time of arrival|🕒|⏰|📅)/.test(lc)) return true;
    if (/end[- ]of[- ]?(shift|day) report/.test(lc)) return true;
    if (/end of report/.test(lc)) return true;
    if (/^(activities completed|communications|operations|collaboration)/.test(lc)) return true;
    if (lc.length < 3) return true;
    return false;
  }

  // Report titles ("CORE OPS LEADER ... REPORT") and bare name/byline lines
  // ("Tafadzwa", "Chirwa | 19/06/2026 | 0759") are metadata, not activities.
  function isNameOrTitle(clean) {
    var lc = clean.toLowerCase().trim();
    if (/(core|cash|network)\s*ops.*(report|shift|leader)/.test(lc)) return true;
    if (/\b(report|shift report)\b/.test(lc) && lc.length < 40) return true;
    // Bare roster name, optionally followed by date/time separators.
    for (var i = 0; i < ROSTER.length; i++) {
      var n = ROSTER[i].name.toLowerCase();
      if (lc === n) return true;
      if (lc.indexOf(n) === 0 && /^[\s|\-:,\d\/.]*$/.test(lc.slice(n.length))) return true;
    }
    return false;
  }

  function parseReport(raw) {
    var lines = raw.split(/\r?\n/);
    var person = matchRosterName(raw);
    // The roster is authoritative for a known leader's role; fall back to the
    // report title only for people not on the roster.
    var role = (person && person.role) || detectRole(raw) || 'core-ops';

    // Metadata scan
    var date = null, arrival = null, departure = null, shift = null;
    lines.forEach(function (ln) {
      var lc = ln.toLowerCase();
      if (!date && /date/.test(lc)) date = parseDate(ln);
      if (!date) {
        var d = parseDate(ln);
        // accept numeric dd/mm or a spelled-out month so titles like
        // "End-of-Day Report – 24 June 2026" still yield a date
        if (d && (/\d{1,2}[\/\-.]\d{1,2}/.test(ln) || /\d{1,2}\s+[a-z]{3,}\s+\d{4}/i.test(ln) || /[a-z]{3,}\.?\s+\d{1,2},?\s+\d{4}/i.test(ln))) date = d;
      }
      if (!arrival && /(arrival|arrived)/.test(lc)) arrival = parseTime(ln);
      // Byline format "Chirwa | 19/06/2026 | 0759" — time is the last bare HHMM.
      if (!arrival && person && lc.indexOf(person.name.toLowerCase()) !== -1 && /\|/.test(ln)) {
        arrival = parseTime(ln);
      }
      if (!departure && /(depart|clock[- ]?out|clocked out|knock[- ]?off|time out|sign[- ]?out|left at)/.test(lc)) departure = parseTime(ln);
      if (!shift && /shift/.test(lc)) {
        if (/night/.test(lc)) shift = 'Night'; else if (/day/.test(lc)) shift = 'Day';
      }
    });

    var metrics = {};
    var activities = [];
    var currentSection = null;

    lines.forEach(function (rawLine) {
      var clean = cleanForMatch(rawLine);
      if (!clean) return;

      var sec = detectSection(clean);
      if (sec) { currentSection = sec; return; }

      // Metadata lines -> skip from activities, but still try metric capture if numeric.
      var lc = clean.toLowerCase();
      var isMeta = /^(date|shift|time of arrival|paid clients are handled)/.test(lc) ||
                   /end[- ]of[- ]?(shift|day) report/.test(lc);
      if (isMeta) return;

      var hit = matchMetric(clean, currentSection);
      if (hit && hit.value !== null && hit.metricLike) {
        // First occurrence wins (don't overwrite an earlier value with a later 0).
        if (metrics[hit.key] === undefined || metrics[hit.key] === null) metrics[hit.key] = hit.value;
        return;
      }
      // A metric-like line naming a metric but with no number = blank field, skip.
      if (hit && hit.value === null && hit.metricLike) return;

      // Otherwise it's a qualitative activity — unless it's a name/title/metadata line.
      var actText = stripBullet(rawLine).trim();
      if (actText && !isNoise(clean) && !isNameOrTitle(clean) && actText.length > 4) {
        activities.push({ text: actText, theme: categoriseActivity(actText) });
      }
    });

    return {
      name: person ? person.name : '',
      role: role,
      date: date,
      shift: shift || 'Day',
      arrival: arrival,
      departure: departure,   // clock-out time
      metrics: metrics,
      activities: activities,
      notes: {},              // per-category notes, keyed by category key
      highlights: {},         // win / blocker / blocker_action / celebrate / concern
      raw: raw
    };
  }

  /* ---- 5. BACKEND ----------------------------------------------------------
     Supabase table `ops_reports` when configured & reachable; localStorage
     ('afv_ops_reports') otherwise. Same async API either way.                  */
  var LS_KEY = 'afv_ops_reports';
  var hasSupabase = (typeof global._supabase !== 'undefined' && global._supabase);

  // One-time flush of the old demo data from any browser that still holds it.
  // Runs once per browser; real submissions made after this are untouched.
  try {
    if (localStorage.getItem('afv_ops_demo_flushed_v1') !== '1') {
      localStorage.removeItem(LS_KEY);
      localStorage.setItem('afv_ops_demo_flushed_v1', '1');
    }
  } catch (e) {}

  function lsAll() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch (e) { return []; }
  }
  function lsWrite(arr) { localStorage.setItem(LS_KEY, JSON.stringify(arr)); }

  function recordId(r) { return r.name + '|' + r.date; }

  // Save (upsert by name+date). Returns {ok, via}.
  function saveReport(report) {
    var row = {
      name: report.name,
      role: report.role,
      report_date: report.date,
      shift: report.shift,
      arrival: report.arrival,
      departure: report.departure || null,
      metrics: report.metrics,
      activities: report.activities,
      notes: report.notes || {},
      highlights: report.highlights || {},
      raw: report.raw,
      submitted_at: new Date().toISOString()
    };
    if (hasSupabase) {
      return global._supabase
        .from('ops_reports')
        .upsert(row, { onConflict: 'name,report_date' })
        .then(function (res) {
          if (res.error) { lsUpsert(row); return { ok: true, via: 'local', warn: res.error.message }; }
          return { ok: true, via: 'supabase' };
        })
        .catch(function (e) { lsUpsert(row); return { ok: true, via: 'local', warn: String(e) }; });
    }
    lsUpsert(row);
    return Promise.resolve({ ok: true, via: 'local' });
  }
  function lsUpsert(row) {
    var all = lsAll();
    var i = all.findIndex(function (r) { return r.name === row.name && r.report_date === row.report_date; });
    if (i >= 0) all[i] = row; else all.push(row);
    lsWrite(all);
  }

  // Load all reports (optionally filtered). Returns Promise<array>.
  function loadReports() {
    if (hasSupabase) {
      return global._supabase
        .from('ops_reports')
        .select('*')
        .order('report_date', { ascending: false })
        .then(function (res) {
          if (res.error || !res.data) return lsAll();
          // Merge any local-only rows (offline submissions) with remote.
          var merged = res.data.slice();
          lsAll().forEach(function (l) {
            if (!merged.some(function (r) { return r.name === l.name && r.report_date === l.report_date; })) merged.push(l);
          });
          return merged;
        })
        .catch(function () { return lsAll(); });
    }
    return Promise.resolve(lsAll());
  }

  // Reports can be edited / removed for this many hours after submission.
  var EDIT_WINDOW_HOURS = 48;
  function isLocked(row) {
    if (!row || !row.submitted_at) return false;
    var sub = new Date(row.submitted_at).getTime();
    if (isNaN(sub)) return false;
    return (Date.now() - sub) > EDIT_WINDOW_HOURS * 3600 * 1000;
  }

  // Delete a report (within the edit window). Returns Promise<{ok}>.
  function deleteReport(name, reportDate) {
    var all = lsAll().filter(function (r) { return !(r.name === name && r.report_date === reportDate); });
    lsWrite(all);
    if (hasSupabase) {
      return global._supabase.from('ops_reports').delete().eq('name', name).eq('report_date', reportDate)
        .then(function () { return { ok: true }; })
        .catch(function () { return { ok: true, via: 'local' }; });
    }
    return Promise.resolve({ ok: true });
  }

  /* ---- 6. SEED -------------------------------------------------------------
     Demo data has been flushed — the system starts empty and only fills with
     real submissions. (Left intentionally blank.)                              */
  var SEED = [];

  function seedRows() {
    return SEED.map(function (raw) {
      var p = parseReport(raw);
      return {
        name: p.name, role: p.role, report_date: p.date, shift: p.shift,
        arrival: p.arrival, departure: p.departure, metrics: p.metrics,
        activities: p.activities, notes: p.notes || {}, highlights: p.highlights || {},
        raw: p.raw, submitted_at: (p.date || '2026-06-24') + 'T17:30:00Z'
      };
    });
  }
  function seedIfEmpty() {
    if (lsAll().length > 0) return;
    lsWrite(seedRows());
  }
  // Force-load the sample reports into localStorage (overwrites the local copy).
  // Also pushes them to Supabase when shared mode is on, so the team all see them.
  function reseed() {
    var rows = seedRows();
    lsWrite(rows);
    if (hasSupabase) {
      try { global._supabase.from('ops_reports').upsert(rows, { onConflict: 'name,report_date' }).then(function(){}); } catch (e) {}
    }
    return rows.length;
  }

  /* ---- DATE HELPERS (shared by dashboard) ---------------------------------- */
  function isoWeek(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    var day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day + 3);
    var firstThu = new Date(d.getFullYear(), 0, 4);
    var week = 1 + Math.round(((d - firstThu) / 86400000 - 3 + ((firstThu.getDay() + 6) % 7)) / 7);
    return d.getFullYear() + '-W' + (week < 10 ? '0' : '') + week;
  }
  function monthKey(dateStr) { return dateStr ? dateStr.slice(0, 7) : ''; }

  /* ---- 7. TASK LIBRARY -----------------------------------------------------
     A catalogue of selectable tasks (with icons), distilled from the real
     reports. Leaders can pick these to build a report instead of typing.
     Custom tasks added by users are archived to localStorage (and Supabase
     when shared mode is on) so they appear for everyone next time.            */
  var DEFAULT_TASKS = [
    // Meetings & Huddles
    { label: 'Attended the SD Morning Huddle',                 theme: 'meetings', icon: '🤝' },
    { label: 'Attended the DOS Morning Huddle',                theme: 'meetings', icon: '🤝' },
    { label: 'Conducted the team morning huddle',              theme: 'meetings', icon: '🗣️' },
    { label: 'Participated in the cross-team morning huddle',  theme: 'meetings', icon: '👥' },
    { label: 'Held a short team meeting on productivity',      theme: 'meetings', icon: '👥' },
    { label: 'Attended the Payment Plan meeting',              theme: 'meetings', icon: '📅' },
    { label: 'Attended the Exco Customer Success meeting',     theme: 'meetings', icon: '🏛️' },
    { label: 'Attended Odoo Automation training',              theme: 'meetings', icon: '🎓' },
    // Quality Assurance
    { label: 'Performed QA on tasks completed by the team',    theme: 'qa', icon: '✅' },
    { label: 'Conducted QA on installations & maintenance',    theme: 'qa', icon: '🔧' },
    { label: 'Conducted QA on overtime timesheets',            theme: 'qa', icon: '🗂️' },
    { label: 'QA on billing tickets',                          theme: 'qa', icon: '🧾' },
    { label: 'QA on credit notes',                             theme: 'qa', icon: '📝' },
    { label: 'Validated civil works timesheets',               theme: 'qa', icon: '📊' },
    { label: 'Validated technician timesheets',                theme: 'qa', icon: '✔️' },
    // Approvals
    { label: 'Approved requisitions',                          theme: 'approvals', icon: '🟢' },
    { label: 'Completed packing expense approvals',            theme: 'approvals', icon: '📦' },
    { label: 'Approved facilities work',                       theme: 'approvals', icon: '🏢' },
    { label: 'Approved fleet requests',                        theme: 'approvals', icon: '🚗' },
    { label: 'Approved bank payments',                         theme: 'approvals', icon: '💰' },
    // Technical / Field Support
    { label: 'Assisted technicians with remote troubleshooting', theme: 'technical', icon: '🛠️' },
    { label: 'Supported installation-related issues',          theme: 'technical', icon: '📡' },
    { label: 'Remotely troubleshot a client link / site visit', theme: 'technical', icon: '🔌' },
    { label: 'Compiled & reviewed area fault reports',         theme: 'technical', icon: '📈' },
    { label: 'Reported on close-gap measures (cable uproots / POP outages)', theme: 'technical', icon: '🧰' },
    { label: 'Followed up on the BTS / solar upgrade project', theme: 'technical', icon: '🔋' },
    { label: 'Monitored updates in Facilities Pro',            theme: 'technical', icon: '🖥️' },
    // Customer Engagement
    { label: 'Assisted a walk-in client',                      theme: 'customer', icon: '🚶' },
    { label: 'Worked on Helpdesk tickets',                     theme: 'customer', icon: '🎟️' },
    { label: 'Attended to internal customers',                 theme: 'customer', icon: '👤' },
    // Follow-ups & Task Mgmt
    { label: 'Followed up on outstanding tickets',             theme: 'followups', icon: '🎫' },
    { label: 'Conducted follow-ups to clear overdue tasks',    theme: 'followups', icon: '⏭️' },
    { label: 'Carried forward pending tasks',                  theme: 'followups', icon: '⏭️' },
    { label: 'Followed up on escalations',                     theme: 'followups', icon: '⛳' },
    { label: 'Followed up on outstanding payments',            theme: 'followups', icon: '💵' },
    // Reporting & Admin
    { label: 'Prepared, printed & distributed damage forms',   theme: 'reporting', icon: '📝' },
    { label: 'Updated the End-of-Day report tracker',          theme: 'reporting', icon: '📋' },
    { label: 'Reviewed account reconciliations',               theme: 'reporting', icon: '🔢' }
  ];

  var TASK_LS = 'afv_ops_tasks';
  function taskId(label) { return String(label).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function customTasks() { try { return JSON.parse(localStorage.getItem(TASK_LS) || '[]'); } catch (e) { return []; } }
  function normTask(t) {
    var theme = t.theme || 'other';
    var icon = t.icon || (ACTIVITY_THEME_INDEX[theme] || { icon: '📌' }).icon;
    return { id: taskId(t.label), label: t.label, theme: theme, icon: icon, custom: !!t.custom };
  }
  // Full library: defaults + archived custom tasks, de-duplicated by id.
  function loadTasks() {
    var map = {};
    DEFAULT_TASKS.forEach(function (t) { map[taskId(t.label)] = normTask(t); });
    customTasks().forEach(function (t) { map[taskId(t.label)] = normTask({ label: t.label, theme: t.theme, icon: t.icon, custom: true }); });
    return Object.keys(map).map(function (k) { return map[k]; });
  }
  // Archive a new task for future use. Returns the normalised task (or existing).
  function addTask(label, theme, icon) {
    label = (label || '').trim();
    if (!label) return null;
    var t = normTask({ label: label, theme: theme, icon: icon, custom: true });
    var existing = loadTasks().filter(function (x) { return x.id === t.id; })[0];
    if (existing) return existing;
    var cur = customTasks();
    cur.push({ label: t.label, theme: t.theme, icon: t.icon });
    localStorage.setItem(TASK_LS, JSON.stringify(cur));
    if (hasSupabase) {
      try { global._supabase.from('ops_tasks').upsert({ id: t.id, label: t.label, theme: t.theme, icon: t.icon }, { onConflict: 'id' }).then(function () {}); } catch (e) {}
    }
    return t;
  }
  // Pull any shared tasks from Supabase into the local archive (best-effort).
  function syncTasks() {
    if (!hasSupabase) return Promise.resolve(loadTasks());
    return global._supabase.from('ops_tasks').select('*').then(function (res) {
      if (!res.error && res.data) {
        var known = {}; loadTasks().forEach(function (x) { known[x.id] = true; });
        var cur = customTasks();
        res.data.forEach(function (r) { if (!known[taskId(r.label)]) cur.push({ label: r.label, theme: r.theme, icon: r.icon }); });
        localStorage.setItem(TASK_LS, JSON.stringify(cur));
      }
      return loadTasks();
    }).catch(function () { return loadTasks(); });
  }

  /* ---- PUBLIC API ---------------------------------------------------------- */
  global.OpsData = {
    ROSTER: ROSTER,
    ROLES: ROLES,
    CATEGORIES: CATEGORIES,
    METRIC_INDEX: METRIC_INDEX,
    ACTIVITY_THEMES: ACTIVITY_THEMES,
    ACTIVITY_THEME_INDEX: ACTIVITY_THEME_INDEX,
    metricsForRole: metricsForRole,
    fullNameOf: fullNameOf,
    SCORE_WEIGHTS: SCORE_WEIGHTS,
    ROLE_SCORECARD: ROLE_SCORECARD,
    SHIFT_START: SHIFT_START,
    categoriseActivity: categoriseActivity,
    parseReport: parseReport,
    saveReport: saveReport,
    loadReports: loadReports,
    deleteReport: deleteReport,
    isLocked: isLocked,
    EDIT_WINDOW_HOURS: EDIT_WINDOW_HOURS,
    seedIfEmpty: seedIfEmpty,
    reseed: reseed,
    DEFAULT_TASKS: DEFAULT_TASKS,
    loadTasks: loadTasks,
    addTask: addTask,
    syncTasks: syncTasks,
    taskId: taskId,
    isoWeek: isoWeek,
    monthKey: monthKey,
    backend: hasSupabase ? 'supabase' : 'local'
  };

})(window);

#!/usr/bin/env node
/*
 * NetAegis — synthetic demo backend API (slice 1, fixture-only).
 *
 * A small, dependency-free local demo server that serves the root dashboard
 * assets and a JSON API for fictional incident fixtures. It uses the ROOT
 * dashboard schema (ids NET-1042/1041/1040, category
 * Identity/Configuration/Endpoint, Title Case severity/status, asset, site,
 * offset, summary, evidence, next) plus explicit demo/service health state.
 * It is aligned with the n8n notification contract
 * (contracts/n8n-notification-event.schema.json) so the root UI and the
 * brother's workflow can consume it without translation.
 *
 * It has no alerting, ingest, or live-integration capability of any kind:
 *
 *   - source mode is ALWAYS 'synthetic-fixture'; no Wazuh connection exists,
 *   - no model is called; the root UI's "Local model summary" content is
 *     illustrative fixture text, and this API labels it as such,
 *   - the workflow endpoint only records LOCAL simulated events shaped per
 *     the n8n contract (v1.0.0), always with channel "simulated",
 *   - the server binds to the loopback interface by default, and refuses
 *     to start on any other interface unless NETAEGIS_ALLOW_NON_LOOPBACK=1,
 *   - no CORS is enabled; the API is intended for local use, and a browser
 *     root dashboard assets are served from the same origin as this API,
 *   - no credentials exist in this slice, in code, fixtures, or docs.
 *
 * Run:            node backend/server.js  (http://127.0.0.1:4173)
 * Configuration:  environment variables only — see backend/README.md
 * Adapter seam:   see backend/adapters.js — future read-only Wazuh and
 *                 local-model adapters plug in there, disabled until agreed.
 */

"use strict";

const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const {
  INCIDENTS,
  SERVICE_STATUS,
  STATUS_VALUES,
  CATEGORY_VALUES,
  CONTRACT_CATEGORY_VALUES,
  CONTRACT_SEVERITY_VALUES,
  CONTRACT,
  nextStatus,
} = require("./fixtures");
const { createAppState } = require("./state");
const { createAdapters } = require("./adapters");
const { SERVERS } = require("./servers");

/* ---------- configuration (env only, loopback-only defaults) ---------- */

const config = {
  host: process.env.NETAEGIS_HOST || "127.0.0.1",
  port: Number(process.env.NETAEGIS_PORT || 4173),
  sourceMode: "synthetic-fixture", // matches the n8n contract enum; never anything real
  stateFilePath: process.env.NETAEGIS_PERSIST_STATE || null,
};

const allowNonLoopback = process.env.NETAEGIS_ALLOW_NON_LOOPBACK === "1";
if (!allowNonLoopback && !isLoopbackHost(config.host)) {
  console.error(
    `[netagis] refusing to start: NETAEGIS_HOST=${config.host} is not a loopback address. ` +
      "The demo is loopback-only. Set NETAEGIS_ALLOW_NON_LOOPBACK=1 only if you understand the exposure."
  );
  process.exit(1);
}

function isLoopbackHost(host) {
  const normalized = String(host).toLowerCase().replace(/^\[|\]$/g, "");
  return normalized === "localhost" || normalized === "::1" || normalized.startsWith("127.");
}

const startedAt = new Date();
const appState = createAppState(config.stateFilePath);
const adapters = createAdapters();

/* ---------- helpers ---------- */

const MAX_BODY_BYTES = 16 * 1024; // small demo payloads only
const ID_PATTERN = /^NET-\d{4}$/; // same pattern as the n8n contract's incident_id
const PROJECT_ROOT = path.resolve(__dirname, "..");
const STATIC_FILES = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/styles.css", "styles.css"],
  ["/app.js", "app.js"],
]);
const STATIC_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

function sendJson(res, code, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function sendStatic(pathname, res) {
  const relativePath = STATIC_FILES.get(pathname);
  if (!relativePath) return false;
  const filePath = path.resolve(PROJECT_ROOT, relativePath);
  if (!filePath.startsWith(`${PROJECT_ROOT}${path.sep}`)) {
    sendJson(res, 404, { error: "not_found" });
    return true;
  }
  let body;
  try {
    body = fs.readFileSync(filePath);
  } catch {
    sendJson(res, 404, { error: "not_found", detail: "Dashboard asset is missing." });
    return true;
  }
  res.writeHead(200, {
    "Content-Type": STATIC_TYPES[path.extname(filePath)],
    "Content-Length": body.length,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
  });
  res.end(body);
  return true;
}

function requireSameOriginJson(req, res) {
  const requestHost = (req.headers.host || "").toLowerCase();
  const origin = req.headers.origin || "";
  let parsedOrigin;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    sendJson(res, 403, { error: "forbidden", detail: "State-changing demo actions require a same-origin browser request." });
    return false;
  }
  const localHost = (() => {
    try {
      const parsedHost = new URL(`http://${requestHost}`);
      const parsedOriginHost = parsedOrigin.hostname.toLowerCase();
      const requestPort = parsedHost.port || "80";
      const originPort = parsedOrigin.port || "80";
      return isLoopbackHost(parsedHost.hostname) && isLoopbackHost(parsedOriginHost) &&
        requestPort === String(config.port) && originPort === String(config.port) &&
        parsedOriginHost === parsedHost.hostname.toLowerCase();
    } catch {
      return false;
    }
  })();
  if (!localHost || parsedOrigin.protocol !== "http:" || parsedOrigin.origin !== origin) {
    sendJson(res, 403, { error: "forbidden", detail: "State-changing demo actions require the local dashboard origin." });
    return false;
  }
  const contentType = (req.headers["content-type"] || "").split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    sendJson(res, 415, { error: "unsupported_media_type", detail: "State-changing demo actions require application/json." });
    return false;
  }
  return true;
}

function occurredAt(inc) {
  // Anchor offsets to process startup so a fixture's event time stays fixed
  // during a demo session instead of moving forward on each API request.
  return new Date(startedAt.getTime() - inc.offset * 60000).toISOString();
}

const incidentIndex = new Map(INCIDENTS.map((i) => [i.id, i]));

function statusOf(inc) {
  const st = appState.get(inc.id);
  return (st && st.status) || inc.status;
}

function listShape(inc) {
  return {
    id: inc.id,
    title: inc.title,
    category: inc.category,
    severity: inc.severity,
    asset: inc.asset,
    site: inc.site,
    offset: inc.offset,
    status: statusOf(inc),
    fixtureStatus: inc.status,
    summary: inc.summary,
    occurredAt: occurredAt(inc),
    sourceMode: config.sourceMode,
    synthetic: true,
  };
}

function detailShape(inc) {
  const st = appState.get(inc.id) || {};
  return {
    // Root-schema fields, unchanged in shape and semantics:
    id: inc.id,
    title: inc.title,
    category: inc.category,
    severity: inc.severity,
    asset: inc.asset,
    site: inc.site,
    offset: inc.offset,
    status: statusOf(inc),
    fixtureStatus: inc.status,
    summary: inc.summary,
    evidence: inc.evidence,
    next: inc.next,
    // Additive, demo-only fields (safe to ignore by consumers of the root schema):
    occurredAt: occurredAt(inc),
    occurredAtNote: "computed once per process from the fixture 'offset' (minutes ago); stable for this demo session",
    sourceMode: config.sourceMode,
    synthetic: true,
    evidenceReference: inc.evidenceReference,
    note: st.note || null,
    workflowSimulated: Boolean(st.workflowDone),
    activity: st.activity || [],
    modelSummaryLabel: "Illustrative only · no model is connected. 'summary'/'next' are fixture text, not model output.",
    demoNotice:
      "All fields above are synthetic fixture content mirroring the root dashboard schema. Status changes, notes and simulated workflow events live only in this backend process (and optional state file). Nothing is sent anywhere.",
  };
}

/* Simulated n8n contract event (v1.0.0), built from schema-mirroring fields.
 * Local demo record only — never delivered anywhere. */
function contractEventShape(inc) {
  return {
    event_id: crypto.randomUUID(),
    incident_id: inc.id,
    event_version: CONTRACT.eventVersion,
    source_mode: config.sourceMode, // "synthetic-fixture"
    synthetic: true,
    severity: inc.severity,
    category: inc.category,
    occurred_at: occurredAt(inc),
    asset_label: inc.asset,
    summary: inc.summary,
    evidence_reference: inc.evidenceReference,
    idempotency_key: crypto.randomUUID(),
    notification_policy: {
      channel: CONTRACT.demoChannel,
      urgency: "standard",
      retry: { max_attempts: 3, initial_backoff_seconds: 5 },
    },
  };
}

/* ---------- request handlers ---------- */

function handleHealth(res) {
  sendJson(res, 200, {
    status: "ok",
    demo: true,
    service: "NetAegis synthetic demo API",
    sourceMode: config.sourceMode,
    startedAt: startedAt.toISOString(),
    uptimeSeconds: Math.round((Date.now() - startedAt.getTime()) / 1000),
    services: [...SERVICE_STATUS, ...Object.values(adapters).map((a) => a.describe())],
    disclaimer:
      "Everything reported here is a local fixture demo. No service listed is live, and this API performs no monitoring, detection, or notification.",
  });
}

function handleConfig(res) {
  sendJson(res, 200, {
    demo: true,
    sourceMode: config.sourceMode,
    host: config.host,
    port: config.port,
    persistStateFile: config.stateFilePath,
    nonLoopbackAllowed: allowNonLoopback,
    statusValues: STATUS_VALUES,
    categories: CATEGORY_VALUES,
    contract: {
      ...CONTRACT,
      categories: CONTRACT_CATEGORY_VALUES,
      severities: CONTRACT_SEVERITY_VALUES,
      note: "See contracts/n8n-notification-event.schema.json and docs/n8n-contract.md at the repo root.",
    },
    counts: {
      incidents: INCIDENTS.length,
      servers: SERVERS.length,
      bySeverity: countBy(INCIDENTS.map((i) => i.severity)),
      byCategory: countBy(INCIDENTS.map((i) => i.category)),
    },
    adapters: Object.values(adapters).map((a) => a.describe()),
    disclaimer: "Configuration shown is this demo process's own loopback settings. No external endpoints or credentials exist.",
  });
}

function countBy(arr) {
  return arr.reduce((acc, key) => ((acc[key] = (acc[key] || 0) + 1), acc), {});
}

function handleListIncidents(query, res) {
  let items = [...INCIDENTS];

  const severity = query.get("severity");
  const category = query.get("category");
  const status = query.get("status");
  const q = (query.get("q") || "").trim().toLowerCase();

  if (severity) items = items.filter((i) => i.severity === severity);
  if (category) items = items.filter((i) => i.category === category);
  if (status) items = items.filter((i) => statusOf(i) === status);
  if (q) {
    // Same searchable fields as the root dashboard: id, title, asset, category, site.
    items = items.filter((i) =>
      `${i.id} ${i.title} ${i.asset} ${i.category} ${i.site}`.toLowerCase().includes(q)
    );
  }

  // Same order as the root list: most recent (smallest offset) first.
  items.sort((a, b) => a.offset - b.offset);
  sendJson(res, 200, {
    demo: true,
    sourceMode: config.sourceMode,
    total: items.length,
    fixturesTotal: INCIDENTS.length,
    incidents: items.map(listShape),
  });
}

function handleListServers(res) {
  sendJson(res, 200, {
    demo: true,
    sourceMode: config.sourceMode,
    total: SERVERS.length,
    servers: SERVERS.map((server) => ({ ...server })),
    disclaimer: "Fictional server fixtures only. No hosts are enrolled, monitored, or analyzed by a model.",
  });
}

function handleGetIncident(id, res) {
  const inc = incidentIndex.get(id);
  if (!inc) return sendJson(res, 404, { error: "not_found", detail: `No such fixture incident id (pattern: ${ID_PATTERN}).` });
  sendJson(res, 200, detailShape(inc));
}

function handleAcknowledge(id, body, res) {
  const inc = incidentIndex.get(id);
  if (!inc) return sendJson(res, 404, { error: "not_found", detail: `No such fixture incident id (pattern: ${ID_PATTERN}).` });

  let newStatus;
  if (body && typeof body.status === "string") {
    newStatus = body.status;
    if (!STATUS_VALUES.includes(newStatus)) {
      return sendJson(res, 400, { error: "bad_request", detail: `status must be one of ${STATUS_VALUES.join(", ")}.` });
    }
  } else {
    // Default: advance the root dashboard's cycle New -> In review -> Resolved -> In review.
    newStatus = nextStatus(statusOf(inc));
  }

  appState.set(id, { ...(appState.get(id) || {}), status: newStatus });
  appState.addActivity(id, `Status advanced to '${newStatus}' via demo API (local change only).`);
  sendJson(res, 200, { id, status: newStatus, cycle: "New -> In review -> Resolved -> In review", demo: true, persistedIn: config.stateFilePath || "process memory only" });
}

function handleNote(id, body, res) {
  const inc = incidentIndex.get(id);
  if (!inc) return sendJson(res, 404, { error: "not_found", detail: `No such fixture incident id (pattern: ${ID_PATTERN}).` });

  const text = body && typeof body.text === "string" ? body.text.trim() : null;
  if (text === null) return sendJson(res, 400, { error: "bad_request", detail: "Body must be JSON with a 'text' string." });
  if (text.length > 2000) return sendJson(res, 400, { error: "bad_request", detail: "Note text exceeds 2000 characters." });

  const st = appState.get(id) || {};
  st.note = text;
  st.noteAt = new Date().toISOString();
  st.noteBy = "demo operator (API)";
  appState.set(id, st);
  appState.addActivity(id, "Operator note saved via demo API.");
  sendJson(res, 200, { id, note: st.note, noteAt: st.noteAt, demo: true });
}

function handleSimulateWorkflow(id, res) {
  const inc = incidentIndex.get(id);
  if (!inc) return sendJson(res, 404, { error: "not_found", detail: `No such fixture incident id (pattern: ${ID_PATTERN}).` });

  const st = appState.get(id) || {};
  if (st.workflowDone) {
    // idempotency: one simulated dispatch per incident per state lifetime
    return sendJson(res, 200, {
      id,
      simulatedStatus: "already-simulated",
      idempotency_key: st.workflowIdempotencyKey || null,
      event: st.workflowEvent || null,
      demo: true,
      detail: "A simulated dispatch was already recorded for this fixture incident. Nothing was sent.",
    });
  }
  const event = contractEventShape(inc);
  st.workflowDone = true;
  st.workflowIdempotencyKey = event.idempotency_key;
  st.workflowEventId = event.event_id;
  st.workflowEvent = event;
  appState.set(id, st);
  appState.addActivity(
    id,
    `Simulated dispatch recorded by MOCK workflow (local synthetic event, contract v${CONTRACT.eventVersion}, channel 'simulated'). Status: simulated-accepted. No real notification was sent — none is possible in this demo.`
  );
  sendJson(res, 200, {
    id,
    simulatedStatus: "simulated-accepted",
    event, // n8n contract-shaped synthetic event record (v1.0.0) — never delivered
    demo: true,
    detail:
      "This is a local fake event for demo purposes, shaped per contracts/n8n-notification-event.schema.json so the n8n side can be wired without translation. No real WhatsApp, SMS, email, or n8n call occurred.",
  });
}

function handleDemoReset(res) {
  for (const inc of INCIDENTS) {
    appState.set(inc.id, {}); // back to fixture defaults, like the root UI's "Reset demo"
  }
  sendJson(res, 200, {
    demo: true,
    reset: true,
    detail: "Operator state cleared; incidents restored to fixture defaults (equivalent to the root UI's Reset demo button).",
  });
}

/* ---------- routing ---------- */

function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const method = req.method || "GET";

  res.setHeader("X-Content-Type-Options", "nosniff");

  if (STATIC_FILES.has(pathname)) {
    if (!requireMethod(method, "GET", res)) return;
    return sendStatic(pathname, res);
  }

  if (pathname === "/health") return requireMethod(method, "GET", res) && handleHealth(res);
  if (pathname === "/api/config") return requireMethod(method, "GET", res) && handleConfig(res);

  if (pathname === "/api/incidents") {
    if (!requireMethod(method, "GET", res)) return;
    return handleListIncidents(url.searchParams, res);
  }

  if (pathname === "/api/servers") {
    if (!requireMethod(method, "GET", res)) return;
    return handleListServers(res);
  }

  if (pathname === "/api/demo/reset") {
    if (!requireMethod(method, "POST", res)) return;
    if (!requireSameOriginJson(req, res)) return;
    return readJsonBody(req, res, () => handleDemoReset(res));
  }

  const incidentMatch = pathname.match(/^\/api\/incidents\/(NET-\d{4})\/?(ack|note|simulate-workflow)?$/);
  if (incidentMatch) {
    const [, id, action] = incidentMatch;
    if (!action) {
      if (!requireMethod(method, "GET", res)) return;
      return handleGetIncident(id, res);
    }
    if (action === "ack") {
      if (!requireMethod(method, "POST", res)) return false;
      if (!requireSameOriginJson(req, res)) return;
      return readJsonBody(req, res, (body) => handleAcknowledge(id, body, res));
    }
    if (action === "note") {
      if (!requireMethod(method, "POST", res)) return false;
      if (!requireSameOriginJson(req, res)) return;
      return readJsonBody(req, res, (body) => handleNote(id, body, res));
    }
    // simulate-workflow
    if (!requireMethod(method, "POST", res)) return false;
    if (!requireSameOriginJson(req, res)) return;
    return readJsonBody(req, res, () => handleSimulateWorkflow(id, res));
  }

  if (pathname === "/api") {
    if (!requireMethod(method, "GET", res)) return;
    return sendJson(res, 200, {
      service: "NetAegis synthetic demo API",
      demo: true,
      schema: "Root dashboard incident schema (NET-#### ids; Identity/Configuration/Endpoint; New/In review/Resolved) + n8n contract v1.0.0 alignment",
      dashboard: "GET / and /index.html (root dashboard), /styles.css, /app.js",
      endpoints: [
        "GET  /health",
        "GET  /api/config",
        "GET  /api/incidents?severity=&category=&status=&q=   (Title Case severity; root category labels; status New/In review/Resolved; q searches id/title/asset/category/site like the root UI)",
        "GET  /api/servers                           (fictional Wazuh-agent inventory; no real hosts connected)",
        "GET  /api/incidents/:id",
        "POST /api/incidents/:id/ack               body optional: {\"status\": \"New\"|\"In review\"|\"Resolved\"} (default advances the root cycle New -> In review -> Resolved -> In review)",
        "POST /api/incidents/:id/note              body: {\"text\": \"...\"}",
        "POST /api/incidents/:id/simulate-workflow (idempotent; returns an n8n contract v1.0.0-shaped synthetic event, never delivered)",
        "POST /api/demo/reset                      (clears operator state; equivalent to the root UI's Reset demo)",
      ],
      disclaimer: "Fixture-only demo API on loopback. No live integrations exist in this slice.",
    });
  }

  sendJson(res, 404, { error: "not_found", detail: "Unknown path for the NetAegis demo API." });
}

function requireMethod(actual, allowed, res) {
  if (actual === allowed) return true;
  sendJson(res, 405, { error: "method_not_allowed", allowed });
  return false;
}

function readJsonBody(req, res, then) {
  let size = 0;
  const chunks = [];
  req.on("data", (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      sendJson(res, 413, { error: "payload_too_large", detail: `Demo body limit is ${MAX_BODY_BYTES} bytes.` });
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on("end", () => {
    let body = null;
    const raw = Buffer.concat(chunks).toString("utf8").trim();
    if (raw) {
      try {
        body = JSON.parse(raw);
        if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("not an object");
      } catch {
        return sendJson(res, 400, { error: "bad_request", detail: "Body must be a JSON object." });
      }
    }
    then(body);
  });
}

/* ---------- server lifecycle ---------- */

const server = http.createServer((req, res) => {
  try {
    route(req, res);
  } catch (err) {
    console.error("[netagis] handler error:", err);
    if (!res.headersSent) sendJson(res, 500, { error: "internal_error", demo: true });
  }
});

server.listen(config.port, config.host, () => {
  console.log(
    `[netagis] synthetic dashboard + fixture API listening on http://${config.host}:${config.port}\n` +
      `[netagis] source mode: ${config.sourceMode} · no Wazuh/model/workflow connection exists · state: ${config.stateFilePath || "process memory only"}`
  );
});

process.on("SIGINT", () => {
  console.log("\n[netagis] shutting down demo API");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1000).unref();
});

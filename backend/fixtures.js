/*
 * NetAegis backend demo fixtures.
 *
 * SCHEMA COMPATIBILITY (per coordinator alignment, 31 Oct 2026):
 * the canonical active UI is the ROOT dashboard (app.js/index.html), whose
 * incident schema this file mirrors exactly:
 *
 *   { id, title, category, severity, asset, site, offset, status,
 *     summary, evidence, next }
 *
 *   - id:        "NET-####" (also the pattern required by the n8n contract,
 *                contracts/n8n-notification-event.schema.json)
 *   - category:  "Identity" | "Configuration" | "Endpoint" (root labels;
 *                the n8n contract additionally allows Network/Malware/Policy)
 *   - severity:  Title Case "Critical" | "High" | "Medium" (contract enum)
 *   - status:    "New" | "In review" | "Resolved" (root cycle:
 *                New -> In review -> Resolved -> back to In review)
 *   - offset:    minutes in the past at fixture definition time; the API
 *                derives an occurred_at ISO timestamp from it at request time
 *   - evidence:  multiline key=value string; its "source=fixture:<tag>" line
 *                doubles as the n8n contract's evidence_reference
 *
 * ALL data here is FICTIONAL and machine-generated for a public demo.
 * Asset labels and site names are fictional; no IP addresses, credentials,
 * or real hosts are represented. This module makes no network calls.
 *
 * NOTE: the values are the SAME three seed incidents as root app.js
 * (seedIncidents, storage key netaegis-demo-state-v1). Kept as a byte-similar
 * backend copy so each slice stays independently runnable; dedupe into one
 * shared module when both sides agree on a fixtures owner.
 */

const STATUS_VALUES = ["New", "In review", "Resolved"];

/* Root dashboard ack cycle: New -> In review -> Resolved -> (back to) In review.
 * Matches the cycle the root UI applies on its acknowledge button. */
function nextStatus(status) {
  if (status === "New") return "In review";
  if (status === "In review") return "Resolved";
  return "In review"; // Resolved -> In review (re-open), same as root UI
}

const CATEGORY_VALUES = ["Identity", "Configuration", "Endpoint"];

/* Full category enum from the n8n notification contract v1.0.0. */
const CONTRACT_CATEGORY_VALUES = ["Identity", "Configuration", "Endpoint", "Network", "Malware", "Policy"];

/* Full severity enum from the n8n notification contract v1.0.0. */
const CONTRACT_SEVERITY_VALUES = ["Critical", "High", "Medium", "Low", "Info"];

/* Contract (contracts/n8n-notification-event.schema.json). */
const CONTRACT = {
  id: "https://netaegis.example/contracts/n8n-notification-event/v1/schema.json",
  schemaFile: "contracts/n8n-notification-event.schema.json",
  eventVersion: "1.0.0",
  sourceModes: ["synthetic-fixture", "wazuh-lab"],
  channels: ["simulated", "whatsapp", "sms", "email"],
  demoChannel: "simulated", // the only channel usable in the public demo
};

const INCIDENTS = [
  {
    id: "NET-1042",
    title: "Authentication abuse",
    category: "Identity",
    severity: "Critical",
    asset: "core-mgmt-01",
    site: "North demo site",
    offset: 12,
    status: "New",
    summary: "Repeated unsuccessful sign-ins followed by a successful login on a fictional management host.",
    evidence: "user=demo-operator\nfailed_attempts=8\nresult=success\nsource=fixture:auth-abuse-01",
    next: "Review the sign-in sequence and confirm whether the successful login was expected. The fixture does not establish account compromise.",
  },
  {
    id: "NET-1041",
    title: "Router configuration change",
    category: "Configuration",
    severity: "High",
    asset: "edge-router-03",
    site: "West demo site",
    offset: 48,
    status: "In review",
    summary: "A fictional router configuration changed outside the example maintenance window.",
    evidence: "asset=edge-router-03\nchange=acl-policy.conf\nwindow=closed\nsource=fixture:config-change-01",
    next: "Compare the change with the fictional maintenance record and verify source support before drawing conclusions.",
  },
  {
    id: "NET-1040",
    title: "Suspicious process",
    category: "Endpoint",
    severity: "Medium",
    asset: "lab-endpoint-07",
    site: "Lab demo site",
    offset: 136,
    status: "New",
    summary: "A simulated process alert was raised on an isolated fictional endpoint.",
    evidence: "process=sample-task.exe\nparent=demo-service\naction=none\nsource=fixture:process-01",
    next: "Inspect the process ancestry and event context in the isolated lab. No quarantine or remediation is performed.",
  },
];

/* Derived at load: each incident's n8n evidence_reference, taken from the
 * "source=" line of its evidence string (single source of truth). */
for (const inc of INCIDENTS) {
  const sourceLine = inc.evidence.split("\n").find((l) => l.startsWith("source="));
  inc.evidenceReference = sourceLine ? sourceLine.slice("source=".length) : `fixture:${inc.id.toLowerCase()}`;
}

/*
 * Service status entries. Every entry is deliberately labeled as a demo /
 * not-connected state. Nothing in this slice is a live integration, and the
 * API must never describe these services as live.
 */
const SERVICE_STATUS = [
  {
    name: "Wazuh indexer (upstream)",
    state: "not-connected",
    detail: "Demo — not connected. Real Wazuh lab integration is a separate target phase and is intentionally absent here.",
  },
  {
    name: "Model worker (local model adapter)",
    state: "not-connected",
    detail: "Demo — not connected. 'Local model summary' content shown alongside incidents is illustrative fixture text derived from the incident itself, not model output.",
  },
  {
    name: "Notification workflow (n8n handoff)",
    state: "simulated-only",
    detail: "Demo — simulated only. simulate-workflow records a local synthetic event shaped per contracts/n8n-notification-event.schema.json. No real WhatsApp, SMS, or email is or can be sent.",
  },
  {
    name: "NetAegis demo API itself",
    state: "demo-local",
    detail: "Local fixture-only API bound to the loopback interface by default. Not a monitoring service and not reachable by design beyond this machine's own loopback.",
  },
];

module.exports = {
  INCIDENTS,
  SERVICE_STATUS,
  STATUS_VALUES,
  CATEGORY_VALUES,
  CONTRACT_CATEGORY_VALUES,
  CONTRACT_SEVERITY_VALUES,
  CONTRACT,
  nextStatus,
};

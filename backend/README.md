# OQVIAN NetAegis backend — synthetic demo API (slice 1)

**Status: demo, fixture-only.** This package serves the root dashboard and
fictional incident data from one local HTTP process, in the **root dashboard's exact incident schema** so the root UI
(`index.html`/`app.js`, ids `NET-1042/1041/1040`) can be wired to it without
translation, and with alignment to the n8n notification contract
(`contracts/n8n-notification-event.schema.json`, v1.0.0 — see
`docs/n8n-contract.md`). It has no detection, ingest, monitoring, or
notification capability. No Wazuh, no model, and no n8n connection exists in
this slice — every status surface explicitly says so. See `MASTER_PLAN.md` at
the repo root for overall project context and scope disclaimers.

## Run

Requires Node.js 18+ (built-in `http` module only — **zero npm dependencies**).

```sh
node backend/server.js
```

By default the dashboard and API listen on **http://127.0.0.1:4173** (loopback only).
The server serves only `/`, `/index.html`, `/styles.css`, and `/app.js` as static
assets. Those files and `/api/*` share the same origin, so the browser needs no
cross-origin permissions.

Smoke-check from another terminal:

```sh
curl http://127.0.0.1:4173/health
curl "http://127.0.0.1:4173/api/incidents?severity=Critical"
```

## Incident schema served

Mirrors the root dashboard (`app.js` seedIncidents) field-for-field:

| Field | Example | Notes |
|---|---|---|
| `id` | `NET-1042` | Same `^NET-\d{4}$` pattern as the n8n contract's `incident_id`. |
| `title` / `summary` | `Authentication abuse` | Fixture text. |
| `category` | `Identity` | Root labels: `Identity`, `Configuration`, `Endpoint` (contract enum additionally allows `Network`, `Malware`, `Policy`). |
| `severity` | `Critical` | Title Case; contract enum `Critical/High/Medium/Low/Info`. |
| `asset` | `core-mgmt-01` | Fictional label. |
| `site` | `North demo site` | Fictional site name (root field; not in the n8n event). |
| `offset` | `12` | Minutes in the past (root UI renders this as relative local time). |
| `status` | `New` | Root cycle `New → In review → Resolved → (back to) In review`. |
| `evidence` | multiline `key=value` string | Its `source=fixture:<tag>` line doubles as the contract's `evidence_reference`. |
| `next` | advisory text | The root UI shows this as the "Check" step of the illustrative summary. |

Additive demo-only detail fields (safe for root-schema consumers to ignore):
`occurredAt` (derived from `offset` at backend startup and stable for that run), `sourceMode`
(`synthetic-fixture`, contract enum value), `synthetic: true`,
`evidenceReference`, `note`, `workflowSimulated`, `activity`, and the disclaimer
labels `modelSummaryLabel` ("Illustrative only · no model is connected") and
`demoNotice`.

## Configuration (environment variables only)

| Variable | Default | Meaning |
|---|---|---|
| `NETAEGIS_HOST` | `127.0.0.1` | Bind address. **Loopback-only by default.** Any non-loopback value is refused unless the override below is set (verified: `NETAEGIS_HOST=0.0.0.0` exits with code 1). |
| `NETAEGIS_PORT` | `4173` | Bind port. |
| `NETAEGIS_PERSIST_STATE` | *(unset)* | Optional path of a JSON file mirroring operator state. Unset = process memory only; a restart is a demo reset. Must not point at a synced/committed location. |
| `NETAEGIS_ALLOW_NON_LOOPBACK` | *(unset)* | Must be explicitly `1` to allow binding anywhere other than loopback. Leave unset — the demo is meant to stay local. |

There are **no credential variables**. This slice holds no accounts, tokens, or
keys for any external system, and must not gain any without review.

## Endpoints

| Method | Path | Body | Purpose |
|---|---|---|---|
| GET | `/`, `/index.html` | — | Root dashboard page. |
| GET | `/styles.css`, `/app.js` | — | Allowlisted root dashboard assets only. No directory listing or arbitrary file serving. |
| GET | `/api` | — | API endpoint index + demo disclaimer + served schema description. |
| GET | `/health` | — | Demo status + per-service states (all `not-connected` / `simulated-only` / `demo-local`). |
| GET | `/api/config` | — | Loopback config, incident/server fixture counts, root schema value sets, n8n contract enums, adapter states. |
| GET | `/api/incidents` | — | Fixture incident list (root schema). Query params: `severity` (`Critical`/`High`/`Medium` Title Case), `category` (`Identity`/`Configuration`/`Endpoint`), `status` (`New`/`In review`/`Resolved`), `q` — text search over exactly the root UI's fields `id, title, asset, category, site`. Ordered smallest `offset` first (matches root "recent" ordering). |
| GET | `/api/servers` | — | Fictional multi-server/Wazuh-agent inventory for the demo. It has no product-side count cap; real deployment scale depends on Wazuh, storage, event volume, and model-serving resources. No real hosts are enrolled in this slice. |
| GET | `/api/response-tools` | — | Non-executable allowlist and escalation policy. No remediation action is run by this demo. |
| GET | `/api/incidents/:id` | — | Full incident detail (root schema + additive demo fields, see above). |
| POST | `/api/incidents/:id/ack` | optional `{"status": "New"\|"In review"\|"Resolved"}` | Default advances the root dashboard's acknowledge cycle `New → In review → Resolved → In review`. Local state only. |
| POST | `/api/incidents/:id/note` | `{"text": "..."}` (≤2000 chars) | Save an operator note (root `note` field). Local state only. |
| POST | `/api/incidents/:id/simulate-workflow` | — | Records ONE local **fake** workflow event per incident (idempotent: repeats return `already-simulated` and the same stored event). The event follows n8n contract v1.0.0; it is returned in the response and retained in local demo state. Nothing is sent anywhere. |
| POST | `/api/demo/reset` | — | Clears operator state; incidents restored to fixture defaults (equivalent of the root UI's "Reset demo" button). |

Errors are JSON: `not_found`, `bad_request`, `method_not_allowed` (405),
`payload_too_large` (413, body limit 16 KiB).

## Adapter seam (for later phases)

`backend/adapters.js` defines the replacement contract for the planned
**read-only Wazuh adapter** (including multi-agent inventory and alert
source attribution) and **local-model adapter** (for the single model
integrated with OQVIAN NetAegis through its internal local runtime), plus the
**notification workflow client** and **guarded response-action** boundaries.
The response-action catalog is available from `GET /api/response-tools`, but
its executor is disabled and has no delete, wipe, removal, or arbitrary-command
operation. Calling a disabled operation throws `AdapterUnavailableError`;
`/health` reports the Wazuh and model adapters as `not-connected`, with the
workflow and response catalog as `simulated-only`. Enabling real adapters later
requires the planned restrictions to be implemented first — least-privilege
read-only Wazuh account, validated TLS, bounded/sanitized inputs, evidence
treated as untrusted, structured-output validation, labeled model fallbacks,
tenant-specific authorization, audit logging, human escalation, and the
versioned authenticated workflow contract in `docs/n8n-contract.md`. None of
the live integrations or remediation execution exists here. See
`docs/response-policy.md` for the proposed gates.

## Known limitations of this slice

- In-memory (or optional-file) operator state; no multi-user or
  authentication model at all — this is acceptable **only** because the default
  bind is loopback on a personal demo machine.
- Fixtures are a backend-side copy of the root dashboard's three seed
  incidents (`app.js` seedIncidents). They are intentionally not shared yet,
  since the root app is frontend-owned by the coordinator; dedupe into one
  fixtures module when both sides agree on an owner. Root search/status values
  and the ack cycle are mirrored exactly so wiring later is mechanical.
- `summary`/`next` fields are static prose; the root UI labels the derived
  summary "Illustrative only · no model is connected", and this API adds the
  same label over the API (`modelSummaryLabel`). Never present them as model
  output.
- No pagination yet (3 fixtures); add when the dataset grows.
- No tests yet by coordinator instruction; `node --check` syntax validation and
  manual curl/fetch smoke checks were performed only.
- Service uptime is demonstrated per plan, not guaranteed.
- No CORS is emitted. State-changing routes also require the exact local
  `Origin`, loopback `Host`, and `application/json` content type to reject
  cross-site form submissions. This is browser CSRF protection, not API
  authentication.

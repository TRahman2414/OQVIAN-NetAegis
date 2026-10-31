# OQVIAN NetAegis master plan

Status: implementation in progress, 31 October 2026. The owner authorized the start. Current first slice: synthetic backend API, versioned n8n event contract, and UI review. This plan extends `ISP_Security_Command_Center_Full_Plan.pdf`; it is not evidence that planned integrations already work.

## Goal and scope

Build a public-facing, reproducible synthetic demo of a hybrid security operations system. Keep upstream Wazuh separate and unchanged, with a custom dashboard, backend, and local-model integration that can be adapted for individual companies. The demo should be understandable without customer credentials or real data. Customer installations, actual continuous protection, production monitoring, training a model, and real external notifications are separate follow-on projects, not claims of this demo.

The user's responsibility covers Wazuh integration, dashboard, backend, and the local-model integration. His brother owns n8n workflows and eventual WhatsApp, SMS, and email delivery. They jointly own future model training. Define their integration boundary early so both can work independently.

## Architecture

1. **Event sources:** deterministic synthetic fixtures by default; a separately enabled isolated Wazuh lab using official upstream components is a target integration. Maintain source mode and original event identifiers visibly. Verify real integration before claiming it works. If hardware or schedule prevents the lab, deliver and label the fixture demo and document the missing integration.
2. **Backend and adapter:** normalize incident records; use a restricted, read-only Wazuh indexer account and validated TLS in lab mode; never expose credentials or arbitrary upstream queries to the browser. Keep timestamps, source references, rule IDs, evidence, and synthetic labels. Provide health, filters, pagination, acknowledgements, notes, audit events and safe configuration.
   - **Multi-server fleet:** ingest the Wazuh agent inventory so each customer can enroll as many server hosts as their deployment can support. The dashboard has no fixed product-side server-count cap; Wazuh capacity, storage, event volume, and local-model throughput define practical scale. Attribute each alert to its originating server and make model analysis coverage visible per fleet.
3. **Continuous processing:** Wazuh rules generate detections; a backend-managed worker automatically processes selected incoming and updated incidents through the single local model runtime integrated with OQVIAN NetAegis. Use persistent jobs, idempotency, bounded concurrency, timeouts and retries, and restart recovery. Track backlog, connection health, processing status and failures without exposing a model/provider name or offering a model picker. Service uptime requires a continuously running host and is demonstrated rather than guaranteed.
4. **Model interface:** provide one connection/configuration option for the locally integrated model; do not expose provider/model selection or require customers to choose a model. Limit and sanitize input, treat evidence as untrusted, validate structured output, and record evidence references and uncertainty. Model-generated candidate alerts must be explicitly labeled, traceable to evidence and subject to configurable thresholds and human review. Do not allow the model to execute commands, make network changes, or silently call cloud services. Maintain useful incident access and a labeled fallback when the model is unavailable. Measure latency, resource use and false positives; do not imply comprehensive detection.
5. **Dashboard:** overview with actual calculated counts, recent alerts, timeline and service health; searchable/filterable incident queue; evidence, provenance and activity detail; model findings with uncertainty; acknowledgement and notes; notification preview and simulated delivery status. Always show demo/synthetic mode. Use fictional assets and documentation IP addresses.
6. **Notification boundary:** publish a versioned, authenticated backend-to-n8n event contract. Demo sends only synthetic events to a mock/simulated workflow; no real WhatsApp, SMS or email by default. Keep delivery provider and workflow logic outside the core. See brother's work below.
7. **Packaging:** Compose-based local startup, loopback-bound interfaces, scoped demo reset, versioned fixture data, configuration examples, license inventory, health checks, quick start, screenshots or recorded walkthrough, and clear GitHub documentation. Avoid committing secrets, real logs, or model weights without distribution rights. Exact languages and versions are selected after compatibility and hardware checks.

## Delivery phases

1. **Foundation and contracts:** confirm hardware and offline requirements; select and pin compatible versions; establish folder layout, synthetic schema, event and notification contracts, configuration and task ownership. Define acceptance tests and isolation.
2. **Backend and fixtures:** deterministic three-scenario data, incident API, persistent local state, reset, audit trail, filtering and source provenance. Authentication abuse, configuration change and suspicious process use fictional data.
3. **Dashboard:** responsive visual design, overview, queue, detail, operator actions, states and health. Review accessibility and ensure all counts match fixtures.
4. **Model worker:** integrate the single customer-provided trained model through the OQVIAN NetAegis local runtime, background processing, durable jobs, evidence-linked validated output, safe failure, retry and recovery. Test slow/missing model, malformed output and hostile fixture text. Do not expose model names or model selection in the customer UI.
5. **Wazuh lab:** run the official single-node stack in isolation if resources permit; ingest a test event and confirm mapping, source reference, TLS and least-privilege access. Document exact steps and any missing functionality.
6. **Brother's workflow handoff:** deliver a mock endpoint and agreed contract. Integrate a simulated n8n flow, verify authenticated requests, duplicates, failure states and status reporting. Keep real channels disabled in the public demo.
7. **Audit and release readiness:** clean-machine start and reset, offline prerequisites, tests and accessibility, demo rehearsal, security review, attribution and dependency licenses, screenshots and a concise walkthrough. Audit the final changes; document known limitations and do not describe unverified capabilities as complete.

The prior seven-day schedule is an optimistic estimate, not a promise. Set dates after hardware, agent access, integration complexity, and model performance are known. Core sequence: contracts → backend and fixtures → dashboard → model worker and workflow stub → optional Wazuh lab → verification and packaging.

## Brother's notification work

- Agree on a versioned payload before implementation: event_id and incident_id, event version, source_mode/synthetic flag, severity, category, event time, asset label, bounded summary/evidence reference, requested channel or policy, and correlation/idempotency ID. Avoid sending raw sensitive logs by default. Document schema, authentication, redaction, supported events, acknowledgement and delivery-status callbacks, and compatibility/version changes.
- Build n8n separately with a protected webhook, schema validation, allowlisted event types, idempotency, bounded retries/backoff and audit/status records. Acknowledge receipt separately from successful provider delivery. Avoid loops, duplicate messages and alert floods using deduplication, rate limits and escalation policies.
- First build and test a synthetic local notification sink. Test unauthorized requests, duplicates, timeouts, retries, n8n outage and recovery. No real messages or credentials in the public demo.
- For a later authorized customer deployment: choose and verify WhatsApp, SMS and email providers and licenses, consent and recipient lists, message templates, security, retention, provider limits, delivery receipts and costs. Store credentials in a customer-approved secret store. Agree on ownership, testing, escalation, and operational support. Real notification setup requires explicit customer configuration and approval.

## Agent assignments and coordination

- **Codex coordinator:** maintain architecture, task boundaries, integration, review, tests and truthful progress reporting; no implementation until the owner starts it.
- **GPT-6.1 Terra:** independent architectural/security auditor and advisor; review contracts, substantial changes and final acceptance. Planning audit completed.
- **GPT-6.1 Luna and Antigravity Gemini 3.8 Flash:** intended shared responsibility for complex implementation. Assign separate, well-defined deliverables and review each other's work; 50/50 is a target, not a claim of measured output. Exact requested Gemini model and delivery must be verified.
- **Antigravity Gemini 4 Argon:** intended dashboard and overall design lead; provide design specification and review. Model and delivery unverified.
- **OpenCode GLM 5.3 free:** share base implementation with Kilo across non-overlapping files; OpenCode confirmed `glm-5.3-flash-free` and planning readiness.
- **Kilo Code free-tier model:** share base implementation with OpenCode. CLI and bridge connection verified; active model and readiness unconfirmed. The bridge skill says Kilo does not have a native live-session push adapter; use its CLI to delegate and relay results, rather than assuming live-message delivery.
- Use separate tasks and non-overlapping file ownership, agreed interfaces and integration checkpoints. Review and test every contribution centrally. Do not claim a model was used or an agent is ready without confirmation.

Readiness at planning time: Terra audit completed; OpenCode responded and confirmed model; Antigravity bridge accepted a message but no reply was confirmed (the bridge later reported failure); Kilo installed with MCP connected but its model and actual task execution unverified; Luna is an available Codex model option but has not been launched or tested for this project. Agent/model availability may change. No source code or deployment has been started.

## Acceptance criteria

- A documented clean start opens a synthetic dashboard locally, with three repeatable scenarios and an isolated reset; no real external messages are sent.
- A server inventory can display a growing Wazuh-managed fleet without a hard-coded UI count limit; each host shows agent health, last event, and whether model analysis is available. Public demo rows stay explicitly fictional.
- The local model receives only a versioned, allowlisted response-tool catalog. It cannot delete data, logs, servers, or agent records, wipe storage, or issue arbitrary commands. Critical/high, uncertain, repeated-failure, and failed-remediation cases escalate to customer-authorized contacts and the OQVIAN NetAegis owner through n8n.
- Counts, filters, timestamps, source mode, evidence and actions match known fixtures. Operator acknowledgement and notes persist until reset.
- New or changed incidents generate background processing jobs; jobs survive restart and do not duplicate, with observable pending, success, error and stale states. The dashboard continues to work if the model is down.
- Model output identifies model and time, separates facts from interpretations, references available evidence, handles untrusted input, and never runs actions. Automatic candidate alerts are clearly marked and do not claim certainty.
- The workflow stub enforces authentication, schema and idempotency, shows simulated results, and tolerates n8n unavailability. No provider credentials are required for the demo.
- If Wazuh lab is delivered, demonstrate a real test event end-to-end with provenance; otherwise clearly mark the integration as unfinished.
- Verify startup/reset, unavailable services, duplicate requests, model failures, basic accessibility, dependency licenses, no secrets in Git, and measured local resource needs. Record results and limitations.

## Before customer implementation

Perform customer discovery and obtain written authorization; define supported log sources, ownership, identity/access, retention, production network architecture, data protection, backup, monitoring, patching, recovery and support. Validate actual detection coverage and model quality with representative authorized data. Review exact Wazuh, n8n, model, dependency and distribution terms for the chosen business model. No demo implies compliance certification, guaranteed detection, high availability, or production readiness.

## Open decisions

Demo host OS/RAM/CPU/GPU and disk; framework and persistence choices; exact Wazuh and n8n versions; fixture-first versus mandatory lab in initial release; local model and commercial/redistribution rights; thresholds for model candidate alerts; distribution method for model weights; brother's event contract and chosen notification providers; GitHub repository visibility and license. Resolve these during setup or before the dependent phase, without blocking independent planning.


### Readiness update — 31 October 2026

OpenCode confirmed `glm-5.3-flash-free` through a bridge reply. Kilo completed a no-edit `kilo/kilo-auto/free` CLI test; this is a free router, not a fixed named model, and the bridge does not provide native Kilo live push. Antigravity lists the requested Gemini 4 Argon and Gemini 3.8 Flash variants; a direct Gemini 3.8 Flash test returned READY, and a temporary Gemini 4 Argon session reported successful attach. However, no end-to-end live bridge reply from Antigravity was confirmed; the earlier delivery failed. The requested GPT-6.1 Luna identifier was not available in the listed Codex agent overrides (GPT-6 Luna is listed); do not substitute without the owner's agreement. Terra's planning audit completed. No project implementation has begun.

### Agent preparation update — 31 October 2026

No implementation started; local working tree still contains only the original planning artifacts as untracked files. Current checks:

- OpenCode confirmed active `glm-5.3-flash-free`, planning readiness, and no file edits before an explicit start instruction. Assign it a bounded half of base implementation after contracts are agreed.
- Kilo confirmed planning readiness and no file edits, but `kilo/kilo-auto/free` did not disclose the underlying model/provider. It is a router; confirm an actual free GLM model before relying on the requested GLM 5.3 assignment. Bridge push remains unsupported; use its CLI.
- Antigravity Gemini 3.8 Flash returned a planning-readiness response and said it is attached to the bridge, but no persistent OQVIAN NetAegis Antigravity session appeared in the bridge registry afterward. Use a live bridge acknowledgment before relying on that channel.
- Gemini 4 Argon is listed by `agy models`, but its no-edit planning test did not return before timeout. UI/design assignment remains unconfirmed.
- GPT-6.1 Terra's independent planning audit is complete. GPT-6 Luna is the current Codex model for coordination/complex-case pairing.

Suggested work split once started: agree on API/schema and design tokens first; OpenCode and Kilo each own distinct backend/demo-fixture slices; GPT Luna coordinates complex integration; Antigravity Gemini 3.8 Flash supports bounded complex implementation once bridge delivery is confirmed; Gemini 4 Argon owns UI proposal/review when its session responds; Terra audits architecture and security at checkpoints. No shared-file concurrent edits without an agreed owner.

### Implementation update — 31 October 2026

This update supersedes the earlier planning-only readiness notes above. The owner authorized implementation. First slice now underway:

- The root dashboard is the canonical UI because it is the active preview. The separate `frontend/` OpenCode preview remains untouched pending a later cleanup decision.
- Root dashboard now has larger table/detail text, visible keyboard focus, a keyboard-trapped modal detail drawer with focus restoration, active row feedback, accessible mobile navigation labels, and correct disclosure state for the sample summary.
- A dependency-free Node backend serves a fixture-only API, the root dashboard schema (`NET-1042`, `NET-1041`, `NET-1040`), local operator actions, a simulated workflow, and disabled Wazuh/model adapter seams. It binds to loopback by default.
- The backend serves only the root dashboard's allowlisted HTML/CSS/JS assets on the same origin as the API. Browser actions use the backend when available and retain a browser-local fallback for static-only viewing.
- Kilo authored `contracts/n8n-notification-event.schema.json` and `docs/n8n-contract.md` for the brother's independent n8n build. Kilo's free router selected `nvidia/nemotron-3.5-super-vl:free` for that run and reported zero cost; it did not use GLM.
- OpenCode self-reported `glm-5.3-flash-free` while creating the backend slice. Antigravity Gemini 4 Argon (Medium) reviewed the root UI; the review informed the accessibility/readability changes.

The product still uses synthetic fixtures only. Wazuh, the local model, and real n8n/provider delivery are not connected. The model adapter is a disabled seam; no live monitoring or alerting capability is claimed. The local demo startup command is `node backend/server.js`.

The first slice is now available at `http://127.0.0.1:4173` in the local demo environment. Terra's audit findings were incorporated: API failures remain visible, stale drawer requests cannot update the wrong incident, workflow simulations return the same stored event on duplicate requests, loopback origin checks accept configured loopback addresses, and focus stays within the open drawer. The browser confirms the local API is connected. No automated tests were added or run.

The next UI slice adds a guarded response-policy preview and versioned model action request contract. It explicitly blocks deletion, wipe, server/agent removal, and arbitrary commands; severe, uncertain, repeated-failure, and failed-remediation cases are designed to escalate through the future n8n integration to customer-authorized recipients and the OQVIAN NetAegis owner. The demo exposes a catalog only: it has no action executor and sends no alerts.

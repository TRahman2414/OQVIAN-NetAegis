# NetAegis — n8n notification contract

**Owner:** brother's n8n workflows and eventual WhatsApp, SMS, and email delivery.
**Contract:** `contracts/n8n-notification-event.schema.json` (JSON Schema draft 2020-12, version 1.0.0).
**Planned direction:** NetAegis backend → protected n8n webhook. This document defines a future interface; the current backend does not call n8n.

This document lets the n8n side be built independently of the NetAegis backend. The current demo records a local synthetic workflow event only; it does not send a webhook or contact n8n. No real WhatsApp, SMS, or email is sent, and no provider credentials are required.

## 1. Event payload

When a backend-to-n8n adapter is implemented, it will POST the JSON object described by `contracts/n8n-notification-event.schema.json` to the protected n8n webhook. The current local simulation only records this shape; it makes no HTTP request. Every required field must be present on future events:

| Field | Meaning |
|---|---|
| event_id | UUID uniquely identifying this notification event. |
| incident_id | NetAegis incident id, e.g. `NET-1042`. |
| event_version | Schema version, currently `1.0.0`. Reject unknown versions. |
| source_mode | `synthetic-fixture` (demo) or `wazuh-lab` (future isolated lab). |
| synthetic | Always `true` in the public demo. |
| severity | `Critical`, `High`, `Medium`, `Low`, or `Info`. |
| category | `Identity`, `Configuration`, `Endpoint`, `Network`, `Malware`, or `Policy`. |
| occurred_at | ISO-8601 UTC timestamp of the underlying incident. |
| asset_label | Fictional asset label, e.g. `core-mgmt-01`. Never a real hostname or IP. |
| summary | Bounded summary (<= 1024 chars). No raw logs, credentials, or PII. |
| evidence_reference | Bounded reference tag, e.g. `fixture:auth-abuse-01`. Never raw evidence. |
| idempotency_key | UUID idempotency key for this delivery attempt. |
| notification_policy | Requested channel, urgency, and retry policy (see section 5). |

Example event:

```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "incident_id": "NET-1042",
  "event_version": "1.0.0",
  "source_mode": "synthetic-fixture",
  "synthetic": true,
  "severity": "Critical",
  "category": "Identity",
  "occurred_at": "2026-10-31T09:12:00Z",
  "asset_label": "core-mgmt-01",
  "summary": "Repeated unsuccessful sign-ins followed by a successful login on a fictional management host.",
  "evidence_reference": "fixture:auth-abuse-01",
  "idempotency_key": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "notification_policy": {
    "channel": "simulated",
    "urgency": "immediate",
    "retry": {
      "max_attempts": 3,
      "initial_backoff_seconds": 5
    }
  }
}
```

## 2. Authentication expectations

The future n8n webhook MUST be protected, and n8n MUST verify each backend request before processing. The current backend does not send or authenticate webhook requests:

- Reject requests without valid authentication with `401 Unauthorized`.
- Reject malformed or schema-invalid payloads with `400 Bad Request` (do not process them).
- For a later integration, use a shared-secret-style bearer token or equivalent agreed out of band between the backend owner and the brother. Configure the value locally; never commit it to Git.
- No provider credentials or customer secrets flow through this contract. n8n never needs them in the public demo.
- Log authentication failures minimally (count + redacted identifier); never log the secret itself.

## 3. Redaction

Events carry only fictional demo data by design:

- `asset_label` is a fictional label only.
- `summary` is bounded to 1024 characters and is pre-redacted by the backend.
- `evidence_reference` is a reference tag only (e.g. `fixture:...`), never raw log lines.
- n8n MUST NOT log the full event body to standard outputs or persistent audit records beyond what is needed for status tracking. If an event must be recorded, store `event_id`, `incident_id`, `idempotency_key`, status, and timestamps; avoid storing `summary` or `evidence_reference` verbatim.
- Before any future real-channel deployment (not this demo), apply provider-specific redaction and consent checks. This demo does not configure them.

## 4. Idempotency

When the future backend-to-n8n adapter retries an event, n8n MUST deduplicate:

- On first delivery of a new `idempotency_key`, acknowledge and process normally.
- On any later delivery with the same `idempotency_key`, return the same acknowledgement as the first delivery and do NOT create a duplicate message, duplicate alert, or duplicate delivery attempt.
- Persist acknowledged `idempotency_key` values (with `event_id`, `incident_id`, status, and timestamps) across n8n restarts so duplicates are recognized after recovery.
- Bound the idempotency store (e.g. TTL or max entries) so it cannot grow without limit.

## 5. Acknowledgement vs provider delivery status

These are distinct and MUST be reported separately:

- **Acknowledgement (n8n receipt):** `202 Accepted` once n8n has validated, deduplicated, and queued the event. It means n8n received it, not that any provider delivered it.
- **Provider delivery status:** for a future n8n implementation, outcome of the channel send. Record as `pending`, `delivered`, `failed`, or `suppressed` per event, with a timestamp and reason for failures. The current demo has no provider delivery status.

Future HTTP response contract (not implemented by the current NetAegis backend):

| Status | Meaning |
|---|---|
| `202 Accepted` | Event accepted and queued. Idempotent duplicate of an already-acknowledged key also returns `202`. |
| `400 Bad Request` | Schema validation failed; not processed. |
| `401 Unauthorized` | Authentication missing or invalid. |
| `409 Conflict` | Optional: event_version not supported. |
| `429 Too Many Requests` | Rate limit exceeded; backend may back off and retry. |
| `500 Internal Server Error` | n8n internal failure; backend may retry. |

n8n must record both `acknowledged_at` (receipt time) and `delivery_status`/`delivered_at` (provider outcome) separately in its audit/status records when that future integration exists.

## 6. Retries

- n8n applies bounded retries with exponential backoff for provider delivery failures, honoring `notification_policy.retry.max_attempts` and `notification_policy.retry.initial_backoff_seconds` as a request, while enforcing its own lower caps (recommend max 10 attempts, initial backoff >= 1s).
- Do not retry on `400` or `401` responses from n8n's own validation; those are permanent client errors.
- In a future n8n build, simulate transient provider failures (timeout, 503, network error) to exercise retries without sending real messages.
- Never retry indefinitely; after `max_attempts`, mark the event `failed`, alert within n8n, and stop. Manual intervention is required for further attempts.

## 7. Simulated-only public demo behavior

- The current NetAegis backend runs in `simulated-only` mode. Its local simulation constructs an event with `notification_policy.channel: "simulated"`, records it in demo state, and returns it to the dashboard. It does not call an n8n webhook.
- When a separate n8n workflow is built, its public demo mode should validate synthetic events and record simulated status locally. It must not send real WhatsApp, SMS, or email.
- The current dashboard reports only that a local simulation was recorded. It does not show provider delivery status because no provider or n8n connection exists.
- Nothing in this demo implies real delivery, real channels, or production readiness.
- For a later authorized customer deployment: choose and verify providers, consent and recipient lists, message templates, delivery receipts, and credential storage in a customer-approved secret store. Real notification setup requires explicit customer configuration and approval. None of that exists in this demo.

## 8. Version compatibility

- `event_version` `1.0.0` is the current, only supported version.
- n8n MUST reject any event with an unknown `event_version` (`409 Conflict`) rather than guessing semantics.
- Future versions (if introduced by the backend owner) will be versioned and documented before use. The v1 schema sets `additionalProperties: false`, so consumers must reject unknown fields as well as unknown versions; additive fields require a documented schema version update.

## 9. Independent build checklist for n8n

- [ ] (Future) Protected webhook endpoint with authentication verification.
- [ ] (Future) JSON Schema validation against `contracts/n8n-notification-event.schema.json` (draft 2020-12).
- [ ] (Future) Allowlist of supported event types / severities / categories.
- [ ] (Future) Idempotency store keyed on `idempotency_key`, persisted across restarts, bounded.
- [ ] (Future) Separate acknowledgement (`202 Accepted`) and provider delivery status records.
- [ ] (Future) Bounded retries with exponential backoff; circuit stop after `max_attempts`.
- [ ] (Future) Audit/status records: `event_id`, `incident_id`, `idempotency_key`, `acknowledged_at`, `delivery_status`, `delivered_at`, failure reason.
- [ ] (Future) Simulated local sink for the public demo; no real messages or credentials.
- [ ] (Future) Validate unauthorized requests, duplicates, schema violations, timeouts, retries, n8n outage and recovery in the separate n8n build (not part of this repo).

## 10. What this demo does NOT claim

No real provider integration, no real messages, no credentials, no production monitoring, no guaranteed delivery, and no compliance certification. The current NetAegis API does not contact n8n; the local simulation is only a recorded fake event. The brother's separate workflow is planned work.

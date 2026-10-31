# NetAegis guarded response policy

**Current implementation:** policy preview only. The public demo does not execute actions, connect to Wazuh, call the local model, or send n8n messages.

## Model tool boundary

The model can return only a structured request conforming to
`contracts/model-response-action.schema.json`. A backend policy engine must
validate the request and resolve every target against the authenticated
customer's enrolled Wazuh-agent inventory. The model never receives a shell,
filesystem, network client, Wazuh credential, or arbitrary API tool.

The initial action catalog is deliberately small:

| Action | Policy |
|---|---|
| `collect_diagnostics` | Read-only and eligible for automatic use. Bound output size and redact secrets. |
| `retry_agent_connection` | Low risk, bounded retries, cooldown per agent; eligible only when the agent and action are in scope. |
| `restart_approved_service` | The exact service must be allowlisted by the customer. Human approval is the default; a customer may explicitly pre-authorize a narrowly scoped automatic policy after validation. |
| `restore_approved_config` | Only a customer-approved, versioned known-good snapshot. Human approval is required by default, with rollback and audit record. |

These are future capabilities; no executor is enabled in this demo. The model
can propose an action, but only the backend policy engine may authorize it.
Free-form model text is never interpreted as a command.

## Prohibited operations

The model and automatic executor must never be given tools to delete or wipe
customer files, logs, backups, databases, or server/agent records; remove a
server or Wazuh agent; uninstall monitoring; or run arbitrary shell commands.
Unknown action IDs, out-of-scope agents/services, malformed arguments, and
policy-engine errors fail closed. Preserve evidence and audit records.

## Escalation

Immediately escalate Critical/High severity, uncertain findings, repeated
failures, failed remediation, or actions outside a pre-approved policy. The
future backend will hand an event to the n8n contract and notify the
customer-authorized recipients and the NetAegis system owner. Recipient lists
must be configured per customer; never hard-code contact details. Record
acknowledgement separately from provider delivery status. If n8n is unavailable,
keep the incident visible in NetAegis and mark escalation delivery as failed or
pending for retry; do not claim a message was sent.

## Required controls before enabling execution

- Authentication, per-customer tenant isolation, role checks, and an explicit
  permission for automatic remediation.
- A least-privilege executor separated from the model process. Keep its
  narrowly scoped action credentials separate from the read-only Wazuh/indexer
  integration credentials; never pass either credential to the model or the
  browser.
- Fixed action schemas, target allowlists, severity/confidence gates, rate
  limits, idempotency, timeouts, and per-target cooldowns.
- Human approval by default for service restarts and configuration restore;
  explicit customer policy is needed to automate those actions.
- Before/after state, evidence references, action result, and an immutable
  audit record; tested rollback for any state-changing action.
- A kill switch that disables all state-changing tools without interrupting
  read-only monitoring or incident visibility.
- Synthetic-only public demo behavior, with all actions and notifications
  explicitly marked simulated.

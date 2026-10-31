# Local deployment and remote support

**Current implementation:** this document defines the intended deployment model. The public demo runs a fixture-only API and does not install Wazuh, connect a trained model, run n8n, open remote access, or upload telemetry.

## Customer deployment

The intended system is installed and operated on customer-controlled infrastructure. The dashboard, backend, Wazuh components, integrated local model runtime, and n8n workflow are deployed within the customer's environment. Security monitoring and model analysis continue locally without relying on an OQVIAN cloud service. The public GitHub demo is a separate synthetic preview and is not the customer runtime.

By default, customer events, logs, model prompts/outputs, credentials, incident evidence, and remediation records remain in the customer environment. There is no planned routine telemetry upload or cloud control plane. Any optional support artifact must be selected, minimized, redacted where appropriate, and explicitly approved by the customer before transfer.

## Monthly remote support

An optional support process may let the OQVIAN system owner perform a scheduled monthly health audit and troubleshoot customer-authorized issues. It must not create permanent or unattended access. Before a session begins:

- A customer administrator explicitly approves and starts the session, or approves a clearly scheduled window through a customer-controlled mechanism.
- Access is authenticated with MFA, scoped to the agreed systems and actions, and expires automatically at the end of the approved window.
- The customer can see the active session, revoke it immediately, and review a local audit record of who connected, when, what was inspected, and every requested change and result.
- Audits default to read-only health and configuration checks. Any change requires a separate customer approval unless a narrow, documented maintenance action was explicitly pre-authorized.
- The support channel does not provide unrestricted shell access, access to customer data unrelated to the issue, or authority to delete data, logs, servers, or agent records.
- Remote support is unavailable when not authorized. Monitoring and the local dashboard continue to operate without it.

The connection design should prefer a customer-controlled outbound support gateway or equivalent method that avoids exposing management interfaces directly to the public internet. Credentials and session tokens are short-lived, stored securely, and never embedded in the dashboard or committed to Git. Define the exact transport, identity provider, network rules, approval workflow, and audit retention with each customer before implementation.

## Demo representation

The dashboard labels customer-hosted deployment and monthly remote support as planned architecture. The support card is not a working remote-access feature. The demo must not imply that a customer deployment is already local-only, that any remote session is active, or that an audit or repair has occurred.

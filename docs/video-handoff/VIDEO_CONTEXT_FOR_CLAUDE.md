# OQVIAN NetAegis video handoff — Tanjidur's system portion

**For:** Ahnaf and Claude  
**Purpose:** Supply the product-side visuals and accurate workflow context for the shared OQVIAN NetAegis explainer video. Ahnaf should add his n8n workflow and alert-delivery segment to the final video.

## What this handoff covers

This material covers Tanjidur's part: the customer-hosted dashboard/backend concept, Wazuh data path, integrated local model connection, fleet view, guarded response policy, and optional monthly support concept. The attached diagrams are visual aids for a conceptual product workflow; they are not screenshots of connected integrations.

**Ahnaf: please create and add your own n8n segment** showing how your workflow receives an approved escalation event and notifies customer-authorized people through the channels you configure. Connect it at the “n8n handoff” point shown in the system diagram. Keep the n8n segment clearly labeled as a simulation unless you separately verify the actual workflow and delivery. Do not imply any message was sent by this public demo.

## Accuracy first

The current public build is a synthetic dashboard and fixture-only local API. Its live page displays fictional server and incident records. Wazuh, the customer-provided local model, n8n, real notifications, remote maintenance access, and remediation execution are not connected. The incident “Run simulation” action records a local fake workflow event only.

In the video, distinguish:

- **Demo now:** dashboard, local fixture API, synthetic incidents, fleet preview, response-policy preview.
- **Planned product workflow:** customer-local Wazuh → OQVIAN backend → integrated local model → dashboard, with guarded response decisions.
- **Ahnaf's n8n addition:** the separate notification workflow and channels. Mark as a simulation unless its exact test setup is live and verified.

Do not show “connected”, “live”, “fixed”, or “message delivered” for services/actions that are only planned or simulated. Keep a visible “Synthetic demo / conceptual workflow” caption on conceptual shots.

## Product-side workflow and narration

| Shot | Show | Suggested narration |
|---|---|---|
| 1. Dashboard (0:00–0:20) | Open the OQVIAN NetAegis dashboard. Keep the synthetic-data banner in frame. | “OQVIAN NetAegis is a local-first security operations dashboard concept for reviewing activity across a customer’s server fleet.” |
| 2. Fleet (0:20–0:40) | Show Servers & agents, then Connected services. Point out sample hosts and disconnected Wazuh/model cards. | “In a customer deployment, server agents report to the customer’s Wazuh service. The dashboard is designed to show fleet health and alerts in one place.” |
| 3. Local analysis flow (0:40–1:05) | Use `images/local-system-flow.svg`. Animate the conceptual flow within the customer boundary. | “A local backend is the integration layer: it reads approved alert data, sends bounded context to the model integrated with the product, and returns the result to the dashboard. Customer monitoring data is intended to stay in the customer environment.” |
| 4. Review and response policy (1:05–1:35) | Use `images/guarded-response-flow.svg`, then show an incident detail and its Guarded response tools policy preview. | “The model can recommend only named actions. Diagnostics and a bounded retry are low-risk candidates; service restarts or configuration restores require approval by default. Deletion and arbitrary commands are blocked. The current demo executes none of these actions.” |
| 5. Human escalation handoff (1:35–1:55) | Show the last handoff arrow in the architecture visual. Leave the workflow internals, channels, and alert cards for Ahnaf’s n8n segment. | “When a case is serious, uncertain, or a response fails, the design hands an event to the customer’s notification workflow for human attention.” |
| 6. Monthly support (1:55–2:10) | Use `images/monthly-support-path.svg`; label it “Planned”. | “Optional monthly maintenance is planned through customer-approved, scoped, time-limited access that can be revoked and is recorded for the customer. No always-on support connection is part of the demo.” |
| 7. Close (2:10–2:20) | Return to dashboard and show OQVIAN NetAegis branding. | “This preview uses synthetic data. Customer integrations and operational controls are planned implementation work.” |

Ahnaf can extend the runtime and add his n8n chapter after Shot 5, then adjust the final total length. The timings are guides; do not shorten the accuracy disclosures to make room.

## Capture notes

- Use the local demo at `http://127.0.0.1:4173`; refresh first. Capture Overview, Servers & agents, Connected services, and an incident detail with the response-policy preview.
- Preserve the “DEMO · SYNTHETIC DATA” banner and visible “Not connected”, “Preview only”, or “Simulated” status labels in captures.
- The diagrams are intended-product illustrations, not evidence of a working integration. Label them “Conceptual workflow” or “Planned”.
- Use fictional values only. Avoid real customer incidents, server names, addresses, emails, phone numbers, credentials, or logs.
- Keep the visual tone calm and credible. Avoid fake terminal commands, hacker imagery, flashing attack indicators, or fabricated success screens.

## Claude production prompt

Create a clear, polished explainer video from this brief. The attached images and sequence describe Tanjidur's OQVIAN NetAegis product-side workflow only. Preserve the distinction between the synthetic dashboard that exists today and the planned integrations. Leave a clearly marked n8n notification chapter after the human-escalation handoff for Ahnaf to provide and insert. Do not invent working Wazuh/model/remediation/remote-access status or real message delivery. Return a timed narration script, shot list, on-screen labels, and edit notes.

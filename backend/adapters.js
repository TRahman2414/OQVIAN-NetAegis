/*
 * NetAegis backend — adapter seam.
 *
 * This module is the REPLACEMENT SEAM for later phases. It defines the
 * contract future adapters must implement, and exports deliberately
 * disabled stub objects so the demo slice can describe its own state
 * truthfully ("not connected") without any network behavior.
 *
 * Contract for future adapters (read-only Wazuh indexer, local model via
 * an Ollama-compatible endpoint, notification workflow client):
 *
 *   createAdapter(config) -> {
 *     name:         string,                 // stable identifier, e.g. 'wazuh-indexer'
 *     status:       'not-connected' | 'connected' | 'error' | 'simulated-only',
 *     describe():   state object safe to expose via /health (NO credentials),
 *     // operation methods (adapter-specific), which MUST:
 *     //   - enforce timeouts and bounded results,
 *     //   - validate/normalize upstream data before use,
 *     //   - label provenance (source mode, original ids),
 *     //   - never execute commands, mutate external systems, or
 *     //     silently contact cloud services.
 *   }
 *
 * Rules demonstrated by these stubs:
 *   - Disabled by default; enabling requires explicit configuration plus
 *     review (that wiring is intentionally NOT provided yet).
 *   - Any attempted operation on a disabled adapter throws
 *     AdapterUnavailableError instead of falling back silently.
 *   - No credentials are ever read from environment here; the demo does
 *     not hold any.
 */

"use strict";

class AdapterUnavailableError extends Error {
  constructor(adapterName) {
    super(`Adapter '${adapterName}' is disabled in the NetAegis demo slice (not connected; no live integration exists yet).`);
    this.name = "AdapterUnavailableError";
    this.adapterName = adapterName;
  }
}

/*
 * Wazuh read-only indexer adapter (future). Disabled stub.
 * When implemented: restricted read-only account, validated TLS,
 * bounded queries, never exposes credentials or arbitrary queries to
 * the browser. Nothing of that is implemented here.
 */
function createWazuhAdapter() {
  return {
    name: "wazuh-indexer",
    status: "not-connected",
    describe() {
      return {
        name: this.name,
        state: this.status,
        detail: "Demo — not connected. Reserved seam only; no Wazuh endpoint, account, or TLS configuration exists in this slice.",
        enabled: false,
      };
    },
    fetchEvents() {
      throw new AdapterUnavailableError(this.name);
    },
    listAgents() {
      throw new AdapterUnavailableError(this.name);
    },
  };
}

/*
 * Local model adapter (future, Ollama-compatible endpoint). Disabled stub.
 * When implemented: configurable model identifier, bounded/sanitized
 * input, evidence treated as untrusted, structured-output validation,
 * labeled fallback when the model is down. None of that is here yet.
 */
function createModelAdapter() {
  return {
    name: "local-model",
    status: "not-connected",
    describe() {
      return {
        name: this.name,
        state: this.status,
        detail: "Demo — not connected. Incident 'AI summaries' served by the API are pre-written fixture text, not model output.",
        enabled: false,
        model: null,
      };
    },
    summarize() {
      throw new AdapterUnavailableError(this.name);
    },
  };
}

/*
 * Notification workflow client (future, backend-to-n8n contract holder).
 * Status is 'simulated-only': the demo can record FAKE local dispatch
 * events, and must never send real messages.
 */
function createWorkflowAdapter() {
  return {
    name: "notification-workflow",
    status: "simulated-only",
    describe() {
      return {
        name: this.name,
        state: this.status,
        detail: "Demo — simulated only. Dispatch endpoints record local synthetic events; no real WhatsApp, SMS or email is possible in this slice.",
        enabled: false,
      };
    },
    deliver() {
      throw new AdapterUnavailableError(this.name);
    },
  };
}

module.exports = {
  AdapterUnavailableError,
  createAdapters() {
    return {
      wazuh: createWazuhAdapter(),
      model: createModelAdapter(),
      workflow: createWorkflowAdapter(),
    };
  },
};
